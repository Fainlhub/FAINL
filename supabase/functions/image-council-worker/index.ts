/// <reference lib="deno.ns" />

import { adminClient, authenticateWorker, type DatabaseClient } from "../_shared/image-council/auth.ts"
import { debateWithPeerScores, evaluateBlind, rankFromDebate } from "../_shared/image-council/council.ts"
import { deterministicUuid } from "../_shared/image-council/crypto.ts"
import { editorModel, generatorModels, RESERVED_CREDITS, STORAGE_BUCKET } from "../_shared/image-council/env.ts"
import { AppError, errorMessage } from "../_shared/image-council/errors.ts"
import { appendEvent } from "../_shared/image-council/events.ts"
import { errorResponse, json, methodGuard } from "../_shared/image-council/http.ts"
import { kickWorker } from "../_shared/image-council/kick.ts"
import { moderateImage, moderatePrompt } from "../_shared/image-council/moderation.ts"
import { generationPrompt } from "../_shared/image-council/prompt.ts"
import { imageAdapter } from "../_shared/image-council/providers/index.ts"
import { ImageCouncilQueue } from "../_shared/image-council/queue.ts"
import {
  downloadPrivateImage,
  promoteTemporaryImage,
  removePrivateImage,
  uploadTemporaryImage,
} from "../_shared/image-council/storage.ts"
import type { ModelSpec, QueueMessage, QueueStep, StartRequest } from "../_shared/image-council/types.ts"

interface RunRow {
  id: string
  user_id: string
  project_id: string
  prompt: string
  status: string
  aspect_ratio: StartRequest["aspectRatio"]
  style_preset: StartRequest["stylePreset"]
}

interface IdRow {
  id: string
}

interface ModelPolicyRow extends IdRow {
  enabled: boolean
  kill_switch: boolean
  commercial_use_allowed: boolean
  license_policy_accepted: boolean
}

interface EvaluationRow {
  artifact_id: string
  evaluator_model_catalog_id: string
  criteria: Record<string, unknown>
  argumentation?: string
}

interface RefinementRow extends IdRow {
  parent_artifact_id: string
}

async function runRow(admin: DatabaseClient, step: QueueStep): Promise<RunRow> {
  const { data } = await admin.from("image_runs").select("id,user_id,project_id,prompt,status,aspect_ratio,style_preset").eq("id", step.run_id).eq("user_id", step.user_id).maybeSingle()
  if (!data) throw new AppError("run_not_found", "Queued run no longer exists", 404)
  return data as RunRow
}

async function stage(admin: DatabaseClient, run: RunRow, name: string, payload: Record<string, unknown> = {}): Promise<void> {
  if (["moderating", "generating", "evaluating", "debating", "refining", "ranking", "polishing", "cancel_requested"].includes(name)) {
    await admin.from("image_runs").update({ status: name }).eq("id", run.id).not("status", "in", "(completed,partial,failed,cancelled)")
  }
  await appendEvent(admin, {
    key: `pipeline:${name}:${run.id}`,
    userId: run.user_id,
    projectId: run.project_id,
    runId: run.id,
    eventType: `pipeline.${name}`,
    payload,
  })
}

async function enqueueOnce(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow, key: string, eventType: string, steps: QueueStep[]): Promise<void> {
  const event = await appendEvent(admin, {
    key,
    userId: run.user_id,
    projectId: run.project_id,
    runId: run.id,
    eventType,
    payload: { count: steps.length },
  })
  if (!event.inserted) return
  for (const step of steps) await queue.send(step)
}

function settings(run: RunRow): Pick<StartRequest, "prompt" | "aspectRatio" | "stylePreset"> {
  return {
    prompt: run.prompt,
    aspectRatio: run.aspect_ratio,
    stylePreset: run.style_preset,
  }
}

async function handleStart(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow): Promise<void> {
  if (["cancelled", "failed", "completed", "partial", "quarantined"].includes(run.status)) return
  await stage(admin, run, "moderating")
  const moderation = await moderatePrompt(run.prompt)
  if (!moderation.allowed) {
    await stage(admin, run, "quarantined", { categories: moderation.categories })
    const { data: reservation } = await admin.from("credit_reservations").select("id").eq("run_id", run.id).maybeSingle()
    if (reservation) await admin.rpc("refund_image_credits", {
      p_reservation_id: reservation.id,
      p_failure_code: "prompt_quarantined",
      p_failure_detail: "Prompt moderation blocked the run",
      p_outcome: "quarantined",
    })
    return
  }
  await admin.from("image_runs").update({ status: "generating", started_at: new Date().toISOString() }).eq("id", run.id).in("status", ["queued", "moderating"])
  const models = generatorModels()
  const { data: catalog } = await admin.from("image_model_catalog").select("id,enabled,kill_switch,commercial_use_allowed,license_policy_accepted").in("id", models.map((model) => model.id))
  const catalogRows = (catalog ?? []) as ModelPolicyRow[]
  const allowed = new Set(catalogRows.filter((row) =>
    row.enabled && !row.kill_switch && row.commercial_use_allowed && row.license_policy_accepted
  ).map((row) => row.id))
  const active = models.filter((model) => allowed.has(model.id))
  if (active.length !== models.length) {
    throw new AppError("generator_catalog_unavailable", "Exactly five commercially approved image models are required", 503)
  }
  const steps: QueueStep[] = []
  for (const model of active) {
    steps.push({ step: "generate", run_id: run.id, project_id: run.project_id, user_id: run.user_id, model_id: model.id, stage: "original" })
  }
  await stage(admin, run, "generating", { models: active.map((model) => model.id) })
  await enqueueOnce(admin, queue, run, `fanout:generators:${run.id}`, "steps.generators_queued", steps)
}

async function modelForStep(admin: DatabaseClient, modelId: string): Promise<ModelSpec> {
  const spec = generatorModels().find((model) => model.id === modelId)
  if (!spec) throw new AppError("unknown_model", "Unknown model in queue step", 422)
  const { data } = await admin.from("image_model_catalog").select("enabled,kill_switch,commercial_use_allowed,license_policy_accepted").eq("id", modelId).maybeSingle()
  if (!data?.enabled || data.kill_switch || !data.commercial_use_allowed || !data.license_policy_accepted) {
    throw new AppError("model_disabled", "Model is disabled or not commercially approved", 422)
  }
  return spec
}

async function handleGenerate(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow, step: QueueStep): Promise<void> {
  if (!step.model_id) throw new AppError("invalid_step", "Generation step has no model", 422)
  const artifactId = await deterministicUuid(`artifact:${run.id}:${step.model_id}:${step.stage ?? "original"}`)
  const { data: existing } = await admin.from("image_artifacts").select("id").eq("id", artifactId).maybeSingle()
  if (existing) return
  const model = await modelForStep(admin, step.model_id)
  const { data: branch } = await admin.from("image_branches").select("id").eq("run_id", run.id).eq("model_catalog_id", model.id).maybeSingle()
  if (!branch) throw new AppError("branch_not_found", "Generator branch not found", 422)
  await admin.from("image_branches").update({ status: "generating", started_at: new Date().toISOString() }).eq("id", branch.id).eq("status", "queued")
  const request = settings(run)
  const image = await imageAdapter(model.provider).generate({
    ...request,
    prompt: generationPrompt(request),
    model: model.providerModel,
    signal: AbortSignal.timeout(90_000),
  })
  const temporary = await uploadTemporaryImage(admin, run.user_id, run.id, artifactId, image)
  await queue.send({
    step: "moderate_output",
    run_id: run.id,
    project_id: run.project_id,
    user_id: run.user_id,
    model_id: model.id,
    artifact_id: artifactId,
    stage: step.stage ?? "original",
    temporary_path: temporary.path,
    mime_type: image.mimeType,
    sha256: temporary.sha256,
  })
}

async function maybeAdvance(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow): Promise<void> {
  const expected = generatorModels().length
  const { count: terminalBranches } = await admin
    .from("image_branches")
    .select("id", { count: "exact", head: true })
    .eq("run_id", run.id)
    .in("status", ["completed", "failed", "quarantined", "cancelled"])
  if ((terminalBranches ?? 0) < expected) return
  const { data: artifacts } = await admin.from("image_artifacts").select("id").eq("run_id", run.id).eq("kind", "original")
  const { data: evaluators } = await admin.from("image_model_catalog")
    .select("id")
    .eq("model_role", "evaluator")
    .eq("enabled", true)
    .eq("kill_switch", false)
    .eq("commercial_use_allowed", true)
    .eq("license_policy_accepted", true)
    .order("sort_order")
  if (!(artifacts?.length) || evaluators?.length !== 3) throw new AppError("evaluator_catalog_unavailable", "Exactly three evaluators are required", 503)
  await stage(admin, run, "evaluating")
  const artifactRows = (artifacts ?? []) as IdRow[]
  const evaluatorRows = (evaluators ?? []) as IdRow[]
  const steps = artifactRows.flatMap((artifact) => evaluatorRows.map((evaluator) => ({
    step: "evaluate" as const,
    run_id: run.id,
    project_id: run.project_id,
    user_id: run.user_id,
    artifact_id: artifact.id,
    evaluator: evaluator.id,
    round: 1,
  })))
  await enqueueOnce(admin, queue, run, `advance:evaluate:${run.id}`, "steps.evaluation_queued", steps)
}

async function handleModerateOutput(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow, step: QueueStep): Promise<void> {
  if (!step.temporary_path || !step.artifact_id || !step.model_id) throw new AppError("invalid_step", "Output moderation step is incomplete", 422)
  const { data: existing } = await admin.from("image_artifacts").select("id").eq("id", step.artifact_id).maybeSingle()
  if (existing) {
    await removePrivateImage(admin, step.temporary_path).catch(() => undefined)
    if (step.stage === "original") {
      await admin.from("image_branches").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        failure_code: null,
        failure_detail: null,
      }).eq("run_id", run.id).eq("model_catalog_id", step.model_id)
      await maybeAdvance(admin, queue, run)
    } else if (step.stage === "refined") {
      await maybeQueueRanking(admin, queue, run)
    } else if (step.stage === "polished") {
      await maybeFinish(admin, run)
    }
    return
  }
  const downloaded = await downloadPrivateImage(admin, step.temporary_path)
  const image = { ...downloaded, model: step.model_id }
  const moderation = await moderateImage(run.prompt, image)
  if (!moderation.allowed) {
    await removePrivateImage(admin, step.temporary_path)
    await appendEvent(admin, {
      key: `blocked:${step.artifact_id}`,
      userId: run.user_id,
      projectId: run.project_id,
      runId: run.id,
      eventType: "artifact.quarantined",
      payload: { modelId: step.model_id, categories: moderation.categories },
    })
    if (step.stage === "original") {
      await admin.from("image_branches").update({
        status: "quarantined",
        failure_code: "output_moderation",
        failure_detail: moderation.categories.join(", ").slice(0, 500),
        completed_at: new Date().toISOString(),
      }).eq("run_id", run.id).eq("model_catalog_id", step.model_id).in("status", ["queued", "generating"])
      await maybeAdvance(admin, queue, run)
    } else if (step.stage === "refined") {
      await maybeQueueRanking(admin, queue, run)
    } else if (step.stage === "polished") {
      await maybeFinish(admin, run)
    }
    return
  }
  let branchId: string | null = null
  if (step.stage === "original") {
    const { data: branch } = await admin.from("image_branches").select("id").eq("run_id", run.id).eq("model_catalog_id", step.model_id).maybeSingle()
    if (!branch) throw new AppError("branch_not_found", "Generator branch not found", 422)
    branchId = branch.id
  } else if (step.source_artifact_id) {
    const { data: source } = await admin.from("image_artifacts").select("branch_id").eq("id", step.source_artifact_id).eq("run_id", run.id).maybeSingle()
    branchId = step.stage === "polished" || step.stage === "recovery" ? null : source?.branch_id ?? null
  }
  const path = await promoteTemporaryImage(admin, step.temporary_path, run.user_id, run.project_id, run.id, step.artifact_id, image)
  const requested = settings(run).aspectRatio
  const dimensions = requested === "16:9" ? { width: 1024, height: 576 }
    : requested === "9:16" ? { width: 576, height: 1024 }
    : requested === "4:5" ? { width: 768, height: 960 }
    : requested === "3:2" ? { width: 960, height: 640 }
    : { width: 1024, height: 1024 }
  const { error } = await admin.from("image_artifacts").insert({
    id: step.artifact_id,
    user_id: run.user_id,
    project_id: run.project_id,
    run_id: run.id,
    branch_id: branchId,
    model_catalog_id: step.model_id,
    kind: step.stage === "polished" || step.stage === "recovery" ? "finalist" : step.stage === "refined" ? "refinement" : "original",
    parent_artifact_id: step.source_artifact_id ?? null,
    version: step.version ?? (step.stage === "refined" ? 2 : 1),
    storage_path: path,
    mime_type: image.mimeType,
    checksum_sha256: step.sha256,
    width_px: dimensions.width,
    height_px: dimensions.height,
    byte_size: image.bytes.length,
    metadata: {
      stage: step.stage ?? "original",
      moderation,
      refinement_brief: step.refinement_brief ?? null,
      credit_scope: step.stage === "recovery" ? "included_finalist_polish" : null,
    },
  })
  if (error && error.code !== "23505") throw new AppError("artifact_create_failed", "Artifact could not be recorded", 503, true)
  if (step.stage === "original" && branchId) {
    await admin.from("image_branches").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      failure_code: null,
      failure_detail: null,
    }).eq("id", branchId)
    await maybeAdvance(admin, queue, run)
  } else if (step.stage === "refined") {
    await maybeQueueRanking(admin, queue, run)
  } else if (step.stage === "polished") {
    await maybeFinish(admin, run)
  } else if (step.stage === "recovery") {
    await appendEvent(admin, {
      key: `recovery-completed:${step.artifact_id}`,
      userId: run.user_id,
      projectId: run.project_id,
      runId: run.id,
      artifactId: step.artifact_id,
      eventType: "artifact.recovered",
      payload: { sourceArtifactId: step.source_artifact_id },
    })
  }
}

function score(criteria: Record<string, unknown>): number {
  const values = Object.values(criteria).map(Number).filter(Number.isFinite)
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0
}

async function artifactImage(admin: DatabaseClient, artifactId: string, runId: string) {
  const { data } = await admin.from("image_artifacts").select("id,storage_path,mime_type,branch_id,model_catalog_id").eq("id", artifactId).eq("run_id", runId).maybeSingle()
  if (!data) throw new AppError("artifact_not_found", "Artifact not found", 404)
  const downloaded = await downloadPrivateImage(admin, data.storage_path)
  return { row: data, image: { ...downloaded, model: data.model_catalog_id } }
}

async function handleEvaluate(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow, step: QueueStep): Promise<void> {
  if (!step.artifact_id || !step.evaluator) throw new AppError("invalid_step", "Evaluation step is incomplete", 422)
  const { data: existing } = await admin.from("image_evaluations").select("id").eq("artifact_id", step.artifact_id).eq("evaluator_model_catalog_id", step.evaluator).eq("round", 1).maybeSingle()
  if (!existing) {
    const { image } = await artifactImage(admin, step.artifact_id, run.id)
    const result = await evaluateBlind(step.evaluator, run.prompt, `candidate-${step.artifact_id.slice(0, 8)}`, image)
    const { error } = await admin.from("image_evaluations").insert({
      user_id: run.user_id,
      run_id: run.id,
      artifact_id: step.artifact_id,
      evaluator_model_catalog_id: step.evaluator,
      evaluator: step.evaluator,
      round: 1,
      criteria: result.criteria,
      argumentation: result.argumentation,
      confidence: result.confidence,
    })
    if (error && error.code !== "23505") throw new AppError("evaluation_write_failed", "Evaluation could not be stored", 503, true)
  }
  const { count: artifactCount } = await admin.from("image_artifacts").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("kind", "original")
  const { count: evaluationCount } = await admin.from("image_evaluations").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("round", 1)
  if ((evaluationCount ?? 0) < (artifactCount ?? 0) * 3) return
  const { data: evaluators } = await admin.from("image_model_catalog").select("id").eq("model_role", "evaluator").eq("enabled", true).eq("kill_switch", false).order("sort_order")
  await stage(admin, run, "debating")
  const evaluatorRows = (evaluators ?? []) as IdRow[]
  await enqueueOnce(admin, queue, run, `advance:debate:${run.id}`, "steps.debate_queued", evaluatorRows.map((evaluator) => ({
    step: "debate", run_id: run.id, project_id: run.project_id, user_id: run.user_id, evaluator: evaluator.id, round: 2,
  })))
}

async function handleDebate(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow, step: QueueStep): Promise<void> {
  if (!step.evaluator) throw new AppError("invalid_step", "Debate step has no evaluator", 422)
  const { data: roundOne } = await admin.from("image_evaluations").select("artifact_id,evaluator_model_catalog_id,criteria").eq("run_id", run.id).eq("round", 1)
  const roundOneRows = (roundOne ?? []) as EvaluationRow[]
  const artifactIds = [...new Set(roundOneRows.map((row) => row.artifact_id))]
  const { count: existingCount } = await admin.from("image_evaluations").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("evaluator_model_catalog_id", step.evaluator).eq("round", 2)
  if ((existingCount ?? 0) < artifactIds.length) {
    const ownRows = artifactIds.map((artifactId) => {
      const rows = roundOneRows.filter((row) => row.artifact_id === artifactId)
      const own = rows.find((row) => row.evaluator_model_catalog_id === step.evaluator)?.criteria ?? {}
      return { artifactId, own, peers: rows.filter((row) => row.evaluator_model_catalog_id !== step.evaluator).map((row) => score(row.criteria)) }
    })
    const result = await debateWithPeerScores(step.evaluator, ownRows)
    const byId = new Map(result.artifacts.map((row) => [row.artifactId, row]))
    for (const own of ownRows) {
      const row = byId.get(own.artifactId) ?? {
        artifactId: own.artifactId,
        criteria: own.own as Record<string, number>,
        argumentation: "Evaluator omitted this candidate; round-one assessment retained.",
        confidence: 0,
      }
      const { error } = await admin.from("image_evaluations").insert({
        user_id: run.user_id,
        run_id: run.id,
        artifact_id: row.artifactId,
        evaluator_model_catalog_id: step.evaluator,
        evaluator: step.evaluator,
        round: 2,
        criteria: row.criteria,
        argumentation: row.argumentation,
        confidence: row.confidence,
      })
      if (error && error.code !== "23505") throw new AppError("debate_write_failed", "Debate result could not be stored", 503, true)
    }
  }
  const { count } = await admin.from("image_evaluations").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("round", 2)
  if ((count ?? 0) < artifactIds.length * 3) return
  await stage(admin, run, "refining")
  await enqueueOnce(admin, queue, run, `advance:refine:${run.id}`, "steps.refinement_queued", artifactIds.map((artifactId) => ({
    step: "refine", run_id: run.id, project_id: run.project_id, user_id: run.user_id, source_artifact_id: artifactId, stage: "refined",
  })))
}

function chairRefinementBrief(rows: EvaluationRow[]): string {
  if (!rows.length) {
    return "Chair brief: preserve the candidate's core concept; improve brief alignment, composition, craft, and visible defects."
  }
  const criterionScores = new Map<string, number[]>()
  for (const row of rows) {
    for (const [criterion, raw] of Object.entries(row.criteria)) {
      const value = Number(raw)
      if (!Number.isFinite(value)) continue
      const values = criterionScores.get(criterion) ?? []
      values.push(Math.min(1, Math.max(0, value)))
      criterionScores.set(criterion, values)
    }
  }
  const priorities = [...criterionScores.entries()]
    .map(([criterion, values]) => ({
      criterion,
      average: values.reduce((total, value) => total + value, 0) / values.length,
    }))
    .sort((left, right) => left.average - right.average)
    .slice(0, 3)
    .map(({ criterion, average }) => `${criterion} (${average.toFixed(2)})`)
  const evidence = rows
    .map((row) => (row.argumentation ?? "").replace(/\s+/g, " ").trim().slice(0, 320))
    .filter(Boolean)
    .slice(0, 3)
  return [
    `Chair brief: prioritize ${priorities.join(", ") || "brief alignment, composition, and craft"}.`,
    "Preserve the candidate's core concept and correct visible defects.",
    evidence.length ? `Council evidence: ${evidence.join(" | ")}` : "",
  ].filter(Boolean).join(" ").slice(0, 1_800)
}

async function handleImageEdit(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow, step: QueueStep, polished: boolean): Promise<void> {
  if (!step.source_artifact_id) throw new AppError("invalid_step", "Image edit step has no source artifact", 422)
  const recovery = step.step === "recover" || step.stage === "recovery"
  const editStage = recovery ? "recovery" : polished ? "polished" : "refined"
  const artifactId = await deterministicUuid(`artifact:${run.id}:${editStage}:${step.source_artifact_id}`)
  const { data: existing } = await admin.from("image_artifacts").select("id").eq("id", artifactId).maybeSingle()
  if (existing) return
  const { image } = await artifactImage(admin, step.source_artifact_id, run.id)
  const request = settings(run)
  let refinementBrief: string | undefined
  if (!polished) {
    const { data: evaluations } = await admin.from("image_evaluations")
      .select("artifact_id,evaluator_model_catalog_id,criteria,argumentation")
      .eq("run_id", run.id)
      .eq("artifact_id", step.source_artifact_id)
      .eq("round", 2)
    refinementBrief = chairRefinementBrief((evaluations ?? []) as EvaluationRow[])
    await appendEvent(admin, {
      key: `refinement-brief:${artifactId}`,
      userId: run.user_id,
      projectId: run.project_id,
      runId: run.id,
      eventType: "artifact.refinement_brief",
      payload: {
        sourceArtifactId: step.source_artifact_id,
        targetArtifactId: artifactId,
        brief: refinementBrief,
      },
    })
  }
  const prompt = recovery
    ? [
      `Recover this finalist conservatively for the original brief: ${run.prompt}`,
      "Preserve its selected concept and composition; correct only visible defects and production issues.",
      step.prompt ? `Additional user direction: ${step.prompt}` : "",
    ].filter(Boolean).join("\n").slice(0, 6_000)
    : polished
    ? `Polish this finalist conservatively. Preserve the concept and composition. Correct visible defects. Brief: ${run.prompt}`
    : [
      `Refine this candidate for the original brief: ${run.prompt}`,
      refinementBrief,
      step.prompt ? `Additional user direction: ${step.prompt}` : "",
    ].filter(Boolean).join("\n").slice(0, 6_000)
  const output = await imageAdapter("google").generate({
    ...request,
    prompt,
    model: editorModel(),
    signal: AbortSignal.timeout(90_000),
    inputImage: image,
  })
  const temporary = await uploadTemporaryImage(admin, run.user_id, run.id, artifactId, output)
  await queue.send({
    step: "moderate_output",
    run_id: run.id,
    project_id: run.project_id,
    user_id: run.user_id,
    model_id: "google/gemini-3-pro-image",
    artifact_id: artifactId,
    source_artifact_id: step.source_artifact_id,
    stage: editStage,
    version: step.version ?? (polished ? 1 : 2),
    temporary_path: temporary.path,
    mime_type: output.mimeType,
    sha256: temporary.sha256,
    refinement_brief: refinementBrief,
  })
}

async function maybeQueueRanking(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow): Promise<void> {
  const { count: originals } = await admin.from("image_artifacts").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("kind", "original")
  const { count: refinements } = await admin.from("image_artifacts").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("kind", "refinement")
  const { count: failures } = await admin.from("image_events").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("event_type", "step.dead_lettered").contains("payload", { step: "refine" })
  if ((refinements ?? 0) + (failures ?? 0) < (originals ?? 0)) return
  await stage(admin, run, "ranking")
  await enqueueOnce(admin, queue, run, `advance:rank:${run.id}`, "steps.ranking_queued", [{
    step: "rank", run_id: run.id, project_id: run.project_id, user_id: run.user_id, evaluator: "google/gemini-3.1-pro",
  }])
}

async function handleRank(admin: DatabaseClient, queue: ImageCouncilQueue, run: RunRow, step: QueueStep): Promise<void> {
  const evaluator = step.evaluator ?? "google/gemini-3.1-pro"
  const { data: artifacts } = await admin.from("image_artifacts").select("id,parent_artifact_id").eq("run_id", run.id).eq("kind", "refinement")
  const { data: evaluations } = await admin.from("image_evaluations").select("artifact_id,criteria").eq("run_id", run.id).eq("round", 2)
  const artifactRows = (artifacts ?? []) as RefinementRow[]
  const evaluationRows = (evaluations ?? []) as EvaluationRow[]
  const summaries: Array<{ artifactId: string; scores: number[] }> = artifactRows.map((artifact) => ({
    artifactId: artifact.id,
    scores: evaluationRows.filter((row) => row.artifact_id === artifact.parent_artifact_id).map((row) => score(row.criteria)),
  }))
  const result = await rankFromDebate(evaluator, summaries)
  const valid = result.artifactIds.filter((id) => summaries.some((row) => row.artifactId === id))
  for (const row of summaries.sort((a, b) => (b.scores.reduce((x, y) => x + y, 0) - a.scores.reduce((x, y) => x + y, 0)))) {
    if (!valid.includes(row.artifactId)) valid.push(row.artifactId)
  }
  if (!valid.length) throw new AppError("ranking_empty", "No refinement can be ranked", 422)
  const top = valid.slice(0, 3)
  const { error } = await admin.from("image_rankings").insert({
    user_id: run.user_id,
    run_id: run.id,
    evaluator_model_catalog_id: evaluator,
    evaluator,
    round: 3,
    rank_1_artifact_id: top[0],
    rank_2_artifact_id: top[1] ?? null,
    rank_3_artifact_id: top[2] ?? null,
    argumentation: `Council aggregate ranking. ${result.argumentation}`.slice(0, 20_000),
    confidence: result.confidence,
  })
  if (error && error.code !== "23505") throw new AppError("ranking_write_failed", "Ranking could not be stored", 503, true)
  await stage(admin, run, "polishing")
  await enqueueOnce(admin, queue, run, `advance:polish:${run.id}`, "steps.polish_queued", top.map((artifactId, index) => ({
    step: "polish", run_id: run.id, project_id: run.project_id, user_id: run.user_id, source_artifact_id: artifactId, stage: "polished", version: index + 1,
  })))
}

async function maybeFinish(admin: DatabaseClient, run: RunRow): Promise<void> {
  const { data: ranking } = await admin.from("image_rankings")
    .select("evaluator_model_catalog_id,evaluator,rank_1_artifact_id,rank_2_artifact_id,rank_3_artifact_id,argumentation,confidence")
    .eq("run_id", run.id)
    .eq("round", 3)
    .maybeSingle()
  const expected = ranking ? [ranking.rank_1_artifact_id, ranking.rank_2_artifact_id, ranking.rank_3_artifact_id].filter(Boolean).length : 0
  const { data: finalistRows, count: finalists } = await admin.from("image_artifacts")
    .select("id,parent_artifact_id,version", { count: "exact" })
    .eq("run_id", run.id)
    .eq("kind", "finalist")
    .lte("version", 3)
  const { count: failures } = await admin.from("image_events").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("event_type", "step.dead_lettered").contains("payload", { step: "polish" })
  if ((finalists ?? 0) + (failures ?? 0) < expected) return
  if (ranking && finalistRows?.length) {
    const orderedSources = [
      ranking.rank_1_artifact_id,
      ranking.rank_2_artifact_id,
      ranking.rank_3_artifact_id,
    ].filter((id): id is string => typeof id === "string")
    const finalIds = orderedSources.flatMap((sourceId) => {
      const finalist = finalistRows.find((row) => row.parent_artifact_id === sourceId)
      return finalist ? [finalist.id] : []
    })
    if (finalIds.length) {
      const { error: finalRankingError } = await admin.from("image_rankings").insert({
        user_id: run.user_id,
        run_id: run.id,
        evaluator_model_catalog_id: ranking.evaluator_model_catalog_id,
        evaluator: ranking.evaluator,
        round: 4,
        rank_1_artifact_id: finalIds[0],
        rank_2_artifact_id: finalIds[1] ?? null,
        rank_3_artifact_id: finalIds[2] ?? null,
        argumentation: `Verified finalist ranking after polish. ${ranking.argumentation}`.slice(0, 20_000),
        confidence: ranking.confidence,
      })
      if (finalRankingError && finalRankingError.code !== "23505") {
        throw new AppError("final_ranking_write_failed", "Finalist ranking could not be stored", 503, true)
      }
    }
  }
  const { count: branches } = await admin.from("image_branches").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("status", "completed")
  const actual = Math.min(RESERVED_CREDITS, (branches ?? 0) + 1 + (finalists ?? 0))
  const { data: reservation } = await admin.from("credit_reservations").select("id").eq("run_id", run.id).maybeSingle()
  const outcome = (finalists ?? 0) === expected && expected > 0 ? "completed" : "partial"
  if (reservation) await admin.rpc("settle_image_credits", {
    p_reservation_id: reservation.id,
    p_actual_credits: actual,
    p_outcome: outcome,
  })
  await stage(admin, run, outcome, { finalists: finalists ?? 0 })
}

async function settleTerminalPartial(admin: DatabaseClient, run: RunRow, reason: string): Promise<void> {
  const { count: branches } = await admin.from("image_branches").select("id", { count: "exact", head: true }).eq("run_id", run.id).eq("status", "completed")
  const { data: reservation } = await admin.from("credit_reservations").select("id,status").eq("run_id", run.id).maybeSingle()
  if (reservation?.status === "reserved") {
    await admin.rpc("settle_image_credits", {
      p_reservation_id: reservation.id,
      p_actual_credits: Math.min(RESERVED_CREDITS, branches ?? 0),
      p_outcome: "partial",
    })
  }
  await stage(admin, run, "partial", { reason })
}

async function handleCancel(admin: DatabaseClient, run: RunRow): Promise<void> {
  const { data: reservation } = await admin.from("credit_reservations").select("id,status").eq("run_id", run.id).maybeSingle()
  if (reservation?.status === "reserved") await admin.rpc("refund_image_credits", {
    p_reservation_id: reservation.id,
    p_failure_code: "cancelled_by_user",
    p_failure_detail: "Cancelled by user",
    p_outcome: "cancelled",
  })
  await stage(admin, run, "cancelled")
}

async function handlePurge(admin: DatabaseClient, run: RunRow): Promise<void> {
  const paths: string[] = []
  const walk = async (prefix: string): Promise<void> => {
    const { data, error } = await admin.storage.from(STORAGE_BUCKET).list(prefix, { limit: 1000 })
    if (error) throw new AppError("purge_list_failed", "Private project files could not be listed", 503, true)
    for (const item of data ?? []) {
      const path = `${prefix}/${item.name}`
      if (item.id) paths.push(path)
      else await walk(path)
    }
  }
  await walk(`${run.user_id}/${run.project_id}`)
  for (let offset = 0; offset < paths.length; offset += 100) {
    const { error } = await admin.storage.from(STORAGE_BUCKET).remove(paths.slice(offset, offset + 100))
    if (error) throw new AppError("purge_failed", "Private project files could not be deleted", 503, true)
  }
  const { data, error } = await admin.rpc("purge_image_project", { p_project_id: run.project_id })
  if (error || data?.success !== true) throw new AppError("project_purge_failed", "Project records could not be purged", 503, true)
}

async function processStep(admin: DatabaseClient, queue: ImageCouncilQueue, message: QueueMessage): Promise<void> {
  const step = message.message
  if (!step?.step || !step.run_id || !step.project_id || !step.user_id) throw new AppError("invalid_queue_message", "Malformed queue message", 422)
  const run = await runRow(admin, step)
  if (step.step === "cancel_run") return handleCancel(admin, run)
  if (step.step === "purge_project") return handlePurge(admin, run)
  if (run.status === "cancel_requested" || run.status === "cancelled") return
  const recoveryContinuation = (
    step.step === "recover" ||
    (step.step === "moderate_output" && step.stage === "recovery")
  ) && (run.status === "completed" || run.status === "partial")
  if (["completed", "partial", "failed", "quarantined"].includes(run.status) && !recoveryContinuation) return
  if (step.step === "start" || step.step === "moderate") return handleStart(admin, queue, run)
  if (step.step === "generate") return handleGenerate(admin, queue, run, step)
  if (step.step === "moderate_output") return handleModerateOutput(admin, queue, run, step)
  if (step.step === "evaluate") return handleEvaluate(admin, queue, run, step)
  if (step.step === "debate") return handleDebate(admin, queue, run, step)
  if (step.step === "refine") return handleImageEdit(admin, queue, run, step, false)
  if (step.step === "rank") return handleRank(admin, queue, run, step)
  if (step.step === "polish" || step.step === "recover") return handleImageEdit(admin, queue, run, step, true)
  throw new AppError("invalid_step", "Unsupported queue step", 422)
}

Deno.serve(async (req: Request) => {
  const guarded = methodGuard(req)
  if (guarded) return guarded
  let queue: ImageCouncilQueue | null = null
  let message: QueueMessage | null = null
  try {
    await authenticateWorker(req)
    queue = new ImageCouncilQueue()
    message = await queue.readOne()
    if (!message) return json({ ok: true, processed: 0 })
    const admin = adminClient()
    try {
      await processStep(admin, queue, message)
      await queue.archive(message.msg_id)
    } catch (error) {
      const retryable = error instanceof AppError ? error.retryable : true
      if (retryable && message.read_ct < queue.maxAttempts()) {
        return json({ ok: false, processed: 0, retrying: true, attempt: message.read_ct }, 503)
      }
      const step = message.message
      await appendEvent(admin, {
        key: `dead-letter:${message.msg_id}`,
        userId: step.user_id,
        projectId: step.project_id,
        runId: step.run_id,
        eventType: "step.dead_lettered",
        payload: { messageId: message.msg_id, step: step.step, modelId: step.model_id ?? null, attempts: message.read_ct, error: errorMessage(error) },
      }).catch(() => undefined)
      if (step.model_id) {
        await admin.from("image_branches").update({
          status: "failed",
          failure_code: error instanceof AppError ? error.code : "step_failed",
          failure_detail: errorMessage(error),
          completed_at: new Date().toISOString(),
        }).eq("run_id", step.run_id).eq("model_catalog_id", step.model_id).in("status", ["queued", "generating"])
      }
      const failedRun = await runRow(admin, step).catch(() => null)
      if (failedRun && step.step === "evaluate" && step.artifact_id && step.evaluator) {
        await admin.from("image_evaluations").insert({
          user_id: failedRun.user_id,
          run_id: failedRun.id,
          artifact_id: step.artifact_id,
          evaluator_model_catalog_id: step.evaluator,
          evaluator: step.evaluator,
          round: 1,
          criteria: { brief: 0, composition: 0, craft: 0, safety: 0 },
          argumentation: "Evaluation unavailable after bounded retries.",
          confidence: 0,
        }).then(() => undefined)
        await handleEvaluate(admin, queue, failedRun, step).catch(() => undefined)
      } else if (failedRun && step.step === "debate" && step.evaluator) {
        const { data: roundOne } = await admin.from("image_evaluations").select("artifact_id,criteria").eq("run_id", failedRun.id).eq("round", 1).eq("evaluator_model_catalog_id", step.evaluator)
        for (const row of roundOne ?? []) {
          await admin.from("image_evaluations").insert({
            user_id: failedRun.user_id,
            run_id: failedRun.id,
            artifact_id: row.artifact_id,
            evaluator_model_catalog_id: step.evaluator,
            evaluator: step.evaluator,
            round: 2,
            criteria: row.criteria,
            argumentation: "Debate unavailable after bounded retries; round-one assessment retained.",
            confidence: 0,
          }).then(() => undefined)
        }
        await handleDebate(admin, queue, failedRun, step).catch(() => undefined)
      } else if (failedRun && step.step === "refine") {
        await maybeQueueRanking(admin, queue, failedRun).catch(() => undefined)
      } else if (failedRun && step.step === "polish") {
        await maybeFinish(admin, failedRun).catch(() => undefined)
      } else if (failedRun && step.step === "rank") {
        await settleTerminalPartial(admin, failedRun, "ranking_dead_lettered").catch(() => undefined)
      } else if (failedRun && (step.step === "start" || step.step === "moderate")) {
        const { data: reservation } = await admin.from("credit_reservations").select("id,status").eq("run_id", failedRun.id).maybeSingle()
        if (reservation?.status === "reserved") {
          try {
            await admin.rpc("refund_image_credits", {
              p_reservation_id: reservation.id,
              p_failure_code: "moderation_failed",
              p_failure_detail: errorMessage(error),
              p_outcome: "failed",
            })
          } catch {
            // The dead-letter event remains the durable recovery signal.
          }
        }
      }
      await queue.archive(message.msg_id)
      if (step.step === "generate" || step.step === "moderate_output") {
        if (failedRun && step.stage === "refined") await maybeQueueRanking(admin, queue, failedRun)
        else if (failedRun && step.stage === "polished") await maybeFinish(admin, failedRun)
        else if (failedRun) await maybeAdvance(admin, queue, failedRun)
      }
    }
    kickWorker()
    return json({ ok: true, processed: 1, messageId: message.msg_id })
  } catch (error) {
    return errorResponse(error)
  } finally {
    await queue?.close().catch(() => undefined)
  }
})
