export const SITE_URL = "https://www.fainl.com";
export const NEWS_FALLBACK_IMAGE = `${SITE_URL}/fainl-news-fallback.png`;

export interface DiscoverableNewsPost {
  slug: string;
  title: string;
  excerpt: string;
  body_markdown: string;
  seo_title: string;
  seo_description: string;
  hero_image_url: string | null;
  hero_image_alt: string | null;
  source_links: Array<{ label: string; url: string }>;
  published_at: string;
  updated_at: string;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString();
}

function stripMarkdown(value: string): string {
  return value
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^[#>*+\-\d.\s]+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function markdownToSafeHtml(markdown: string): string {
  const blocks = markdown
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block) => {
    const heading = block.match(/^(#{1,3})\s+(.+)$/s);
    if (heading) {
      const level = Math.min(heading[1].length + 1, 4);
      return `<h${level}>${escapeHtml(stripMarkdown(heading[2]))}</h${level}>`;
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return `<ul>${lines
        .map((line) => `<li>${escapeHtml(stripMarkdown(line.replace(/^[-*]\s+/, "")))}</li>`)
        .join("")}</ul>`;
    }

    return `<p>${escapeHtml(stripMarkdown(lines.join(" ")))}</p>`;
  }).join("");
}

export function buildNewsSitemap(posts: DiscoverableNewsPost[]): string {
  const urls = posts.map((post) => {
    const imageUrl = post.hero_image_url || NEWS_FALLBACK_IMAGE;
    const imageAlt = post.hero_image_alt || post.title;
    return [
      "  <url>",
      `    <loc>${escapeXml(`${SITE_URL}/nieuws/${post.slug}`)}</loc>`,
      `    <lastmod>${escapeXml(safeDate(post.updated_at || post.published_at))}</lastmod>`,
      "    <image:image>",
      `      <image:loc>${escapeXml(imageUrl)}</image:loc>`,
      `      <image:title>${escapeXml(imageAlt)}</image:title>`,
      "    </image:image>",
      "  </url>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    urls,
    "</urlset>",
  ].join("\n");
}

export function buildNewsRss(posts: DiscoverableNewsPost[]): string {
  const items = posts.map((post) => {
    const articleUrl = `${SITE_URL}/nieuws/${post.slug}`;
    const imageUrl = post.hero_image_url || NEWS_FALLBACK_IMAGE;
    const content = markdownToSafeHtml(post.body_markdown).replace(/]]>/g, "]]&gt;");
    return [
      "    <item>",
      `      <title>${escapeXml(post.title)}</title>`,
      `      <link>${escapeXml(articleUrl)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>`,
      `      <pubDate>${new Date(safeDate(post.published_at)).toUTCString()}</pubDate>`,
      `      <description>${escapeXml(post.excerpt)}</description>`,
      `      <media:content url="${escapeXml(imageUrl)}" medium="image" />`,
      `      <content:encoded><![CDATA[${content}]]></content:encoded>`,
      "    </item>",
    ].join("\n");
  }).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"',
    '     xmlns:content="http://purl.org/rss/1.0/modules/content/"',
    '     xmlns:media="http://search.yahoo.com/mrss/">',
    "  <channel>",
    "    <title>FAINL AI nieuws</title>",
    `    <link>${SITE_URL}/nieuws</link>`,
    "    <description>Brongebaseerde AI-updates, in helder Nederlands met FAINL-duiding.</description>",
    "    <language>nl-NL</language>",
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");
}

export function buildNewsCollectionHtml(posts: DiscoverableNewsPost[]): string {
  const cards = posts.map((post) => `
    <article>
      <h2><a href="/nieuws/${escapeHtml(post.slug)}">${escapeHtml(post.title)}</a></h2>
      <p>${escapeHtml(post.excerpt)}</p>
      <time datetime="${escapeHtml(post.published_at)}">${escapeHtml(post.published_at.slice(0, 10))}</time>
    </article>
  `).join("");

  return `
    <main id="main-content">
      <header>
        <p>FAINL AI nieuws</p>
        <h1>AI nieuws, modelupdates en praktische gidsen</h1>
        <p>Brongebaseerde updates met onafhankelijke FAINL-duiding voor AI-gebruikers en teams.</p>
      </header>
      <section aria-label="Laatste nieuws">${cards}</section>
    </main>
  `;
}

export function buildNewsArticleHtml(post: DiscoverableNewsPost): string {
  const imageUrl = post.hero_image_url || NEWS_FALLBACK_IMAGE;
  const sources = post.source_links.map((source) =>
    `<li><a href="${escapeHtml(source.url)}" rel="noreferrer">${escapeHtml(source.label)}</a></li>`
  ).join("");

  return `
    <main id="main-content">
      <article>
        <nav aria-label="Broodkruimel"><a href="/">Home</a> / <a href="/nieuws">Nieuws</a></nav>
        <header>
          <p>FAINL nieuws</p>
          <h1>${escapeHtml(post.title)}</h1>
          <p>${escapeHtml(post.excerpt)}</p>
          <time datetime="${escapeHtml(post.published_at)}">${escapeHtml(post.published_at.slice(0, 10))}</time>
        </header>
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(post.hero_image_alt || post.title)}" width="1536" height="1024" />
        <div>${markdownToSafeHtml(post.body_markdown)}</div>
        ${sources ? `<section><h2>Bronnen</h2><ul>${sources}</ul></section>` : ""}
      </article>
    </main>
  `;
}
