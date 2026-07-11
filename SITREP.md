# SITREP — FAINL Stage 2 Chat Module

Laatst bijgewerkt: 2026-07-11, na M5 (cloud mission-history). Plan: `C:\Users\Thinkpat\.claude\plans\fainl-now-answers-one-generic-ocean.md`

## Status per milestone

| Milestone | Status | Details |
|---|---|---|
| M1 — DB + protocol | ✅ KLAAR | 6 migraties live op Supabase (wckeqplxleycbiijgklv), RLS geverifieerd, advisors schoon |
| M2+M3 — Chat UI + tiers + credits | ✅ KLAAR (code) | Build + typecheck groen; live test wacht op proxy-deploy |
| M4 — Sidebar-org + zoeken | ✅ KLAAR | Vastgezet/Projecten/hovermenu + search_threads RPC gewired |
| M5 — Panels + cloud history | ✅ KLAAR | NodeConfig/Designs/Plug-ins panels; /mission-sessies naar council_sessions incl. eenmalige localStorage-import |
| M6 — Beleid & compliance | 🔨 BEZIG | Refund/DPA/bewaartermijn/voorwaarden/cookies/privacy |
| FINAL — Deploy + regressie | ⛔ WACHT OP GEBRUIKER | ai-proxy deploy is user-gated; alles daarna |

## Wat er live staat (Supabase, project wckeqplxleycbiijgklv)

- Migraties (allemaal toegepast én als lokale files in `supabase/migrations/` met matchende versies):
  `core_platform_tables` (user_profiles/session_feedback/newsletter_subscribers), `chat_module` (chat_projects/chat_threads/chat_messages/council_sessions + RLS + trigger), `deduct_credits_amount` (multi-credit RPC), `harden_credit_rpcs` (anon-revokes + index), `search_threads` (zoek-RPC), `newsletter_extra_columns`.
- Belangrijk gevonden probleem: dit project was half leeg — `user_profiles` bestond niet (oude project-ref `omysorbuzowyabcprpgm` in .env is stale). Nu aangemaakt.
- Secrets voor ai-proxy staan er al (eerder vandaag gepusht): STRIPE, ANTHROPIC, GEMINI, OPENAI, DEEPSEEK, PERPLEXITY. **Ontbreken nog: GROQ, MISTRAL, OPENROUTER, NEMOTRON, GLM** — alleen relevant als die providers gebruikt worden.

## Wat NIET gedeployed is (bewuste keuze gebruiker: "not yet — keep building")

- `supabase/functions/ai-proxy/index.ts` — lokaal herschreven met `messages[]` multi-turn + rate limiting, **maar de live functie draait nog de oude single-turn versie**. Chat (Instant + tiers) werkt pas live na deploy:
  `npx supabase functions deploy ai-proxy --project-ref wckeqplxleycbiijgklv --no-verify-jwt` (met SUPABASE_ACCESS_TOKEN env var).
- Frontend is niet gecommit/gepusht — alles staat alleen in de working tree.

## Nog te doen

1. **M6 (bezig)**: beleidspagina's — refundbeleid in voorwaarden, nieuwe DPA-pagina `/verwerkersovereenkomst`, bewaartermijnen + "verwijder al mijn gegevens" in AccountPage, `/ai-voorwaarden` update (BYOK/fair-use/tiers), cookie-verklaring + privacy statement update. Teksten = concept; eigenaar doet juridische eindredactie.
2. **FINAL** (user-gated): ai-proxy deployen → curl-regressie (legacy `prompt`-pad + nieuw `messages[]`-pad) → `npm run dev` end-to-end (anon Instant-chat, ingelogd cloud-persist, tier-aftrek, /mission-regressie) → commit + push (Fainlhub/FAINL) → Vercel-deploy. NB: Vercel is nog gelinkt aan het oude repo `DAVEVERA/fainl` — relink in dashboard vereist vóór auto-deploys werken (of eenmalige handmatige deploy).

## Openstaande aandachtspunten / bekende risico's

- **Vercel git-link**: productie fainl.com bouwt uit `DAVEVERA/fainl`, wij pushen naar `Fainlhub/FAINL`. Dashboard-relink nodig (Project Settings → Git). De eerdere contact-formulier-fix is hierdoor óók nog niet live.
- **Inclusie-RPC's ontbreken** in dit Supabase-project (`get_inclusion_status`, `use_inclusion_credit`, `redeem_inclusion_voucher`) — pre-existing; App.tsx vangt de fouten af, inclusiepad doet gewoon niets. Buiten scope stage 2.
- Rate limiter in ai-proxy is per-isolate (best effort); escalatiepad = JWT vereisen voor `messages[]` of Cloudflare.
- `.env` bevat stale refs naar `omysorbuzowyabcprpgm` (DATABASE_URL, DIRECT_URL, SUPABASE_JWKS_URL) — opruimen wenselijk.
- BYOK: alleen Google/Anthropic/Groq/OpenRouter (browser-CORS); sleutels puur client-side (`fainl_byok_v1`), gaan nooit door FAINL-servers.

## Architectuur-kernpunten (voor wie verder bouwt)

- `contexts/ChatContext.tsx` = enige chat-orchestrator (SessionContext is verwijderd). `services/chatService.ts` = DB-CRUD + prompthelpers; `services/byokService.ts` = direct-browser provider calls.
- Tier-ladder in `constants.ts` (`CHAT_TIERS`): instant 0cr → moderate 1 → complex 2 → max 3 → ultra 5 (+peer review). Node-volgorde (Node-configuratie-panel, `fainl_config_v2.activeCouncil`) bepaalt deelname per tier.
- Chatberichten: één rij per beurt in `chat_messages`; consensus-detail in `metadata` jsonb (NOOIT selecteren in lijstqueries).
- `/mission` (consensus-module) ongewijzigd qua flow; deelt ai-proxy. "Toets dit antwoord"-knop in chat springt naar /mission met autoQuery.
