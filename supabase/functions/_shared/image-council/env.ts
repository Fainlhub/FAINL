import { AppError } from "./errors.ts"
import type { ModelSpec } from "./types.ts"

export function env(name: string): string {
  return Deno.env.get(name)?.trim() ?? ""
}

export function requiredEnv(name: string): string {
  const value = env(name)
  if (!value) throw new AppError("server_misconfigured", `${name} is not configured`, 503)
  return value
}

export function intEnv(name: string, fallback: number, minimum: number, maximum: number): number {
  const value = Number.parseInt(env(name), 10)
  return Number.isFinite(value) ? Math.min(maximum, Math.max(minimum, value)) : fallback
}

export function fixtureModeEnabled(): boolean {
  if (env("IMAGE_COUNCIL_FIXTURE_MODE") !== "true") return false
  return !env("DENO_DEPLOYMENT_ID") || env("IMAGE_COUNCIL_ALLOW_HOSTED_FIXTURES") === "true"
}

export function featureEnabled(): boolean {
  return fixtureModeEnabled() || env("IMAGE_COUNCIL_ENABLED") === "true"
}

export const STORAGE_BUCKET = "image-council"
export const QUEUE_NAME = "image_council_steps"
export const RESERVED_CREDITS = 9 as const

export function generatorModels(): ModelSpec[] {
  return [
    {
      id: "google/gemini-3.1-flash-image",
      provider: "google",
      providerModel: env("IMAGE_COUNCIL_GEMINI_GENERATOR_MODEL") || "gemini-3.1-flash-image",
      envName: "GEMINI_API_KEY",
      displayName: "Gemini 3.1 Flash Image",
    },
    {
      id: "openai/gpt-image-2",
      provider: "openai",
      providerModel: env("IMAGE_COUNCIL_OPENAI_MODEL") || "gpt-image-2",
      envName: "OPENAI_API_KEY",
      displayName: "OpenAI GPT Image 2",
    },
    {
      id: "huggingface/Qwen/Qwen-Image",
      provider: "huggingface",
      providerModel: env("IMAGE_COUNCIL_HF_QWEN_MODEL") || "Qwen/Qwen-Image",
      envName: "HF_TOKEN",
      displayName: "Qwen Image",
    },
    {
      id: "huggingface/Tongyi-MAI/Z-Image-Turbo",
      provider: "huggingface",
      providerModel: env("IMAGE_COUNCIL_HF_ZIMAGE_MODEL") || "Tongyi-MAI/Z-Image-Turbo",
      envName: "HF_TOKEN",
      displayName: "Z-Image Turbo",
    },
    {
      id: "huggingface/stabilityai/stable-diffusion-xl-base-1.0",
      provider: "huggingface",
      providerModel: env("IMAGE_COUNCIL_HF_SDXL_MODEL") || "stabilityai/stable-diffusion-xl-base-1.0",
      envName: "HF_TOKEN",
      displayName: "Stable Diffusion XL",
    },
  ]
}

export function editorModel(): string {
  return env("IMAGE_COUNCIL_GEMINI_EDITOR_MODEL") || "gemini-3-pro-image"
}
