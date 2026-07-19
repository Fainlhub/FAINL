import { bytesToBase64, sha256Hex } from "./crypto.ts"
import { env, fixtureModeEnabled } from "./env.ts"
import { AppError, ProviderError } from "./errors.ts"
import type { GeneratedImage } from "./types.ts"

export interface EvaluationResult {
  criteria: Record<string, number>
  argumentation: string
  confidence: number
}

export interface DebateResult {
  artifacts: Array<{ artifactId: string; criteria: Record<string, number>; argumentation: string; confidence: number }>
}

export interface RankingResult {
  artifactIds: string[]
  argumentation: string
  confidence: number
}

function bounded(value: unknown, fallback = 0.5): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback
}

function jsonObject(text: string): Record<string, unknown> {
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim()
  try {
    const value = JSON.parse(clean)
    if (value && typeof value === "object" && !Array.isArray(value)) return value
  } catch {
    // Normalized provider error below.
  }
  throw new ProviderError("evaluator", "Evaluator returned invalid JSON", true)
}

async function fixtureEvaluation(image: GeneratedImage): Promise<EvaluationResult> {
  const hash = await sha256Hex(image.bytes)
  const score = 0.55 + (Number.parseInt(hash.slice(0, 2), 16) / 255) * 0.4
  return {
    criteria: { brief: score, composition: Math.max(0, score - 0.04), craft: Math.min(1, score + 0.03), safety: 1 },
    argumentation: "Deterministic fixture evaluation.",
    confidence: 0.9,
  }
}

async function googleJson(model: string, prompt: string, image?: GeneratedImage): Promise<Record<string, unknown>> {
  const key = env("GEMINI_API_KEY")
  if (!key) throw new AppError("provider_not_configured", "GEMINI_API_KEY is not configured", 503)
  const parts: Record<string, unknown>[] = [{ text: prompt }]
  if (image) parts.unshift({ inlineData: { mimeType: image.mimeType, data: bytesToBase64(image.bytes) } })
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new ProviderError("google", `Google evaluator returned HTTP ${response.status}`, response.status === 429 || response.status >= 500)
  const payload = await response.json()
  return jsonObject(payload?.candidates?.[0]?.content?.parts?.[0]?.text ?? "")
}

async function openAiJson(model: string, prompt: string, image?: GeneratedImage): Promise<Record<string, unknown>> {
  const key = env("OPENAI_API_KEY")
  if (!key) throw new AppError("provider_not_configured", "OPENAI_API_KEY is not configured", 503)
  const content: Record<string, unknown>[] = [{ type: "text", text: prompt }]
  if (image) content.push({ type: "image_url", image_url: { url: `data:${image.mimeType};base64,${bytesToBase64(image.bytes)}` } })
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      temperature: 0.2,
      messages: [{ role: "user", content }],
    }),
    signal: AbortSignal.timeout(60_000),
  })
  if (!response.ok) throw new ProviderError("openai", `OpenAI evaluator returned HTTP ${response.status}`, response.status === 429 || response.status >= 500)
  const payload = await response.json()
  return jsonObject(payload?.choices?.[0]?.message?.content ?? "")
}

async function evaluatorJson(catalogId: string, prompt: string, image?: GeneratedImage): Promise<Record<string, unknown>> {
  if (fixtureModeEnabled()) {
    if (image) return fixtureEvaluation(image) as unknown as Record<string, unknown>
    return { artifacts: [], artifactIds: [], argumentation: "Deterministic fixture result.", confidence: 0.9 }
  }
  const separator = catalogId.indexOf("/")
  const provider = catalogId.slice(0, separator)
  const model = catalogId.slice(separator + 1)
  return provider === "openai" ? openAiJson(model, prompt, image) : googleJson(model, prompt, image)
}

export async function evaluateBlind(
  evaluatorCatalogId: string,
  brief: string,
  blindLabel: string,
  image: GeneratedImage,
): Promise<EvaluationResult> {
  if (fixtureModeEnabled()) return fixtureEvaluation(image)
  const result = await evaluatorJson(evaluatorCatalogId, [
    "Evaluate this anonymous candidate image against the brief. Do not infer or mention its provider.",
    `Brief: ${brief}`,
    `Anonymous label: ${blindLabel}`,
    "Return JSON: {criteria:{brief,composition,craft,safety},argumentation,confidence}. Scores are 0..1.",
  ].join("\n"), image)
  const criteriaRaw = result.criteria && typeof result.criteria === "object" ? result.criteria as Record<string, unknown> : {}
  return {
    criteria: {
      brief: bounded(criteriaRaw.brief),
      composition: bounded(criteriaRaw.composition),
      craft: bounded(criteriaRaw.craft),
      safety: bounded(criteriaRaw.safety, 1),
    },
    argumentation: typeof result.argumentation === "string" ? result.argumentation.slice(0, 20_000) : "Geen toelichting.",
    confidence: bounded(result.confidence),
  }
}

export async function debateWithPeerScores(
  evaluatorCatalogId: string,
  rows: Array<{ artifactId: string; own: Record<string, unknown>; peers: number[] }>,
): Promise<DebateResult> {
  if (fixtureModeEnabled()) {
    return {
      artifacts: rows.map((row) => ({
        artifactId: row.artifactId,
        criteria: row.own as Record<string, number>,
        argumentation: "Fixture peer-score debate.",
        confidence: 0.9,
      })),
    }
  }
  const result = await evaluatorJson(evaluatorCatalogId, [
    "Reconsider your anonymous image assessments using only anonymized peer average scores.",
    JSON.stringify(rows),
    "Return JSON: {artifacts:[{artifactId,criteria:{brief,composition,craft,safety},argumentation,confidence}]}",
  ].join("\n"))
  const artifacts = Array.isArray(result.artifacts) ? result.artifacts : []
  return {
    artifacts: artifacts.flatMap((value: unknown) => {
      if (!value || typeof value !== "object") return []
      const row = value as Record<string, unknown>
      const criteria = row.criteria && typeof row.criteria === "object" ? row.criteria as Record<string, unknown> : {}
      return [{
        artifactId: String(row.artifactId ?? ""),
        criteria: {
          brief: bounded(criteria.brief),
          composition: bounded(criteria.composition),
          craft: bounded(criteria.craft),
          safety: bounded(criteria.safety, 1),
        },
        argumentation: typeof row.argumentation === "string" ? row.argumentation.slice(0, 20_000) : "Geen toelichting.",
        confidence: bounded(row.confidence),
      }]
    }),
  }
}

export async function rankFromDebate(
  evaluatorCatalogId: string,
  summaries: Array<{ artifactId: string; scores: number[] }>,
): Promise<RankingResult> {
  if (fixtureModeEnabled()) {
    return { artifactIds: [...summaries].sort((a, b) => (b.scores[0] ?? 0) - (a.scores[0] ?? 0)).map((row) => row.artifactId), argumentation: "Fixture ranking.", confidence: 0.9 }
  }
  const result = await evaluatorJson(evaluatorCatalogId, [
    "Rank these anonymous candidates using the council's round-two scores.",
    JSON.stringify(summaries),
    "Return JSON: {artifactIds:[best,...],argumentation,confidence}. Use only supplied artifactId values.",
  ].join("\n"))
  return {
    artifactIds: Array.isArray(result.artifactIds) ? result.artifactIds.filter((id): id is string => typeof id === "string") : [],
    argumentation: typeof result.argumentation === "string" ? result.argumentation.slice(0, 20_000) : "Geen toelichting.",
    confidence: bounded(result.confidence),
  }
}
