# FAINL Beeldraad Implementatieplan

## Doel

Beeldraad is een aparte FAINL-hoofdmodus op `/beeldraad` en
`/beeldraad/:projectId`. Een sessie verwerkt één tekstprompt via vijf
onafhankelijke beeldmodellen, laat drie multimodale raadsleden de resultaten
blind beoordelen en bediscussiëren, verfijnt ieder bruikbaar ontwerp en
presenteert een prominente top drie zonder de overige versies te verbergen.

## Begrensde pipeline

1. Prompt, instellingen, moderatie en reservering van maximaal negen credits.
2. Vijf onafhankelijke originelen.
3. Outputmoderatie en drie blinde vision-beoordelingen.
4. Een tweede debatronde met geanonimiseerde peerscores.
5. Een verfijningsbrief en maximaal één algemene verfijning per bruikbare branch.
6. Herbeoordeling en een definitieve ranking.
7. Hoogwaardige polish voor maximaal drie finalisten.
8. Maximaal één gerichte herstelpoging per finalist.
9. Verificatie, immutable opslag en atomische creditafrekening.

## Providers

- Google `gemini-3.1-flash-image`
- OpenAI `gpt-image-2`
- Hugging Face `Qwen/Qwen-Image`
- Hugging Face `Tongyi-MAI/Z-Image-Turbo`
- Hugging Face `stabilityai/stable-diffusion-xl-base-1.0`
- Finale editor: Google `gemini-3-pro-image`

De server-side modelcatalogus bezit capabilities, tarieven, licentiestatus,
fallbacks en kill switches. Een model wordt alleen actief als commerciële inzet
expliciet is toegestaan.

## Data en beveiliging

Supabase bezit orchestratie, Postgres, private Storage, Realtime, Queue en
credits. De frontend blijft een statische React/Vite-app op Vercel.

Tabellen:

- `image_projects`
- `image_runs`
- `image_branches`
- `image_artifacts`
- `image_evaluations`
- `image_rankings`
- `image_events`
- `credit_reservations`
- `image_model_catalog`

De private bucket heet `image-council`. Objectnamen zijn uniek en worden nooit
met `upsert` vervangen. Alleen owner-RLS en kortlevende signed URLs geven
toegang. Verwijdering maakt een purge-opdracht aan; de worker wist objecten en
records uiterlijk binnen 24 uur.

De private queue heet `image_council_steps`. Elke message bevat één begrensde
stap of providercall. Een directe trigger verlaagt de initiële wachttijd; een
cron-consumer per minuut herstelt achtergebleven werk.

## Statusmachine

`queued → moderating → generating → evaluating → debating → refining → ranking → polishing → completed`

Terminale varianten:

`partial`, `failed`, `cancel_requested`, `cancelled`, `quarantined`.

## Credits

Een standaardrun reserveert maximaal negen credits:

- maximaal vijf succesvolle branchbundels;
- één raad-, debat- en rankingbundel;
- maximaal drie succesvolle finalist-polishes.

Ongebruikte, mislukte of geannuleerde onderdelen worden automatisch en
immutable teruggestort. BYOK-imagegeneratie valt buiten v1.

## UX

- Composer mode: `Chat | Beeldraad`.
- Desktop: Beeldraad plus beeldgeschiedenis in de sidebar.
- Mobiel: `Chat · Beeld · Dossier · Credits`.
- Proces: `Briefing → Maken → Beoordelen → Verfijnen → Selectie`.
- Desktop: rang 1 groot, rang 2 en 3 ernaast.
- Mobiel: alle finalisten onder elkaar.
- Onder de top drie blijft `Alle ontwerpen` beschikbaar.
- Inspector: `Origineel → Critique → Tussenversies → Finale versie`.
- Iedere versie ondersteunt bekijken, vergelijken, downloaden en promoten.
- De gebruiker kan altijd afwijken van het advies van de raad.

## Test- en launchgates

- Unit: state-machine, blind shuffle, ranking, prompts, parsers en settlement.
- SQL: RLS, Storage, idempotency, dubbele tabs, reserve en refund.
- Contracttests gebruiken fixtures en doen geen betaalde live generatie.
- Failure injection na iedere stap bewijst hervatting zonder dubbele images of credits.
- E2E: start, refresh, partial, retry, cancel, selectie, download en verwijderen.
- Viewports: 320, 390, 768, 1024, 1440 en 1600 px.
- Minimaal 44 px touch targets, geen horizontale overflow en geen ernstige aXe-fouten.
- Featureflag `image_council_enabled`, gevolgd door intern gebruik, 10% canary en algemene uitrol.

## Uitvoeringsvolgorde

1. Credit-integriteit en server-owned pricing.
2. Schema, RLS, Storage, Queue en modelcatalogus.
3. Provideradapters, moderatie en fixtures.
4. Idempotente worker en recovery-state-machine.
5. Routes, composer, Realtime en herstel na refresh.
6. Top drie, gallery, lineage, viewer en commando’s.
7. Pricing-, privacy-, AI- en providerdisclosures.
8. Tests, securityaudit, mobiele QA, canary en productie-uitrol.
