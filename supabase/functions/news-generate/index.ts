/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const ADMIN_TOKEN = Deno.env.get("NEWS_ADMIN_TOKEN") ?? ""
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? ""
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? ""
const OPENAI_TEXT_MODEL = Deno.env.get("NEWS_TEXT_MODEL") ?? "gpt-4.1-mini"
const OPENAI_IMAGE_MODEL = Deno.env.get("NEWS_IMAGE_MODEL") ?? "gpt-image-1"
const GEMINI_IMAGE_MODEL = Deno.env.get("NEWS_GEMINI_IMAGE_MODEL") ?? "gemini-3.1-flash-image"
const AUTO_PUBLISH = Deno.env.get("NEWS_AUTO_PUBLISH") === "true"

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-news-admin-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
}

interface NewsItem {
  id: string
  source_url: string
  title: string
  summary: string | null
  author: string | null
  published_at: string | null
  news_sources?: { name?: string } | null
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function isAuthorized(req: Request): boolean {
  const token = req.headers.get("x-news-admin-token")
  return Boolean(ADMIN_TOKEN && token === ADMIN_TOKEN)
}

function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 84)
}

function stripJsonFence(text: string): string {
  return text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim()
}

function findImageData(value: unknown): { data: string; mimeType: string } | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const mimeType = typeof record.mime_type === "string" ? record.mime_type : typeof record.mimeType === "string" ? record.mimeType : ""
  if (mimeType.startsWith("image/") && typeof record.data === "string" && record.data.length > 1000) {
    return { data: record.data, mimeType }
  }
  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findImageData(item)
        if (found) return found
      }
    } else if (child && typeof child === "object") {
      const found = findImageData(child)
      if (found) return found
    }
  }
  return null
}

async function createDraft(item: NewsItem): Promise<any> {
  const prompt = `
Je bent de FAINL AI-redactie. Schrijf GEEN vertaling en kopieer GEEN alinea's.
Maak een eigen Nederlandstalig nieuwsartikel op basis van dit bronitem.

Bron:
- Titel: ${item.title}
- Samenvatting: ${item.summary ?? ""}
- URL: ${item.source_url}
- Bronnaam: ${item.news_sources?.name ?? item.author ?? "Onbekend"}
- Gepubliceerd: ${item.published_at ?? "onbekend"}

Regels:
- Native Nederlands, zakelijk, helder.
- Eigen duiding: wat betekent dit voor AI-gebruikers, teams en FAINL's multi-model visie?
- Geen verzonnen feiten.
- Noem dat de bron onderaan gelinkt wordt, maar plaats geen markdownbronlijst in body.
- Maximaal 900 woorden.
- Maak SEO metadata en FAQ.
- Output uitsluitend JSON met keys:
  title, excerpt, bodyMarkdown, seoTitle, seoDescription, keywords, imagePrompt, imageAlt, faq.
`

  if (OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_TEXT_MODEL,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "Je bent een Nederlandse AI-redacteur en SEO-specialist. Je voorkomt plagiaat en maakt brongebaseerde eigen analyse." },
          { role: "user", content: prompt },
        ],
      }),
    })

    if (res.ok) {
      const data = await res.json()
      return JSON.parse(stripJsonFence(data.choices?.[0]?.message?.content ?? "{}"))
    }

    if (![429, 500, 502, 503, 504].includes(res.status) || !GEMINI_API_KEY) {
      throw new Error(`OpenAI text failed ${res.status}`)
    }
  }

  if (!GEMINI_API_KEY) throw new Error("No text generation provider configured")

  const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: `${prompt}\n\nGeef alleen geldig JSON terug.` }] }],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: "application/json",
      },
    }),
  })

  if (!geminiRes.ok) throw new Error(`Gemini text failed ${geminiRes.status}`)
  const data = await geminiRes.json()
  return JSON.parse(stripJsonFence(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}"))
}

async function uploadHeroImage(postId: string, bytes: Uint8Array, contentType: string): Promise<string | null> {
  const ext = contentType.includes("jpeg") || contentType.includes("jpg") ? "jpg" : "png"
  const path = `news/${postId}.${ext}`
  const { error } = await supabase.storage.from("news-images").upload(path, bytes, {
    contentType,
    upsert: true,
  })
  if (error) return null

  const { data: publicUrl } = supabase.storage.from("news-images").getPublicUrl(path)
  return publicUrl.publicUrl
}

async function createHeroImage(postId: string, imagePrompt: string): Promise<{ url: string | null; prompt: string; provider: string | null; error?: string }> {
  if (!imagePrompt) return { url: null, prompt: imagePrompt, provider: null, error: "missing_image_prompt" }

  const prompt = [
    "Editorial website hero image for an AI news article.",
    imagePrompt,
    "Photorealistic or premium editorial technology style.",
    "No readable text, no logos, no watermarks, no UI screenshots.",
    "Wide composition, clean negative space, suitable for a Dutch AI news page.",
  ].join(" ")

  if (OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_IMAGE_MODEL,
        prompt,
        size: "1536x1024",
        quality: "medium",
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const b64 = data.data?.[0]?.b64_json
      if (b64) {
        const bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0))
        const url = await uploadHeroImage(postId, bytes, "image/png")
        if (url) return { url, prompt, provider: "openai" }
      }
      const hostedUrl = data.data?.[0]?.url
      if (hostedUrl) return { url: hostedUrl, prompt, provider: "openai" }
    } else if (!GEMINI_API_KEY) {
      const detail = await res.text().catch(() => "")
      return { url: null, prompt, provider: "openai", error: `openai_${res.status}_${detail.slice(0, 240)}` }
    }
  }

  if (!GEMINI_API_KEY) return { url: null, prompt, provider: null, error: "missing_gemini_api_key" }

  const geminiRes = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: {
      "x-goog-api-key": GEMINI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GEMINI_IMAGE_MODEL,
      input: [{ type: "text", text: prompt }],
      response_format: {
        type: "image",
        mime_type: "image/jpeg",
        aspect_ratio: "3:2",
        image_size: "1K",
      },
    }),
  })

  if (!geminiRes.ok) {
    const detail = await geminiRes.text().catch(() => "")
    return { url: null, prompt, provider: "gemini", error: `gemini_${geminiRes.status}_${detail.slice(0, 240)}` }
  }
  const data = await geminiRes.json()
  const foundImage = findImageData(data)
  const b64 = data.output_image?.data ?? foundImage?.data
  const mimeType = data.output_image?.mime_type ?? foundImage?.mimeType ?? "image/jpeg"
  if (!b64) return { url: null, prompt, provider: "gemini", error: "gemini_missing_output_image" }

  const bytes = Uint8Array.from(atob(b64), (char) => char.charCodeAt(0))
  const url = await uploadHeroImage(postId, bytes, mimeType)
  return { url, prompt, provider: url ? "gemini" : null, error: url ? undefined : "storage_upload_failed" }
}

async function hasRecentPublishedPost(): Promise<boolean> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from("news_posts")
    .select("id")
    .eq("status", "published")
    .gte("published_at", since)
    .limit(1)
  if (error) return false
  return Boolean(data?.length)
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (!["GET", "POST"].includes(req.method)) return json({ error: "Method not allowed" }, 405)
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) return json({ error: "Supabase service credentials missing" }, 503)

  const url = new URL(req.url)
  const action = url.searchParams.get("action")

  if (req.method === "GET" && action === "queue") {
    if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401)
    const { data, error } = await supabase
      .from("news_posts")
      .select("id,slug,status,title,excerpt,created_at,published_at,source_links")
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) return json({ error: "Queue fetch failed" }, 500)
    return json({ posts: data ?? [] })
  }

  if (req.method === "POST" && action === "publish") {
    if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401)
    const body = await req.json().catch(() => ({}))
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return json({ error: "Missing id" }, 400)
    const { error } = await supabase
      .from("news_posts")
      .update({ status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return json({ error: "Publish failed" }, 500)
    return json({ ok: true })
  }

  if (req.method === "POST" && action === "reject") {
    if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401)
    const body = await req.json().catch(() => ({}))
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return json({ error: "Missing id" }, 400)
    const { error } = await supabase
      .from("news_posts")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id)
    if (error) return json({ error: "Reject failed" }, 500)
    return json({ ok: true })
  }

  if (req.method === "POST" && action === "image") {
    if (!isAuthorized(req)) return json({ error: "Unauthorized" }, 401)
    const body = await req.json().catch(() => ({}))
    const id = typeof body.id === "string" ? body.id : ""
    if (!id) return json({ error: "Missing id" }, 400)

    const { data: post, error } = await supabase
      .from("news_posts")
      .select("id,title,image_prompt,hero_image_alt")
      .eq("id", id)
      .maybeSingle()
    if (error || !post) return json({ error: "Post not found" }, 404)

    const image = await createHeroImage(
      post.id,
      post.image_prompt || post.hero_image_alt || post.title,
    )
    if (!image.url) return json({ error: "Image generation failed", provider: image.provider, detail: image.error }, 502)

    const update = await supabase
      .from("news_posts")
      .update({
        hero_image_url: image.url,
        image_prompt: image.prompt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
    if (update.error) return json({ error: "Image update failed" }, 500)
    return json({ ok: true, provider: image.provider })
  }

  const authorized = isAuthorized(req)
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {}
  const force = authorized && body.force === true
  if (!force && await hasRecentPublishedPost()) {
    return json({ ok: true, skipped: true, reason: "recent_post_exists" })
  }

  const run = await supabase
    .from("news_generation_runs")
    .insert({ run_type: "generate", status: "running" })
    .select("id")
    .single()
  const runId = run.data?.id

  try {
    const { data: items, error } = await supabase
      .from("news_items")
      .select("id,source_url,title,summary,author,published_at,news_sources(name)")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(8)

    if (error) throw error

    let created = 0
    for (const item of (items ?? []) as NewsItem[]) {
      const already = await supabase.from("news_posts").select("id").eq("source_item_id", item.id).maybeSingle()
      if (already.data) continue

      const draft = await createDraft(item)
      const baseSlug = slugify(draft.title || item.title)
      const slug = `${baseSlug}-${new Date().toISOString().slice(0, 10)}`
      const insert = await supabase.from("news_posts").insert({
        source_item_id: item.id,
        slug,
        status: AUTO_PUBLISH ? "published" : "review",
        title: draft.title || item.title,
        excerpt: draft.excerpt || item.summary || item.title,
        body_markdown: draft.bodyMarkdown || draft.body_markdown || "",
        seo_title: draft.seoTitle || draft.title || item.title,
        seo_description: draft.seoDescription || draft.excerpt || item.summary || item.title,
        keywords: Array.isArray(draft.keywords) ? draft.keywords.slice(0, 12) : [],
        hero_image_alt: draft.imageAlt || draft.title || item.title,
        image_prompt: draft.imagePrompt || "",
        source_links: [{ label: item.news_sources?.name ?? item.author ?? "Bron", url: item.source_url }],
        generation_model: OPENAI_API_KEY ? OPENAI_TEXT_MODEL : "gemini-2.5-flash",
        generated_at: new Date().toISOString(),
        published_at: AUTO_PUBLISH ? new Date().toISOString() : null,
      }).select("id,image_prompt").single()

      if (insert.error) continue

      const image = await createHeroImage(insert.data.id, insert.data.image_prompt)
      if (image.url) {
        await supabase.from("news_posts").update({ hero_image_url: image.url, image_prompt: image.prompt }).eq("id", insert.data.id)
      }
      created += 1
      break
    }

    if (runId) {
      await supabase.from("news_generation_runs").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        posts_created: created,
      }).eq("id", runId)
    }

    return json({ ok: true, postsCreated: created, autoPublish: AUTO_PUBLISH })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    if (runId) {
      await supabase.from("news_generation_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: message,
      }).eq("id", runId)
    }
    return json({ error: "News generation failed", detail: authorized ? message : undefined }, 500)
  }
})
