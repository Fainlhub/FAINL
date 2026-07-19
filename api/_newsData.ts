import type { DiscoverableNewsPost } from "../server/newsDiscovery.js";
import { SEO_CONTENT_PAGES } from "../data/seoContent.js";

const STATIC_NEWS_POSTS: DiscoverableNewsPost[] = SEO_CONTENT_PAGES
  .filter((page) => page.section === "nieuws")
  .map((page) => ({
    slug: page.slug,
    title: page.title,
    excerpt: page.description,
    body_markdown: [
      `# ${page.title}`,
      page.intent,
      `## Belangrijkste punten\n${page.takeaways.map((item) => `- ${item}`).join("\n")}`,
      ...page.sections.map((section) => [
        `## ${section.heading}`,
        section.body,
        section.bullets?.map((item) => `- ${item}`).join("\n") || "",
      ].filter(Boolean).join("\n\n")),
    ].join("\n\n"),
    seo_title: page.metaTitle,
    seo_description: page.description,
    hero_image_url: null,
    hero_image_alt: page.title,
    source_links: page.sourceLinks || [],
    published_at: `${page.updated}T08:00:00.000Z`,
    updated_at: `${page.updated}T08:00:00.000Z`,
  }));

function getSupabaseConfig(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";

  if (!url || !key) {
    throw new Error("Supabase public news configuration is missing");
  }
  return { url: url.replace(/\/$/, ""), key };
}

export async function fetchPublishedNews(options: {
  slug?: string;
  limit?: number;
} = {}): Promise<DiscoverableNewsPost[]> {
  let rows: Array<Record<string, unknown>> = [];
  try {
    const { url, key } = getSupabaseConfig();
    const endpoint = new URL(`${url}/rest/v1/news_posts`);
    endpoint.searchParams.set(
      "select",
      "slug,title,excerpt,body_markdown,seo_title,seo_description,hero_image_url,hero_image_alt,source_links,published_at,updated_at"
    );
    endpoint.searchParams.set("status", "eq.published");
    endpoint.searchParams.set("published_at", `lte.${new Date().toISOString()}`);
    endpoint.searchParams.set("order", "published_at.desc");
    endpoint.searchParams.set("limit", String(Math.min(options.limit ?? 50, 50_000)));
    if (options.slug) endpoint.searchParams.set("slug", `eq.${options.slug}`);

    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`Public news query failed (${response.status})`);
    }
    rows = await response.json() as Array<Record<string, unknown>>;
  } catch {
    rows = [];
  }

  const remotePosts = rows
    .filter((row) => typeof row.slug === "string" && typeof row.published_at === "string")
    .map((row) => ({
      slug: String(row.slug),
      title: String(row.title ?? ""),
      excerpt: String(row.excerpt ?? ""),
      body_markdown: String(row.body_markdown ?? ""),
      seo_title: String(row.seo_title ?? row.title ?? ""),
      seo_description: String(row.seo_description ?? row.excerpt ?? ""),
      hero_image_url: typeof row.hero_image_url === "string" ? row.hero_image_url : null,
      hero_image_alt: typeof row.hero_image_alt === "string" ? row.hero_image_alt : null,
      source_links: Array.isArray(row.source_links)
        ? row.source_links.filter((source): source is { label: string; url: string } =>
            Boolean(source) &&
            typeof source === "object" &&
            typeof (source as Record<string, unknown>).label === "string" &&
            typeof (source as Record<string, unknown>).url === "string"
          )
        : [],
      published_at: String(row.published_at),
      updated_at: typeof row.updated_at === "string" ? row.updated_at : String(row.published_at),
    }));

  const remoteSlugs = new Set(remotePosts.map((post) => post.slug));
  const staticPosts = STATIC_NEWS_POSTS.filter((post) =>
    !remoteSlugs.has(post.slug) && (!options.slug || post.slug === options.slug)
  );
  return [...remotePosts, ...staticPosts]
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, options.limit ?? 50);
}
