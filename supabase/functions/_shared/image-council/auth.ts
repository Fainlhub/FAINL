import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1"
import { AppError } from "./errors.ts"
import { env, requiredEnv } from "./env.ts"

// The database schema is owned by migrations outside this function package.
// Keep the Edge Function client schema-agnostic while preserving runtime checks.
export type DatabaseClient = any

export function adminClient(): DatabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  ) as DatabaseClient
}

export function userClient(req: Request): DatabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_ANON_KEY"),
    {
      global: { headers: { Authorization: req.headers.get("authorization") ?? "" } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  ) as DatabaseClient
}

export async function authenticateUser(req: Request, admin: DatabaseClient): Promise<{ id: string }> {
  const authorization = req.headers.get("authorization") ?? ""
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  if (!match?.[1]) throw new AppError("unauthorized", "Authentication required", 401)

  const token = match[1].trim()
  if (!token || token === env("SUPABASE_ANON_KEY")) {
    throw new AppError("unauthorized", "Authentication required", 401)
  }

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new AppError("unauthorized", "Invalid or expired session", 401)
  return { id: data.user.id }
}

async function timingSafeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder()
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ])
  const a = new Uint8Array(leftHash)
  const b = new Uint8Array(rightHash)
  let difference = a.length ^ b.length
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    difference |= (a[index % a.length] ?? 0) ^ (b[index % b.length] ?? 0)
  }
  return difference === 0
}

export async function authenticateWorker(req: Request): Promise<void> {
  const expected = requiredEnv("IMAGE_COUNCIL_WORKER_TOKEN")
  const supplied = req.headers.get("x-image-council-worker-token")?.trim() ?? ""
  if (!supplied || !(await timingSafeEqual(supplied, expected))) {
    throw new AppError("unauthorized", "Worker authentication failed", 401)
  }
}
