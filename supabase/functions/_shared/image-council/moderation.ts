import { bytesToBase64 } from "./crypto.ts"
import { env, fixtureModeEnabled } from "./env.ts"
import { AppError } from "./errors.ts"
import type { GeneratedImage, ModerationResult } from "./types.ts"

async function moderate(input: unknown): Promise<ModerationResult> {
  if (fixtureModeEnabled()) return { allowed: true, model: "fixture-moderation-v1", categories: [], fixture: true }
  const key = env("OPENAI_API_KEY")
  if (!key) throw new AppError("moderation_unavailable", "OPENAI_API_KEY is required for moderation", 503, true)
  let response: Response
  try {
    response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "omni-moderation-latest", input }),
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw new AppError("moderation_unavailable", "Moderation request failed", 503, true)
  }
  if (!response.ok) {
    throw new AppError("moderation_unavailable", `Moderation returned HTTP ${response.status}`, 503, response.status === 429 || response.status >= 500)
  }
  const payload = await response.json().catch(() => null)
  const results = Array.isArray(payload?.results) ? payload.results : []
  if (!results.length) throw new AppError("moderation_unavailable", "Moderation returned no result", 503, true)
  const categories: string[] = results.flatMap((result: Record<string, unknown>): string[] => {
    const values = result.categories && typeof result.categories === "object"
      ? result.categories as Record<string, unknown>
      : {}
    return Object.entries(values).filter(([, value]) => value === true).map(([name]) => name)
  })
  return {
    allowed: !results.some((result: Record<string, unknown>) => result.flagged === true),
    model: typeof payload.model === "string" ? payload.model : "omni-moderation-latest",
    categories: [...new Set<string>(categories)],
  }
}

export function moderatePrompt(prompt: string): Promise<ModerationResult> {
  return moderate(prompt)
}

export function moderateImage(prompt: string, image: GeneratedImage): Promise<ModerationResult> {
  return moderate([
    { type: "text", text: prompt },
    { type: "image_url", image_url: { url: `data:${image.mimeType};base64,${bytesToBase64(image.bytes)}` } },
  ])
}
