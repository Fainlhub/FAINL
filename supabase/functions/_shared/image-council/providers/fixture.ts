import { base64ToBytes, validateImageBytes } from "../crypto.ts"
import type { GeneratedImage, GenerationInput, GeneratorProvider, ImageProviderAdapter } from "../types.ts"

const SAFE_PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="

export class FixtureImageAdapter implements ImageProviderAdapter {
  constructor(readonly provider: GeneratorProvider) {}

  async generate(input: GenerationInput): Promise<GeneratedImage> {
    if (input.signal.aborted) throw input.signal.reason
    const bytes = base64ToBytes(SAFE_PNG)
    validateImageBytes(bytes, "image/png")
    return {
      bytes,
      mimeType: "image/png",
      model: `fixture/${input.model}`,
      requestId: `fixture-${this.provider}`,
      safety: { fixture: true },
      fixture: true,
    }
  }
}
