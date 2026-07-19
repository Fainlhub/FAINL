import { base64ToBytes, validateImageBytes } from "../crypto.ts"
import { env } from "../env.ts"
import { AppError, ProviderError } from "../errors.ts"
import type { GeneratedImage, GenerationInput, ImageProviderAdapter } from "../types.ts"
import { providerFetch, upstreamFailure } from "./common.ts"

function size(ratio: GenerationInput["aspectRatio"]): string {
  if (ratio === "4:5" || ratio === "9:16") return "1024x1536"
  if (ratio === "3:2" || ratio === "16:9") return "1536x1024"
  return "1024x1024"
}

export class OpenAIImageAdapter implements ImageProviderAdapter {
  readonly provider = "openai" as const

  async generate(input: GenerationInput): Promise<GeneratedImage> {
    if (input.inputImage) throw new ProviderError(this.provider, "OpenAI edit is not enabled for this pipeline step", false)
    const key = env("OPENAI_API_KEY")
    if (!key) throw new AppError("provider_not_configured", "OPENAI_API_KEY is not configured", 503)
    const response = await providerFetch(this.provider, "https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: input.model,
        prompt: input.prompt,
        size: size(input.aspectRatio),
        quality: "medium",
        output_format: "png",
        n: 1,
      }),
    }, input.signal)
    if (!response.ok) throw await upstreamFailure(this.provider, response)
    const payload = await response.json().catch(() => null)
    const encoded = payload?.data?.[0]?.b64_json
    if (typeof encoded !== "string") throw new ProviderError(this.provider, "OpenAI returned no image", false)
    const bytes = base64ToBytes(encoded)
    validateImageBytes(bytes, "image/png")
    return {
      bytes,
      mimeType: "image/png",
      model: input.model,
      requestId: response.headers.get("x-request-id") ?? undefined,
    }
  }
}
