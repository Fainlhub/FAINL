/// <reference lib="deno.ns" />

import { adminClient, authenticateUser, userClient } from "../_shared/image-council/auth.ts"
import { appendEvent } from "../_shared/image-council/events.ts"
import { featureEnabled } from "../_shared/image-council/env.ts"
import { AppError } from "../_shared/image-council/errors.ts"
import { errorResponse, json, methodGuard, readJsonObject } from "../_shared/image-council/http.ts"
import { kickWorker } from "../_shared/image-council/kick.ts"
import { ImageCouncilQueue } from "../_shared/image-council/queue.ts"
import type { QueueStep, StepName } from "../_shared/image-council/types.ts"
import { parseCommandRequest } from "../_shared/image-council/validation.ts"

const RETRY_STEPS: Record<string, StepName> = {
  queued: "start",
  moderating: "start",
  generating: "generate",
  evaluating: "evaluate",
  debating: "debate",
  refining: "refine",
  ranking: "rank",
  polishing: "polish",
  failed: "start",
  partial: "rank",
}

Deno.serve(async (req: Request) => {
  const guarded = methodGuard(req)
  if (guarded) return guarded
  let queue: ImageCouncilQueue | null = null
  try {
    if (!featureEnabled()) throw new AppError("feature_disabled", "Beeldraad is not enabled", 503)
    const input = parseCommandRequest(await readJsonObject(req, 32_768))
    const admin = adminClient()
    const user = await authenticateUser(req, admin)
    const { data: project } = await admin.from("image_projects").select("id,lifecycle_status").eq("id", input.projectId).eq("user_id", user.id).maybeSingle()
    if (!project) throw new AppError("project_not_found", "Image project not found", 404)

    let runId = input.runId
    if (!runId) {
      const { data: latest } = await admin.from("image_runs").select("id").eq("project_id", input.projectId).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle()
      runId = latest?.id
    }
    if (!runId) {
      if (input.command !== "delete_project") throw new AppError("run_not_found", "Image run not found", 404)
      const { error } = await userClient(req).rpc("request_image_project_deletion", { p_project_id: input.projectId })
      if (error) throw new AppError("project_delete_failed", "Project deletion could not be requested", 503)
      return json({ projectId: input.projectId, accepted: true, status: "cancelled" })
    }
    const { data: run } = await admin.from("image_runs").select("id,status").eq("id", runId).eq("project_id", input.projectId).eq("user_id", user.id).maybeSingle()
    if (!run) throw new AppError("run_not_found", "Image run not found", 404)

    let artifact: { id: string; kind: string; version: number; parent_artifact_id: string | null } | null = null
    if (input.artifactId) {
      const { data } = await admin.from("image_artifacts").select("id,kind,version,parent_artifact_id").eq("id", input.artifactId).eq("run_id", runId).eq("user_id", user.id).maybeSingle()
      artifact = data
      if (!artifact) throw new AppError("artifact_not_found", "Image artifact not found", 404)
    }
    if (input.command === "refine_artifact") {
      const baseFinalist = artifact?.kind === "finalist" && artifact.version >= 1 && artifact.version <= 3
      if (!baseFinalist) {
        throw new AppError("unsupported_refinement_source", "Only base finalists support one directed recovery", 409)
      }
      if (baseFinalist && !["polishing", "completed", "partial"].includes(run.status)) {
        throw new AppError("recovery_not_available", "Finalist recovery is not available in the current run state", 409)
      }
    }

    const commandEvent = await appendEvent(admin, {
      key: `command:${input.clientRequestId}`,
      userId: user.id,
      projectId: input.projectId,
      runId,
      artifactId: input.artifactId,
      eventType: `command.${input.command}`,
      payload: {
        clientRequestId: input.clientRequestId,
        step: input.step ?? null,
        prompt: input.prompt ?? null,
      },
    })
    if (!commandEvent.inserted) {
      return json({ projectId: input.projectId, runId, accepted: true, replayed: true, status: run.status })
    }

    queue = new ImageCouncilQueue()
    let step: QueueStep | null = null
    if (input.command === "cancel_run") {
      const { error: cancelStatusError } = await admin.from("image_runs")
        .update({ status: "cancel_requested" })
        .eq("id", runId)
        .eq("user_id", user.id)
        .in("status", ["queued", "moderating", "generating", "evaluating", "debating", "refining", "ranking", "polishing"])
      if (cancelStatusError) throw new AppError("cancel_request_failed", "Run cancellation could not be requested", 503, true)
      await appendEvent(admin, {
        key: `pipeline:cancel-requested:${runId}`,
        userId: user.id,
        projectId: input.projectId,
        runId,
        eventType: "pipeline.cancel_requested",
      })
      step = { step: "cancel_run", run_id: runId, project_id: input.projectId, user_id: user.id, command_id: commandEvent.id }
    } else if (input.command === "retry_step") {
      const retryStep = RETRY_STEPS[input.step ?? ""]
      if (!retryStep) throw new AppError("step_not_retryable", "This pipeline step is not retryable", 409)
      step = { step: retryStep, run_id: runId, project_id: input.projectId, user_id: user.id, command_id: commandEvent.id }
    } else if (input.command === "refine_artifact") {
      const { data: existingChild } = await admin.from("image_artifacts")
        .select("id")
        .eq("run_id", runId)
        .eq("parent_artifact_id", input.artifactId)
        .eq("kind", "finalist")
        .limit(1)
        .maybeSingle()
      if (existingChild) throw new AppError("artifact_already_refined", "This artifact already has its bounded refinement", 409)
      step = {
        step: "recover",
        run_id: runId,
        project_id: input.projectId,
        user_id: user.id,
        source_artifact_id: input.artifactId,
        stage: "recovery",
        version: artifact.version + 3,
        prompt: input.prompt,
        command_id: commandEvent.id,
      }
    } else if (input.command === "delete_project") {
      const { data: deletion, error } = await userClient(req).rpc("request_image_project_deletion", { p_project_id: input.projectId })
      if (error || deletion?.success !== true) throw new AppError("project_delete_failed", "Project deletion could not be requested", 503)
      const { error: cancelStatusError } = await admin.from("image_runs")
        .update({ status: "cancel_requested" })
        .eq("id", runId)
        .eq("user_id", user.id)
        .in("status", ["queued", "moderating", "generating", "evaluating", "debating", "refining", "ranking", "polishing"])
      if (cancelStatusError) throw new AppError("cancel_request_failed", "Run cancellation could not be requested", 503, true)
      await appendEvent(admin, {
        key: `pipeline:cancel-requested:${runId}`,
        userId: user.id,
        projectId: input.projectId,
        runId,
        eventType: "pipeline.cancel_requested",
        payload: { reason: "project_deletion" },
      })
      await queue.send({
        step: "cancel_run",
        run_id: runId,
        project_id: input.projectId,
        user_id: user.id,
        command_id: commandEvent.id,
      })
      step = { step: "purge_project", run_id: runId, project_id: input.projectId, user_id: user.id, command_id: commandEvent.id }
    } else {
      const { error } = await admin
        .from("image_projects")
        .update({ selected_artifact_id: input.artifactId })
        .eq("id", input.projectId)
        .eq("user_id", user.id)
      if (error) throw new AppError("artifact_select_failed", "Artifact could not be selected", 503, true)
      await appendEvent(admin, {
        key: `selection:${input.artifactId}`,
        userId: user.id,
        projectId: input.projectId,
        runId,
        artifactId: input.artifactId,
        eventType: "artifact.selected",
      })
    }
    if (step) await queue.send(step, input.command === "delete_project" ? 86_400 : 0)
    kickWorker()
    return json({
      projectId: input.projectId,
      runId,
      accepted: true,
      replayed: false,
      status: input.command === "cancel_run" || input.command === "delete_project" ? "cancel_requested" : run.status,
    }, 202)
  } catch (error) {
    return errorResponse(error)
  } finally {
    await queue?.close().catch(() => undefined)
  }
})
