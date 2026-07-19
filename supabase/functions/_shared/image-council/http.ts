import { AppError } from "./errors.ts"

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key, x-image-council-worker-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

export function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...Object.fromEntries(new Headers(extraHeaders).entries()),
    },
  })
}

export function errorResponse(error: unknown): Response {
  if (error instanceof AppError) {
    return json({ error: { code: error.code, message: error.message } }, error.status)
  }
  console.error("image-council unhandled error", error)
  return json({ error: { code: "internal_error", message: "Internal server error" } }, 500)
}

export async function readJsonObject(req: Request, maxBytes = 32_768): Promise<Record<string, unknown>> {
  const contentLength = Number.parseInt(req.headers.get("content-length") ?? "0", 10)
  if (contentLength > maxBytes) throw new AppError("request_too_large", "Request body is too large", 413)

  const text = await req.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new AppError("request_too_large", "Request body is too large", 413)
  }
  try {
    const parsed = JSON.parse(text)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error()
    return parsed as Record<string, unknown>
  } catch {
    throw new AppError("invalid_json", "Request body must be a JSON object", 400)
  }
}

export function methodGuard(req: Request): Response | null {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders })
  if (req.method !== "POST") return json({ error: { code: "method_not_allowed", message: "Method not allowed" } }, 405, { Allow: "POST, OPTIONS" })
  return null
}
