# Beeldraad Operations

## Feature rollout

`IMAGE_COUNCIL_ENABLED` is server-owned and defaults to `false`. Enable in this
order:

1. Fixture mode in local and CI.
2. Internal accounts in production.
3. Ten percent canary with spend and queue alerts active.
4. General availability after the launch gates pass.

The model catalog is the runtime source of truth. Turning a model off there must
stop new branch dispatch without a frontend deployment.

## Required Edge Function secrets

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `HF_TOKEN`
- `IMAGE_COUNCIL_WORKER_TOKEN`
- `IMAGE_COUNCIL_ENABLED`
- `IMAGE_COUNCIL_FIXTURE_MODE`

Never expose these as `VITE_*` variables. The browser uses only the Supabase
publishable key and the signed-in user's access token.

## Provider policy

| Model | Role | License policy |
| --- | --- | --- |
| `gemini-3.1-flash-image` | Generator | Provider terms |
| `gpt-image-2` | Generator | Provider terms |
| `Qwen/Qwen-Image` | Generator | Apache-2.0 |
| `Tongyi-MAI/Z-Image-Turbo` | Generator | Apache-2.0 |
| `stabilityai/stable-diffusion-xl-base-1.0` | Generator | OpenRAIL++ review required |
| `gemini-3-pro-image` | Final editor | Provider terms |

The migration marks the current OpenRAIL++ policy as accepted for this catalog
version. Disable the SDXL catalog row before launch if FAINL's legal review does
not accept those use restrictions. A disabled branch is shown as unavailable;
it is never silently replaced without recording a provider fallback event.

## Worker invariants

- Read at most one queue message per invocation.
- One message performs one bounded pipeline step or one provider call.
- A successful step archives its queue message only after its database write and
  immutable Storage upload succeed.
- Retries create no duplicate artifact path, ledger entry or ranking.
- Every provider call has a timeout and a maximum attempt count.
- Cancellation prevents undispatched work and preserves delivered artifacts.
- Settlement can charge at most the nine-credit reservation.
- Logs must not contain prompts, image bytes, signed URLs or secrets.

## Recovery consumer

The production project must invoke `image-council-worker` at least once per
minute. Use Supabase Cron plus Vault-backed credentials. Direct triggering after
start and command requests reduces initial latency, but Cron is the durability
mechanism.

The migration installs the `image-council-recovery` minute job. It becomes
active only after these Vault entries exist:

- `image_council_project_url`: the project API URL, without a trailing slash;
- `image_council_worker_token`: the same high-entropy value configured as the
  Edge Function secret `IMAGE_COUNCIL_WORKER_TOKEN`.

Alert on:

- oldest visible queue message over five minutes;
- provider failure rate over the canary threshold;
- quarantine growth;
- reservation older than thirty minutes without settlement;
- refund failures;
- daily provider spend anomaly;
- private bucket growth outside forecast.

## Deletion

`delete_project` changes the project to purge-pending and enqueues a service-owned
purge. The purge deletes originals, thumbnails, derived artifacts and database
records within 24 hours. Client code must never delete only the project row.

## Deployment note

The Vercel project `fainl` currently reports its latest production Git source as
`DAVEVERA/fainl`, while this checkout declares `Fainlhub/FAINL`. A source deploy
from this checkout can publish the current build, but the Vercel Git integration
must also be reconnected in the Vercel project settings before Git-based
production deploys are considered reliable.

Supabase schema/functions and the Vercel SPA deploy independently. Do not expose
the UI flag until the migration, bucket, queue, secrets, functions and recovery
consumer have all been verified.

## Launch gates

- Start acknowledgement p95 below one second.
- Status reads p95 below 500 ms.
- Initial gallery transfer below 2 MB.
- Zero cross-user table, Storage or Realtime access in SQL tests.
- Zero duplicate charges or artifacts under replay/failure injection.
- No serious aXe findings; all actions keyboard-operable.
- No horizontal overflow at 320, 390, 768, 1024, 1440 or 1600 px.
- Top three contains exact safe artifact IDs; underflow never fabricates slots.
