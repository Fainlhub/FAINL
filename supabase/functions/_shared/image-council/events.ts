import type { DatabaseClient } from "./auth.ts"
import { deterministicUuid } from "./crypto.ts"
import { AppError } from "./errors.ts"

export async function appendEvent(
  admin: DatabaseClient,
  input: {
    key: string
    userId: string
    projectId: string
    runId: string
    artifactId?: string
    eventType: string
    payload?: Record<string, unknown>
  },
): Promise<{ inserted: boolean; id: string }> {
  const id = await deterministicUuid(`image-event:${input.userId}:${input.key}`)
  const { error } = await admin.from("image_events").insert({
    id,
    user_id: input.userId,
    project_id: input.projectId,
    run_id: input.runId,
    artifact_id: input.artifactId ?? null,
    event_type: input.eventType,
    payload: input.payload ?? {},
  })
  if (!error) return { inserted: true, id }
  if (error.code === "23505") return { inserted: false, id }
  throw new AppError("event_write_failed", "Image event could not be recorded", 503, true)
}
