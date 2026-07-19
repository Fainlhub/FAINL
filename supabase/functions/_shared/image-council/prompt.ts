import type { StartRequest, StylePreset } from "./types.ts"

const STYLE: Record<StylePreset, string> = {
  auto: "Choose the visual treatment that best serves the brief.",
  photo: "Photographic, credible lighting, natural material detail.",
  illustration: "Purposeful premium illustration, coherent shapes and texture.",
  editorial: "Editorial art direction, clear visual hierarchy and a strong concept.",
  product: "Commercial product image, accurate form, controlled studio lighting.",
}

export function generationPrompt(input: Pick<StartRequest, "prompt" | "aspectRatio" | "stylePreset">): string {
  return [
    input.prompt,
    STYLE[input.stylePreset],
    `Compose for aspect ratio ${input.aspectRatio}.`,
    "Do not add logos, watermarks, signatures, or unreadable pseudo-text unless the brief explicitly requires text.",
  ].join("\n")
}
