export type ImageCouncilStatus =
  | "queued"
  | "moderating"
  | "generating"
  | "evaluating"
  | "debating"
  | "refining"
  | "ranking"
  | "polishing"
  | "completed"
  | "partial"
  | "cancel_requested"
  | "cancelled"
  | "failed"
  | "quarantined";

export type ImageCouncilStage =
  | "briefing"
  | "making"
  | "reviewing"
  | "refining"
  | "selection";

const STATUS_STAGE: Record<ImageCouncilStatus, ImageCouncilStage> = {
  queued: "briefing",
  moderating: "briefing",
  generating: "making",
  evaluating: "reviewing",
  debating: "reviewing",
  refining: "refining",
  ranking: "selection",
  polishing: "selection",
  completed: "selection",
  partial: "selection",
  cancel_requested: "selection",
  cancelled: "selection",
  failed: "selection",
  quarantined: "selection",
};

export function mapImageCouncilStatus(status: ImageCouncilStatus): ImageCouncilStage {
  return STATUS_STAGE[status];
}

function seedHash(seed: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededRandom(seed: string): () => number {
  let state = seedHash(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function deterministicShuffle<T>(values: readonly T[], seed: string): T[] {
  const shuffled = [...values];
  const random = seededRandom(seed);

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }

  return shuffled;
}

export interface BlindCandidate {
  blindId: string;
  candidateId: string;
}

export function createBlindOrder(
  candidateIds: readonly string[],
  seed: string,
): BlindCandidate[] {
  if (!validateUniqueIds(candidateIds)) {
    throw new RangeError("Candidate ids must be non-empty and unique");
  }

  return deterministicShuffle(candidateIds, seed).map((candidateId, index) => ({
    blindId: `candidate-${String(index + 1).padStart(2, "0")}`,
    candidateId,
  }));
}

export function validateRanking(
  candidateIds: readonly string[],
  rankedCandidateIds: readonly string[],
): boolean {
  if (!validateUniqueIds(candidateIds) || candidateIds.length !== rankedCandidateIds.length) {
    return false;
  }

  const expected = new Set(candidateIds);
  const ranked = new Set(rankedCandidateIds);
  return ranked.size === rankedCandidateIds.length
    && rankedCandidateIds.every((candidateId) => expected.has(candidateId));
}

function validateUniqueIds(ids: readonly string[]): boolean {
  return ids.length > 0
    && ids.every((id) => id.trim().length > 0)
    && new Set(ids).size === ids.length;
}

const MAX_BRANCH_CREDITS = 5;
const MAX_COUNCIL_CREDITS = 1;
const MAX_POLISH_CREDITS = 3;
export const MAX_IMAGE_COUNCIL_CREDITS =
  MAX_BRANCH_CREDITS + MAX_COUNCIL_CREDITS + MAX_POLISH_CREDITS;

export interface SettlementInput {
  reservedCredits: number;
  successfulBranches: number;
  councilBundleCompleted: boolean;
  successfulPolishes: number;
}

export interface Settlement {
  reservedCredits: number;
  chargedCredits: number;
  refundedCredits: number;
}

export function calculateSettlement(input: SettlementInput): Settlement {
  assertIntegerInRange(
    "reservedCredits",
    input.reservedCredits,
    0,
    MAX_IMAGE_COUNCIL_CREDITS,
  );
  assertIntegerInRange(
    "successfulBranches",
    input.successfulBranches,
    0,
    MAX_BRANCH_CREDITS,
  );
  assertIntegerInRange(
    "successfulPolishes",
    input.successfulPolishes,
    0,
    MAX_POLISH_CREDITS,
  );

  const chargedCredits =
    input.successfulBranches
    + (input.councilBundleCompleted ? MAX_COUNCIL_CREDITS : 0)
    + input.successfulPolishes;

  if (chargedCredits > input.reservedCredits) {
    throw new RangeError("Charged credits cannot exceed reserved credits");
  }

  return {
    reservedCredits: input.reservedCredits,
    chargedCredits,
    refundedCredits: input.reservedCredits - chargedCredits,
  };
}

function assertIntegerInRange(
  name: string,
  value: number,
  minimum: number,
  maximum: number,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
}

export const IMAGE_COUNCIL_MODEL_BRANCHES = [
  { provider: "google", model: "gemini-3.1-flash-image" },
  { provider: "openai", model: "gpt-image-2" },
  { provider: "huggingface", model: "Qwen/Qwen-Image" },
  { provider: "huggingface", model: "Tongyi-MAI/Z-Image-Turbo" },
  {
    provider: "huggingface",
    model: "stabilityai/stable-diffusion-xl-base-1.0",
  },
] as const;

export type ImageCouncilProviderKey =
  (typeof IMAGE_COUNCIL_MODEL_BRANCHES)[number]["provider"];
export type ImageCouncilBranchModel =
  (typeof IMAGE_COUNCIL_MODEL_BRANCHES)[number]["model"];
export type ImageFixtureMimeType = "image/png" | "image/jpeg" | "image/webp";

export interface ParsedProviderFixture {
  provider: ImageCouncilProviderKey;
  bytes: Uint8Array;
  mimeType: ImageFixtureMimeType;
  model: ImageCouncilBranchModel;
  providerRequestId?: string;
  providerSafety?: Record<string, unknown>;
  fixture: true;
}

export function parseProviderFixture(
  provider: ImageCouncilProviderKey,
  fixture: unknown,
): ParsedProviderFixture {
  const payload = asRecord(fixture, `${provider} fixture`);

  if (provider === "google") return parseGoogleFixture(payload);
  if (provider === "openai") return parseOpenAiFixture(payload);
  return parseHuggingFaceFixture(payload);
}

function parseGoogleFixture(payload: Record<string, unknown>): ParsedProviderFixture {
  const candidates = asArray(payload.candidates, "Google candidates");
  const candidate = asRecord(candidates[0], "Google candidate");
  const content = asRecord(candidate.content, "Google candidate content");
  const parts = asArray(content.parts, "Google candidate parts");

  for (const partValue of parts) {
    const part = asRecord(partValue, "Google candidate part");
    const inlineValue = part.inlineData ?? part.inline_data;
    if (!inlineValue) continue;

    const inlineData = asRecord(inlineValue, "Google inline image");
    return buildParsedFixture({
      provider: "google",
      base64: requiredString(inlineData.data, "Google image data"),
      mimeType: requiredString(
        inlineData.mimeType ?? inlineData.mime_type,
        "Google image MIME type",
      ),
      model: requiredString(
        payload.modelVersion ?? payload.model,
        "Google model",
      ),
      providerRequestId: optionalString(payload.responseId ?? payload.id),
      providerSafety: candidate.safetyRatings === undefined
        ? undefined
        : { safetyRatings: candidate.safetyRatings },
    });
  }

  throw new TypeError("Google fixture does not contain an inline image");
}

function parseOpenAiFixture(payload: Record<string, unknown>): ParsedProviderFixture {
  const data = asArray(payload.data, "OpenAI image data");
  const image = asRecord(data[0], "OpenAI image");

  return buildParsedFixture({
    provider: "openai",
    base64: requiredString(
      image.b64_json ?? image.base64,
      "OpenAI image data",
    ),
    mimeType: optionalString(image.mime_type ?? image.mimeType) ?? "image/png",
    model: requiredString(payload.model, "OpenAI model"),
    providerRequestId: optionalString(payload.id ?? payload.request_id),
  });
}

function parseHuggingFaceFixture(
  payload: Record<string, unknown>,
): ParsedProviderFixture {
  const image = payload.image ? asRecord(payload.image, "Hugging Face image") : payload;

  return buildParsedFixture({
    provider: "huggingface",
    base64: requiredString(
      image.base64 ?? image.bodyBase64 ?? image.bytesBase64,
      "Hugging Face image data",
    ),
    mimeType: requiredString(
      image.mimeType ?? image.contentType ?? payload.mimeType ?? payload.contentType,
      "Hugging Face image MIME type",
    ),
    model: requiredString(payload.model, "Hugging Face model"),
    providerRequestId: optionalString(payload.requestId ?? payload.id),
  });
}

interface FixtureParts {
  provider: ImageCouncilProviderKey;
  base64: string;
  mimeType: string;
  model: string;
  providerRequestId?: string;
  providerSafety?: Record<string, unknown>;
}

function buildParsedFixture(parts: FixtureParts): ParsedProviderFixture {
  const model = parseBranchModel(parts.provider, parts.model);
  return {
    provider: parts.provider,
    bytes: decodeBase64(parts.base64),
    mimeType: parseImageMimeType(parts.mimeType),
    model,
    ...(parts.providerRequestId ? { providerRequestId: parts.providerRequestId } : {}),
    ...(parts.providerSafety ? { providerSafety: parts.providerSafety } : {}),
    fixture: true,
  };
}

function decodeBase64(value: string): Uint8Array {
  const encoded = value.includes(",") ? value.slice(value.indexOf(",") + 1) : value;
  if (!encoded) throw new TypeError("Fixture image data must not be empty");

  try {
    const binary = atob(encoded);
    if (!binary) throw new Error();
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    throw new TypeError("Fixture image data must be valid base64");
  }
}

function parseBranchModel(
  provider: ImageCouncilProviderKey,
  model: string,
): ImageCouncilBranchModel {
  const branch = IMAGE_COUNCIL_MODEL_BRANCHES.find(
    (candidate) => candidate.provider === provider && candidate.model === model,
  );
  if (!branch) {
    throw new TypeError(`Unsupported ${provider} model branch: ${model}`);
  }
  return branch.model;
}

function parseImageMimeType(value: string): ImageFixtureMimeType {
  if (value === "image/png" || value === "image/jpeg" || value === "image/webp") {
    return value;
  }
  throw new TypeError(`Unsupported fixture image MIME type: ${value}`);
}

function asRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

function asArray(value: unknown, name: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new TypeError(`${name} must be a non-empty array`);
  }
  return value;
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${name} must be a non-empty string`);
  }
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
