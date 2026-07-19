import { validateImageBytes } from "../crypto.ts"
import { env } from "../env.ts"
import { AppError, ProviderError } from "../errors.ts"
import type { GeneratedImage, GenerationInput, ImageProviderAdapter } from "../types.ts"
import { contentType, providerFetch, upstreamFailure } from "./common.ts"

const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function dimensions(ratio: GenerationInput["aspectRatio"]): { width: number; height: number } {
  if (ratio === "16:9") return { width: 1024, height: 576 }
  if (ratio === "9:16") return { width: 576, height: 1024 }
  if (ratio === "4:5") return { width: 768, height: 960 }
  if (ratio === "3:2") return { width: 960, height: 640 }
  return { width: 768, height: 768 }
}

export class HuggingFaceImageAdapter implements ImageProviderAdapter {
  readonly provider = "huggingface" as const

  async generate(input: GenerationInput): Promise<GeneratedImage> {
    if (input.inputImage) throw new ProviderError(this.provider, "HF image editing is not enabled", false)
    const token = env("HF_TOKEN") || env("HUGGING_FACE_API_KEY")
    if (!token) throw new AppError("provider_not_configured", "HF_TOKEN is not configured", 503)
    if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(input.model)) {
      throw new AppError("server_misconfigured", "Invalid Hugging Face model id", 503)
    }
    const response = await providerFetch(
      this.provider,
      `https://router.huggingface.co/hf-inference/models/${input.model}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "image/png,image/jpeg,image/webp",
        },
        body: JSON.stringify({ inputs: input.prompt, parameters: dimensions(input.aspectRatio) }),
      },
      input.signal,
    )
    if (!response.ok) throw await upstreamFailure(this.provider, response)
    const declaredLength = Number.parseInt(response.headers.get("content-length") ?? "0", 10)
    if (declaredLength > MAX_IMAGE_BYTES) {
      await response.body?.cancel()
      throw new ProviderError(this.provider, "Hugging Face image exceeds the size limit", false)
    }
    const mimeType = contentType(response)
    if (!mimeType) throw new ProviderError(this.provider, "Hugging Face returned a non-image response", false)
    if (!response.body) throw new ProviderError(this.provider, "Hugging Face returned an empty image body", false)
    const reader = response.body.getReader()
    const chunks: Uint8Array[] = []
    let total = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > MAX_IMAGE_BYTES) {
        await reader.cancel()
        throw new ProviderError(this.provider, "Hugging Face image exceeds the size limit", false)
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    validateImageBytes(bytes, mimeType)
    return {
      bytes,
      mimeType,
      model: input.model,
      requestId: response.headers.get("x-request-id") ?? undefined,
    }
  }
}
