import { describe, expect, it } from "vitest";
import {
  buildNewsArticleHtml,
  buildNewsRss,
  buildNewsSitemap,
  type DiscoverableNewsPost,
  markdownToSafeHtml,
} from "../server/newsDiscovery";

const post: DiscoverableNewsPost = {
  slug: "nieuwe-ai-update",
  title: "Nieuwe AI-update voor Nederlandse teams",
  excerpt: "Een concrete update met gevolgen voor teams die meerdere AI-modellen gebruiken.",
  body_markdown: "## Wat verandert er?\n\nDe update verbetert controle.\n\n- Sneller\n- Beter controleerbaar",
  seo_title: "Nieuwe AI-update voor teams",
  seo_description: "Lees wat deze AI-update verandert voor Nederlandse teams en gecontroleerde multi-model workflows.",
  hero_image_url: "https://example.supabase.co/storage/news.jpg?x=1&y=2",
  hero_image_alt: "Vijf analyses komen samen in een gecontroleerd resultaat",
  source_links: [{ label: "Primaire bron", url: "https://example.com/source?a=1&b=2" }],
  published_at: "2026-07-19T16:00:00.000Z",
  updated_at: "2026-07-19T16:30:00.000Z",
};

describe("news discovery output", () => {
  it("builds a canonical image sitemap with an accurate lastmod", () => {
    const xml = buildNewsSitemap([post]);
    expect(xml).toContain("https://www.fainl.com/nieuws/nieuwe-ai-update");
    expect(xml).toContain("2026-07-19T16:30:00.000Z");
    expect(xml).toContain("news.jpg?x=1&amp;y=2");
    expect(xml).toContain("<image:image>");
  });

  it("builds an RSS feed with full safe article content", () => {
    const xml = buildNewsRss([post]);
    expect(xml).toContain("<rss version=\"2.0\"");
    expect(xml).toContain("<content:encoded><![CDATA[");
    expect(xml).toContain("<h3>Wat verandert er?</h3>");
    expect(xml).toContain("<li>Sneller</li>");
  });

  it("escapes generated HTML and source metadata", () => {
    const unsafe = { ...post, body_markdown: "<script>alert(1)</script>" };
    const html = buildNewsArticleHtml(unsafe);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("rel=\"noreferrer\"");
  });

  it("strips markdown links without turning them into untrusted anchors", () => {
    expect(markdownToSafeHtml("[Bron](https://malicious.example)")).toBe("<p>Bron</p>");
  });
});
