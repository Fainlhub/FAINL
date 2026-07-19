/// <reference lib="deno.ns" />

import { adminClient, authenticateUser, userClient } from "../_shared/image-council/auth.ts"
import { featureEnabled, RESERVED_CREDITS } from "../_shared/image-council/env.ts"
import { AppError } from "../_shared/image-council/errors.ts"
import { errorResponse, json, methodGuard, readJsonObject } from "../_shared/image-council/http.ts"
import { kickWorker } from "../_shared/image-council/kick.ts"
import type { StartResponse } from "../_shared/image-council/types.ts"
import { parseStartRequest } from "../_shared/image-council/validation.ts"

Deno.serve(async (req: Request) => {
  const guarded = methodGuard(req)
  if (guarded) return guarded
  try {
    if (!featureEnabled()) throw new AppError("feature_disabled", "Beeldraad is not enabled", 503)
    const body = await readJsonObject(req, 32_768)
    const input = parseStartRequest(body)
    const admin = adminClient()
    await authenticateUser(req, admin)
    const caller = userClient(req)
    const { data, error } = await caller.rpc("start_image_council", {
      p_client_request_id: input.clientRequestId,
      p_prompt: input.prompt,
      p_aspect_ratio: input.aspectRatio,
      p_style_preset: input.stylePreset,
    })
    if (error) throw new AppError("start_failed", "Beeldraad could not be started", 503, true)
    if (data?.success !== true) {
      const reason = typeof data?.reason === "string" ? data.reason : "start_failed"
      throw new AppError(reason, reason.replaceAll("_", " "), reason === "insufficient_credits" ? 402 : 409)
    }
    const projectId = typeof data.project_id === "string" ? data.project_id : ""
    const runId = typeof data.run_id === "string" ? data.run_id : ""
    if (!projectId || !runId) throw new AppError("invalid_start_response", "Start RPC returned no ids", 503)

    kickWorker()
    const response: StartResponse = {
      projectId,
      runId,
      status: "queued",
      reservedCredits: RESERVED_CREDITS,
    }
    return json(response, 202)
  } catch (error) {
    return errorResponse(error)
  }
})
