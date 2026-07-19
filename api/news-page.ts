import type { IncomingMessage, ServerResponse } from "node:http";
import {
  buildNewsArticleHtml,
  buildNewsCollectionHtml,
  escapeHtml,
  NEWS_FALLBACK_IMAGE,
  SITE_URL,
} from "../server/newsDiscovery.js";
import { fetchPublishedNews } from "./_newsData.js";

function requestOrigin(request: IncomingMessage): string {
  const host = request.headers["x-forwarded-host"] || request.headers.host || "fainl.com";
  const protocol = request.headers["x-forwarded-proto"] || (String(host).includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function replaceMeta(template: string, options: {
  title: string;
  description: string;
  canonical: string;
  image: string;
  jsonLd: object;
}): string {
  const escapedTitle = escapeHtml(options.title);
  const escapedDescription = escapeHtml(options.description);
  const escapedCanonical = escapeHtml(options.canonical);
  const escapedImage = escapeHtml(options.image);
  const routeMetadata = [
    `<meta name="description" content="${escapedDescription}" />`,
    '<meta name="robots" content="index, follow, max-image-preview:large" />',
    `<link rel="canonical" href="${escapedCanonical}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="FAINL" />',
    `<meta property="og:url" content="${escapedCanonical}" />`,
    `<meta property="og:title" content="${escapedTitle}" />`,
    `<meta property="og:description" content="${escapedDescription}" />`,
    `<meta property="og:image" content="${escapedImage}" />`,
    '<meta property="og:image:alt" content="FAINL AI nieuws" />',
    '<meta property="og:locale" content="nl_NL" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapedTitle}" />`,
    `<meta name="twitter:description" content="${escapedDescription}" />`,
    `<meta name="twitter:image" content="${escapedImage}" />`,
    `<script type="application/ld+json">${JSON.stringify(options.jsonLd).replace(/</g, "\\u003c")}</script>`,
  ].join("\n");

  return template
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapedTitle}</title>`)
    .replace("</head>", `${routeMetadata}\n</head>`);
}

function replaceRoot(template: string, content: string): string {
  return template.replace(
    /<div id="root">[\s\S]*?<\/div>\s*<script type="module"/i,
    `<div id="root">${content}</div><script type="module"`
  );
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  try {
    const parsedUrl = new URL(request.url || "/", requestOrigin(request));
    const slug = parsedUrl.searchParams.get("slug") || undefined;
    const posts = await fetchPublishedNews({ slug, limit: slug ? 1 : 24 });
    if (slug && posts.length === 0) {
      response.statusCode = 404;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("X-Robots-Tag", "noindex, follow");
      response.end("<!doctype html><html lang=\"nl\"><title>Nieuwsartikel niet gevonden | FAINL</title><body><main><h1>Artikel niet gevonden</h1><p><a href=\"/nieuws\">Naar AI nieuws</a></p></main></body></html>");
      return;
    }

    const templateResponse = await fetch(`${requestOrigin(request)}/index.html`, {
      headers: { Accept: "text/html" },
    });
    if (!templateResponse.ok) throw new Error("Application shell unavailable");
    const template = await templateResponse.text();

    const post = slug ? posts[0] : undefined;
    const canonical = post ? `${SITE_URL}/nieuws/${post.slug}` : `${SITE_URL}/nieuws`;
    const title = post ? `${post.seo_title} | FAINL` : "AI nieuws, modelupdates en kennisbank | FAINL";
    const description = post
      ? post.seo_description
      : "Brongebaseerde AI-updates, modelnieuws en praktische FAINL-duiding voor gebruikers en teams.";
    const image = post?.hero_image_url || NEWS_FALLBACK_IMAGE;
    const jsonLd = post
      ? {
          "@context": "https://schema.org",
          "@type": "NewsArticle",
          headline: post.title,
          description: post.excerpt,
          datePublished: post.published_at,
          dateModified: post.updated_at,
          mainEntityOfPage: canonical,
          image: [image],
          author: { "@type": "Organization", name: "FAINL", url: SITE_URL },
          publisher: { "@type": "Organization", name: "FAINL", url: SITE_URL },
        }
      : {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "FAINL AI nieuws",
          url: canonical,
          mainEntity: {
            "@type": "ItemList",
            itemListElement: posts.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${SITE_URL}/nieuws/${item.slug}`,
              name: item.title,
            })),
          },
        };

    const withMeta = replaceMeta(template, { title, description, canonical, image, jsonLd });
    const content = post ? buildNewsArticleHtml(post) : buildNewsCollectionHtml(posts);
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.setHeader("Cache-Control", "public, s-maxage=600, stale-while-revalidate=1800");
    response.end(replaceRoot(withMeta, content));
  } catch {
    response.statusCode = 503;
    response.setHeader("Content-Type", "text/plain; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.end("FAINL nieuws is tijdelijk niet beschikbaar.");
  }
}
