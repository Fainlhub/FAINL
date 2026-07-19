import { fixtureModeEnabled } from "../env.ts"
import type { GeneratorProvider, ImageProviderAdapter } from "../types.ts"
import { FixtureImageAdapter } from "./fixture.ts"
import { GeminiImageAdapter } from "./gemini.ts"
import { HuggingFaceImageAdapter } from "./hugging-face.ts"
import { OpenAIImageAdapter } from "./openai.ts"

export function imageAdapter(provider: GeneratorProvider): ImageProviderAdapter {
  if (fixtureModeEnabled()) return new FixtureImageAdapter(provider)
  if (provider === "google") return new GeminiImageAdapter()
  if (provider === "openai") return new OpenAIImageAdapter()
  return new HuggingFaceImageAdapter()
}
