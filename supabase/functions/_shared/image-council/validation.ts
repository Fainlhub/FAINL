import { AppError } from "./errors.ts"
import {
  ASPECT_RATIOS,
  COMMANDS,
  PIPELINE_STATUSES,
  STYLE_PRESETS,
  type CommandRequest,
  type ImageCouncilCommand,
  type PipelineStatus,
  type StartRequest,
} from "./types.ts"

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const CLIENT_REQUEST_ID = /^[A-Za-z0-9][A-Za-z0-9._:/-]{7,127}$/

function string(body: Record<string, unknown>, key: string): string {
  return typeof body[key] === "string" ? body[key].trim() : ""
}

function clientRequestId(body: Record<string, unknown>): string {
  const value = string(body, "clientRequestId")
  if (!CLIENT_REQUEST_ID.test(value)) {
    throw new AppError("invalid_client_request_id", "clientRequestId must contain 8-128 safe characters", 400)
  }
  return value
}

export function parseStartRequest(body: Record<string, unknown>): StartRequest {
  const prompt = string(body, "prompt")
  const aspectRatio = string(body, "aspectRatio")
  const stylePreset = string(body, "stylePreset")
  if (prompt.length < 1 || prompt.length > 20_000) {
    throw new AppError("invalid_prompt", "prompt must contain 1-20000 characters", 400)
  }
  if (!ASPECT_RATIOS.includes(aspectRatio as StartRequest["aspectRatio"])) {
    throw new AppError("invalid_aspect_ratio", "Unsupported aspectRatio", 400)
  }
  if (!STYLE_PRESETS.includes(stylePreset as StartRequest["stylePreset"])) {
    throw new AppError("invalid_style_preset", "Unsupported stylePreset", 400)
  }
  return {
    clientRequestId: clientRequestId(body),
    prompt,
    aspectRatio: aspectRatio as StartRequest["aspectRatio"],
    stylePreset: stylePreset as StartRequest["stylePreset"],
  }
}

export function parseCommandRequest(body: Record<string, unknown>): CommandRequest {
  const command = string(body, "command")
  const projectId = string(body, "projectId")
  const runId = string(body, "runId")
  const artifactId = string(body, "artifactId")
  const step = string(body, "step")
  const prompt = string(body, "prompt")
  if (!COMMANDS.includes(command as ImageCouncilCommand)) throw new AppError("invalid_command", "Unsupported command", 400)
  if (!UUID.test(projectId)) throw new AppError("invalid_project_id", "Invalid projectId", 400)
  if (command !== "delete_project" && !UUID.test(runId)) throw new AppError("invalid_run_id", "Invalid runId", 400)
  if ((command === "select_artifact" || command === "refine_artifact") && !UUID.test(artifactId)) {
    throw new AppError("invalid_artifact_id", "Invalid artifactId", 400)
  }
  if (command === "retry_step" && !PIPELINE_STATUSES.includes(step as PipelineStatus)) {
    throw new AppError("invalid_step", "Invalid pipeline step", 400)
  }
  if (command === "refine_artifact" && prompt.length > 4_000) {
    throw new AppError("invalid_prompt", "Refinement prompt must contain at most 4000 characters", 400)
  }
  return {
    clientRequestId: clientRequestId(body),
    command: command as ImageCouncilCommand,
    projectId,
    runId: runId || undefined,
    artifactId: artifactId || undefined,
    step: step as PipelineStatus || undefined,
    prompt: prompt || undefined,
  }
}
