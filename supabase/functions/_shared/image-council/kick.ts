import { env } from "./env.ts"

declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void } | undefined

export function kickWorker(): void {
  const url = env("SUPABASE_URL")
  const token = env("IMAGE_COUNCIL_WORKER_TOKEN")
  if (!url || !token) return
  const task = fetch(`${url}/functions/v1/image-council-worker`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-image-council-worker-token": token,
    },
    body: "{}",
  }).catch((error) => console.error("image-council worker kick failed", error))
  if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(task)
}
