import { base64ToBytes, bytesToBase64, validateImageBytes } from "../crypto.ts"
import { env } from "../env.ts"
import { AppError, ProviderError } from "../errors.ts"
import type { GeneratedImage, GenerationInput, ImageProviderAdapter } from "../types.ts"
import { providerFetch, upstreamFailure } from "./common.ts"

export class GeminiImageAdapter implements ImageProviderAdapter {
  readonly provider = "google" as const

  async generate(input: GenerationInput): Promise<GeneratedImage> {
    const key = env("GEMINI_API_KEY")
    if (!key) throw new AppError("provider_not_configured", "GEMINI_API_KEY is not configured", 503)
    const interactionInput: Record<string, unknown>[] = []
    if (input.inputImage) {
      interactionInput.push({
        type: "image",
        data: bytesToBase64(input.inputImage.bytes),
        mime_type: input.inputImage.mimeType,
      })
    }
    interactionInput.push({ type: "text", text: input.prompt })
    const response = await providerFetch(
      this.provider,
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: input.model,
          input: interactionInput,
          response_format: {
            type: "image",
            mime_type: "image/png",
            aspect_ratio: input.aspectRatio,
            image_size: "1K",
          },
        }),
      },
      input.signal,
    )
    if (!response.ok) throw await upstreamFailure(this.provider, response)
    const payload = await response.json().catch(() => null)
    const finishReason = payload?.status ?? payload?.finish_reason
    if (typeof finishReason === "string" && /SAFETY|BLOCK|REJECT/i.test(finishReason)) {
      throw new ProviderError(this.provider, "Gemini blocked unsafe image output", false, 422)
    }
    const image = findInteractionImage(payload)
    if (!image) throw new ProviderError(this.provider, "Gemini returned no image", false)
    const rawMime = image.mime_type ?? image.mimeType
    const mimeType = rawMime === "image/jpeg" || rawMime === "image/webp" ? rawMime : "image/png"
    const bytes = base64ToBytes(image.data)
    validateImageBytes(bytes, mimeType)
    return {
      bytes,
      mimeType,
      model: input.model,
      requestId: response.headers.get("x-request-id") ?? undefined,
      safety: { finishReason: finishReason ?? null },
    }
  }
}

function findInteractionImage(value: unknown): { data: string; mime_type?: string; mimeType?: string } | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  if (
    typeof record.data === "string" &&
    (
      record.type === "image" ||
      (typeof record.mime_type === "string" && record.mime_type.startsWith("image/")) ||
      (typeof record.mimeType === "string" && record.mimeType.startsWith("image/"))
    )
  ) {
    return record as { data: string; mime_type?: string; mimeType?: string }
  }
  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findInteractionImage(item)
        if (found) return found
      }
    } else if (child && typeof child === "object") {
      const found = findInteractionImage(child)
      if (found) return found
    }
  }
  return null
}
