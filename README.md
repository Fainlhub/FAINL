# FAINL — Fully Autonomous Intelligence Network & Logic

**Meerdere AI's. Één eindoordeel.**

FAINL is een multi-model AI consensus engine. Stuur één vraag tegelijk naar Gemini, GPT-4, Claude, Llama en meer — laat ze live debatteren — en ontvang één gewogen, gezaghebbend eindoordeel van Voorzitter Victor.

---

## Hoe werkt het?

1. **Parallelle analyse** — 3 of 5 AI-modellen analyseren jouw vraag onafhankelijk van elkaar
2. **Live debat** — modellen bevragen elkaars redenering en corrigeren elkaars fouten
3. **Compositie** — jij kiest de sterkste inzichten uit elke node
4. **Eindoordeel** — Voorzitter Victor synthetiseert alles tot één messcherpe conclusie

---

## Tech Stack

| Laag | Technologie |
|------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Routing | React Router v6 |
| Backend / Auth | Supabase (Edge Functions + Postgres) |
| AI Proxy | Supabase Edge Function → Google, OpenAI, Anthropic, Groq, Mistral, DeepSeek |
| Payments | Stripe Payment Links |
| Hosting | GitHub Pages (SPA routing via 404.html) |

---

## Lokaal draaien

```bash
npm install
cp .env.example .env   # vul VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in
npm run dev
```

De app draait op `http://localhost:3000`.

---

## Google auth

De login flow stuurt Google/Supabase terug naar `/auth/callback`.

Voor lokaal gebruik:

- `.env`: `VITE_SITE_URL=http://localhost:3000`
- Supabase Auth Redirect URLs: `http://localhost:3000/auth/callback`
- Google OAuth Authorized JavaScript origins: `http://localhost:3000`
- Google OAuth Authorized redirect URI: de Supabase callback URL uit de Google provider pagina, meestal `https://<project-ref>.supabase.co/auth/v1/callback`

Voor productie/Vercel:

- Vercel env: `VITE_SITE_URL=https://fainl.com`
- Supabase Site URL: `https://fainl.com`
- Supabase Auth Redirect URLs: `https://fainl.com/auth/callback`
- Google OAuth Authorized JavaScript origins: `https://fainl.com`
- Google OAuth Authorized redirect URI: dezelfde Supabase callback URL als hierboven

---

## Projectstructuur

```
├── App.tsx                    # Root component, routing, state management
├── index.tsx                  # React entry point
├── types.ts                   # Gedeelde TypeScript types & enums
├── constants.ts               # Council config, system prompts, pricing
├── components/
│   ├── LandingPage.tsx        # Home pagina met hero input
│   ├── CouncilCard.tsx        # Node response kaart (per AI model)
│   ├── DebateRoom.tsx         # Live debat interface
│   ├── CompositionStage.tsx   # Drag-and-drop antwoord samenstellen
│   ├── PaywallModal.tsx       # Upgrade / login flow
│   ├── PricingPage.tsx        # Credits & abonnementen
│   ├── AccountPage.tsx        # Dashboard: sessiegeschiedenis, nodes
│   └── ...                    # SEO, FAQ, Contact, Legal pages
├── services/
│   ├── councilService.ts      # AI-aanroepen (proxy + lokaal)
│   ├── parser.ts              # XML/markdown compartiment parser
│   └── supabaseClient.ts      # Supabase initialisatie
├── contexts/
│   └── LanguageContext.tsx    # NL/EN vertalingen
└── data/
    └── directives.ts          # 1200+ voorbeeldvragen (Cookbook)
```

---

## Toegangsmodel

- **2 gratis sessies** — anoniem, geen account nodig (localStorage tracking)
- **Paywall** — na 2 sessies: login + credits of abonnement verplicht
- **Credits** — €2,99 per credit (eenmalig) via Stripe
- **Abonnementen** — Starter (50 credits/m) of Pro (300 credits/m)
- **Lifetime** — onbeperkte toegang

---

## Deployment

Elke push naar `main` triggert de GitHub Actions workflow (`.github/workflows/deploy.yml`) die de app bouwt en naar GitHub Pages deployt. De `public/404.html` is een kopie van `index.html` — dit zorgt voor correcte SPA-routing zonder server-side redirects.
