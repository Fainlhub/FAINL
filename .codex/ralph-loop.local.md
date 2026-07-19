# Ralph Loop State

status: active
iteration: 1
max_iterations: 10
started_at: 2026-07-19T12:00:00+02:00
task: Implement the FAINL Beeldraad plan end to end.

## Completion Criteria

- [ ] Private owner-scoped projects, runs, immutable artifacts, evaluations, rankings, events, and credit reservations exist
- [ ] One active run per user and idempotent start/commands are enforced server-side
- [ ] Nine credits are reserved atomically and unused units are immutably refunded
- [ ] Queue work is bounded to one step/provider call and safely recoverable
- [ ] Five catalogued generators and three blind evaluators have server-owned adapters and kill switches
- [ ] `/beeldraad` and `/beeldraad/:projectId` work across refresh and reconnect
- [ ] Top three, full history, lineage, compare, download, selection, retry, cancel, and delete are accessible
- [ ] Mobile and desktop navigation expose Chat, Beeld, Dossier, and Credits
- [ ] Pricing, privacy, AI terms, provider disclosures, and environment documentation are updated
- [ ] Automated tests, typecheck, build, browser QA, and security gates pass
- [ ] Deployment state and any external key or plan blockers are reported precisely

## Iteration Log

### Iteration 1

Plan:
- Establish durable contracts and credit integrity.
- Build the Supabase schema and bounded worker in parallel.
- Integrate the full frontend locally.

Evidence:
- Current worktree inspected; only `.claude/settings.local.json` was pre-existing and remains untouched.
- Supabase Queue, Storage RLS, Realtime Broadcast, Cron, and Edge Function limits re-verified against current documentation.
- Existing credit and route architecture inspected.

Decision:
- continue
