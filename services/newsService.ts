import { supabase } from "./supabaseClient";

export interface NewsPost {
  id: string;
  slug: string;
  status: "draft" | "review" | "published" | "rejected";
  title: string;
  excerpt: string;
  body_markdown: string;
  seo_title: string;
  seo_description: string;
  keywords: string[];
  hero_image_url: string | null;
  hero_image_alt: string | null;
  source_links: Array<{ label: string; url: string }>;
  published_at: string | null;
  created_at: string;
}

const NEWS_SELECT = [
  "id",
  "slug",
  "status",
  "title",
  "excerpt",
  "body_markdown",
  "seo_title",
  "seo_description",
  "keywords",
  "hero_image_url",
  "hero_image_alt",
  "source_links",
  "published_at",
  "created_at",
].join(",");

function normalizePost(row: any): NewsPost {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    title: row.title,
    excerpt: row.excerpt,
    body_markdown: row.body_markdown,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
    hero_image_url: row.hero_image_url ?? null,
    hero_image_alt: row.hero_image_alt ?? null,
    source_links: Array.isArray(row.source_links) ? row.source_links : [],
    published_at: row.published_at ?? null,
    created_at: row.created_at,
  };
}

export async function getPublishedNewsPosts(limit = 24): Promise<NewsPost[]> {
  const { data, error } = await supabase
    .from("news_posts")
    .select(NEWS_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(normalizePost);
}

export async function getPublishedNewsPost(slug: string): Promise<NewsPost | null> {
  const { data, error } = await supabase
    .from("news_posts")
    .select(NEWS_SELECT)
    .eq("status", "published")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return normalizePost(data);
}

async function callNewsFunction<T>(name: "news-ingest" | "news-generate", token: string, body?: unknown, query = ""): Promise<T> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${name}${query}`;
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
      "x-news-admin-token": token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Nieuwsactie mislukt (${res.status})`);
  return res.json();
}

export async function ingestNews(token: string) {
  return callNewsFunction<{ ok: boolean; itemsSeen: number; itemsUpserted: number }>("news-ingest", token, {});
}

export async function generateNewsDraft(token: string, force = true) {
  return callNewsFunction<{ ok: boolean; postsCreated: number; skipped?: boolean; reason?: string }>("news-generate", token, { force });
}

export async function getNewsQueue(token: string) {
  return callNewsFunction<{ posts: NewsPost[] }>("news-generate", token, undefined, "?action=queue");
}

export async function publishNewsPost(token: string, id: string) {
  return callNewsFunction<{ ok: boolean }>("news-generate", token, { id }, "?action=publish");
}

export async function rejectNewsPost(token: string, id: string) {
  return callNewsFunction<{ ok: boolean }>("news-generate", token, { id }, "?action=reject");
}
