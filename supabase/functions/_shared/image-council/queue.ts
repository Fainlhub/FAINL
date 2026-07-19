import postgres from "https://deno.land/x/postgresjs@v3.4.5/mod.js"
import { intEnv, QUEUE_NAME, requiredEnv } from "./env.ts"
import { AppError } from "./errors.ts"
import type { QueueMessage, QueueStep } from "./types.ts"

export class ImageCouncilQueue {
  private readonly sql = postgres(requiredEnv("SUPABASE_DB_URL"), {
    max: 1,
    prepare: false,
    idle_timeout: 5,
    connect_timeout: 10,
  })

  async readOne(): Promise<QueueMessage | null> {
    const visibility = intEnv("IMAGE_COUNCIL_VISIBILITY_TIMEOUT_SECONDS", 120, 30, 300)
    // The batch size is intentionally literal 1: one invocation owns one
    // bounded step and at most one upstream provider call.
    const rows = await this.sql`
      select msg_id, read_ct, message
      from pgmq.read(${QUEUE_NAME}, ${visibility}, 1)
    `
    if (!rows.length) return null
    const row = rows[0]
    return {
      msg_id: Number(row.msg_id),
      read_ct: Number(row.read_ct),
      message: row.message as QueueStep,
    }
  }

  async send(step: QueueStep, delaySeconds = 0): Promise<number> {
    const rows = await this.sql`
      select * from pgmq.send(${QUEUE_NAME}, ${this.sql.json(step)}, ${Math.max(0, delaySeconds)})
    `
    const value = rows[0] ? Object.values(rows[0])[0] : null
    if (value === null || value === undefined) throw new AppError("queue_send_failed", "Queue did not return a message id", 503, true)
    return Number(value)
  }

  async archive(messageId: number): Promise<void> {
    const rows = await this.sql`select pgmq.archive(${QUEUE_NAME}, ${messageId}) as archived`
    if (rows[0]?.archived !== true) throw new AppError("queue_archive_failed", "Queue message could not be archived", 503, true)
  }

  async delete(messageId: number): Promise<void> {
    const rows = await this.sql`select pgmq.delete(${QUEUE_NAME}, ${messageId}) as deleted`
    if (rows[0]?.deleted !== true) throw new AppError("queue_delete_failed", "Queue message could not be deleted", 503, true)
  }

  maxAttempts(): number {
    return intEnv("IMAGE_COUNCIL_MAX_ATTEMPTS", 2, 1, 5)
  }

  close(): Promise<void> {
    return this.sql.end({ timeout: 2 })
  }
}
