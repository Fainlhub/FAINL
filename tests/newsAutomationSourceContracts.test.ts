import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

describe("news automation source contracts", () => {
  it("schedules one secured refresh every thirty minutes", () => {
    const migration = read("supabase/migrations/20260719183000_news_half_hour_refresh.sql");
    expect(migration).toContain("'*/30 * * * *'");
    expect(migration).toContain("'x-news-cron-secret'");
    expect(migration).toContain("news_refresh_secret");
  });

  it("runs ingest before generation and requests the cron publication gate", () => {
    const refresh = read("supabase/functions/news-refresh/index.ts");
    expect(refresh.indexOf('callStep("news-ingest"')).toBeLessThan(
      refresh.indexOf('callStep("news-generate"')
    );
    expect(refresh).toContain('{ force: true, mode: "cron" }');
    expect(refresh).toContain("refresh_already_running");
  });

  it("only auto-publishes quality-approved articles with generated images", () => {
    const generate = read("supabase/functions/news-generate/index.ts");
    expect(generate).toContain("autoPublishRequested && quality.valid && Boolean(image.url)");
    expect(generate).toContain('status: canPublish ? "published" : "review"');
    expect(generate).toContain('NEWS_IMAGE_MODEL") ?? "gpt-image-2"');
  });

  it("keeps private routes out of indexing and exposes dynamic discovery", () => {
    const robots = read("public/robots.txt");
    const sitemap = read("public/sitemap.xml");
    const vercel = JSON.parse(read("vercel.json")) as {
      rewrites: Array<{ source: string; destination: string }>;
    };

    expect(robots).toContain("User-agent: OAI-SearchBot");
    expect(robots).toContain("User-agent: GPTBot\nDisallow: /");
    expect(sitemap).toContain("https://www.fainl.com/api/news-sitemap");
    expect(vercel.rewrites[0]).toEqual({
      source: "/nieuws",
      destination: "/api/news-page",
    });
    expect(vercel.rewrites).not.toContainEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });

  it("loads news ads only after explicit advertising consent", () => {
    const loader = read("components/AdSenseLoader.tsx");
    const slot = read("components/ads/NewsAdSlot.tsx");
    const app = read("App.tsx");

    expect(loader).toContain("hasAdvertisingConsent()");
    expect(loader).toContain("if (disabled || !hasAdvertisingConsent())");
    expect(slot).toContain("hasAdvertisingConsent()");
    expect(slot).toContain("VITE_ADSENSE_NEWS_SLOT");
    expect(app).toContain("showContentAds");
  });
});
