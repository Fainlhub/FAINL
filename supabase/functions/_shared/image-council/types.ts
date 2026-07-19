export const ASPECT_RATIOS = ["1:1", "4:5", "3:2", "16:9", "9:16"] as const
export type AspectRatio = typeof ASPECT_RATIOS[number]

export const STYLE_PRESETS = ["auto", "photo", "illustration", "editorial", "product"] as const
export type StylePreset = typeof STYLE_PRESETS[number]

export interface StartRequest {
  clientRequestId: string
  prompt: string
  aspectRatio: AspectRatio
  stylePreset: StylePreset
}

export interface StartResponse {
  projectId: string
  runId: string
  status: "queued"
  reservedCredits: 9
}

export const COMMANDS = [
  "cancel_run",
  "retry_step",
  "select_artifact",
  "refine_artifact",
  "delete_project",
] as const
export type ImageCouncilCommand = typeof COMMANDS[number]

export interface CommandRequest {
  clientRequestId: string
  command: ImageCouncilCommand
  projectId: string
  runId?: string
  artifactId?: string
  step?: PipelineStatus
  prompt?: string
}

export const PIPELINE_STATUSES = [
  "queued",
  "moderating",
  "generating",
  "evaluating",
  "debating",
  "refining",
  "ranking",
  "polishing",
  "completed",
  "partial",
  "failed",
  "cancel_requested",
  "cancelled",
  "quarantined",
] as const
export type PipelineStatus = typeof PIPELINE_STATUSES[number]

export type RunStatus = PipelineStatus
export type StepName =
  | "start"
  | "moderate"
  | "generate"
  | "moderate_output"
  | "evaluate"
  | "debate"
  | "refine"
  | "rank"
  | "polish"
  | "recover"
  | "cancel_run"
  | "purge_project"

export type GeneratorProvider = "google" | "openai" | "huggingface"

export interface ModelSpec {
  id: string
  provider: GeneratorProvider
  providerModel: string
  envName: string
  displayName: string
}

export interface QueueStep {
  step: StepName
  run_id: string
  project_id: string
  user_id: string
  model_id?: string
  artifact_id?: string
  source_artifact_id?: string
  stage?: "original" | "refined" | "polished" | "recovery"
  evaluator?: string
  round?: number
  version?: number
  attempt?: number
  command_id?: string
  temporary_path?: string
  mime_type?: ImageMimeType
  sha256?: string
  prompt?: string
  refinement_brief?: string
}

export interface QueueMessage {
  msg_id: number
  read_ct: number
  message: QueueStep
}

export interface GenerationInput {
  prompt: string
  aspectRatio: AspectRatio
  stylePreset: StylePreset
  model: string
  signal: AbortSignal
  inputImage?: { bytes: Uint8Array; mimeType: ImageMimeType }
}

export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp"

export interface GeneratedImage {
  bytes: Uint8Array
  mimeType: ImageMimeType
  model: string
  requestId?: string
  safety?: Record<string, unknown>
  fixture?: boolean
}

export interface ImageProviderAdapter {
  readonly provider: GeneratorProvider
  generate(input: GenerationInput): Promise<GeneratedImage>
}

export interface ModerationResult {
  allowed: boolean
  model: string
  categories: string[]
  fixture?: boolean
}
