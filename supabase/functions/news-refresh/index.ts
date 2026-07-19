/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
const ADMIN_TOKEN = Deno.env.get("NEWS_ADMIN_TOKEN") ?? ""
const CRON_SECRET = Deno.env.get("NEWS_CRON_SECRET") ?? ""

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  })
}

function isAuthorized(request: Request): boolean {
  const cronSecret = request.headers.get("x-news-cron-secret")
  const adminToken = request.headers.get("x-news-admin-token")
  return Boolean(
    (CRON_SECRET && cronSecret === CRON_SECRET) ||
    (ADMIN_TOKEN && adminToken === ADMIN_TOKEN)
  )
}

async function callStep(
  functionName: "news-ingest" | "news-generate",
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "x-news-admin-token": ADMIN_TOKEN,
    },
    body: JSON.stringify(body),
  })
  const payload = await response.json().catch(() => ({})) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`${functionName} failed (${response.status}): ${JSON.stringify(payload).slice(0, 500)}`)
  }
  return payload
}

serve(async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405)
  if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401)
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ADMIN_TOKEN) {
    return json({ error: "News refresh configuration missing" }, 503)
  }

  const runningSince = new Date(Date.now() - 25 * 60 * 1000).toISOString()
  const existing = await supabase
    .from("news_generation_runs")
    .select("id")
    .eq("run_type", "cron")
    .eq("status", "running")
    .gte("started_at", runningSince)
    .limit(1)

  if (existing.data?.length) {
    return json({ ok: true, skipped: true, reason: "refresh_already_running" })
  }

  const run = await supabase
    .from("news_generation_runs")
    .insert({
      run_type: "cron",
      status: "running",
      metadata: { cadence: "30m", trigger: "news-refresh" },
    })
    .select("id")
    .single()
  const runId = run.data?.id

  try {
    const ingest = await callStep("news-ingest", {})
    const generate = await callStep("news-generate", { force: true, mode: "cron" })

    if (runId) {
      await supabase.from("news_generation_runs").update({
        status: "succeeded",
        finished_at: new Date().toISOString(),
        items_seen: Number(ingest.itemsSeen ?? 0),
        items_upserted: Number(ingest.itemsUpserted ?? 0),
        posts_created: Number(generate.postsCreated ?? 0),
        metadata: { cadence: "30m", ingest, generate },
      }).eq("id", runId)
    }

    return json({ ok: true, ingest, generate })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown refresh error"
    if (runId) {
      await supabase.from("news_generation_runs").update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: message,
      }).eq("id", runId)
    }
    return json({ error: "News refresh failed", detail: message }, 500)
  }
})
