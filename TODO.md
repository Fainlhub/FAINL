# TODO

## Goal

Make FAINL's public content reliably discoverable and keep the AI news section
fresh through a bounded, source-based, half-hourly publication pipeline.

## Tasks

- [x] Inspect current sitemap, routes, metadata, news functions, storage, and ads
- [x] Verify current Google sitemap, AI search crawler, and AdSense guidance
- [x] Replace the stale sitemap with a static plus dynamic sitemap architecture
- [x] Add RSS, llms discovery, robots rules, and private-route noindex headers
- [x] Add the secured half-hour Supabase news refresh function and cron migration
- [x] Strengthen FAINL tone, content quality, image, and automatic publication gates
- [x] Add generated fallback artwork and responsive news AdSense units
- [x] Add unit and source-contract tests
- [x] Run typecheck, tests, build, XML checks, and browser QA
- [x] Record deployment and secret requirements
- [ ] Deploy the migration and Edge Functions after Supabase CLI authentication is restored
- [ ] Configure `news_refresh_url`, `news_refresh_secret`, and the AdSense slot in production

## Completion Marker

ALL_TASKS_COMPLETE: false
