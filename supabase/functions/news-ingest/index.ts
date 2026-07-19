/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const ADMIN_TOKEN = Deno.env.get("NEWS_ADMIN_TOKEN") ?? ""

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-news-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

interface NewsSource {
  id: string
  name: string
  feed_url: string
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function isAuthorized(req: Request): boolean {
  if (!ADMIN_TOKEN) return false
  return req.headers.get("x-news-admin-token") === ADMIN_TOKEN
}

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input)
  const hash = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("")
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ""
    return parsed.toString()
  } catch {
    return url.trim()
  }
}

function decodeXml(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tag(block: string, name: string): string {
  const escaped = name.replace(":", "\\:")
  const match = block.match(new RegExp(`<${escaped}[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))
  return match ? decodeXml(match[1]) : ""
}

function linkHref(block: string): string {
  const alternate = block.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["'][^>]*>/i)
  if (alternate?.[1]) return normalizeUrl(decodeXml(alternate[1]))
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)
  if (href?.[1]) return normalizeUrl(decodeXml(href[1]))
  return normalizeUrl(tag(block, "link"))
}

function blocks(xml: string, name: string): string[] {
  const re = new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "gi")
  const out: string[] = []
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) out.push(match[1])
  return out
}

function parseFeed(xml: string): Array<Record<string, string>> {
  const rssItems = blocks(xml, "item")
  if (rssItems.length) {
    return rssItems.map((item) => ({
      guid: tag(item, "guid") || tag(item, "link"),
      title: tag(item, "title"),
      sourceUrl: normalizeUrl(tag(item, "link")),
      summary: tag(item, "description"),
      author: tag(item, "author") || tag(item, "dc:creator"),
      publishedAt: tag(item, "pubDate"),
    }))
  }

  return blocks(xml, "entry").map((entry) => ({
    guid: tag(entry, "id") || linkHref(entry),
    title: tag(entry, "title"),
    sourceUrl: linkHref(entry),
    summary: tag(entry, "summary") || tag(entry, "content"),
    author: tag(tag(entry, "author"), "name"),
    publishedAt: tag(entry, "published") || tag(entry, "updated"),
  }))
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401)
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Supabase service credentials missing" }, 503)

  const run = await supabase
    .from("news_generation_runs")
    .insert({ run_type: "ingest", status: "running" })
    .select("id")
    .single()

  const runId = run.data?.id
  let itemsSeen = 0
  let itemsUpserted = 0

  try {
    const { data: sources, error } = await supabase
      .from("news_sources")
      .select("id,name,feed_url")
      .eq("enabled", true)

    if (error) throw error

    for (const source of (sources ?? []) as NewsSource[]) {
      const res = await fetch(source.feed_url, {
        headers: { "User-Agent": "FAINL-NewsBot/1.0 (+https://www.fainl.com/nieuws)" },
      })
      if (!res.ok) continue

      const xml = await res.text()
      const entries = parseFeed(xml).filter((entry) => entry.title && entry.sourceUrl).slice(0, 12)
      itemsSeen += entries.length

      for (const entry of entries) {
        const contentHash = await sha256(`${entry.title}|${entry.sourceUrl}|${entry.summary}`)
        const { error: upsertError } = await supabase
          .from("news_items")
          .upsert({
            source_id: source.id,
            guid: entry.guid || entry.sourceUrl,
            source_url: entry.sourceUrl,
            title: entry.title,
            summary: entry.summary || null,
            author: entry.author || source.name,
            published_at: entry.publishedAt ? new Date(entry.publishedAt).toISOString() : null,
            content_hash: contentHash,
            raw_payload: { ...entry, sourceName: source.name },
            updated_at: new Date().toISOString(),
          }, { onConflict: "source_url" })

        if (!upsertError) itemsUpserted += 1
      }
    }

    if (runId) {
      await supabase.from("news_generation_runs").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        items_seen: itemsSeen,
        items_upserted: itemsUpserted,
      }).eq("id", runId)
    }

    return json({ ok: true, itemsSeen, itemsUpserted })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    if (runId) {
      await supabase.from("news_generation_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: message,
      }).eq("id", runId)
    }
    return json({ error: "News ingest failed", detail: isAuthorized(req) ? message : undefined }, 500)
  }
})
