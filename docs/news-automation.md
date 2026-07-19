# FAINL News Automation

## Runtime

The news pipeline runs as one bounded refresh:

1. `news-refresh` authenticates the cron request and rejects concurrent refreshes.
2. `news-ingest` fetches enabled first-party RSS or Atom sources and upserts source items.
3. `news-generate` selects one unprocessed item, rewrites it in the FAINL voice,
   validates the result, generates a specific editorial image, and publishes only
   when both quality gates pass.
4. Failed text or image gates leave the article in `review`; they never publish
   incomplete output.

The database cron fires every 30 minutes. It may legitimately produce zero posts
when no unprocessed source item exists.

## Supabase Deployment

Required Edge Function secrets:

- `NEWS_ADMIN_TOKEN`
- `NEWS_CRON_SECRET`
- `OPENAI_API_KEY` and/or `GEMINI_API_KEY`
- Optional `NEWS_TEXT_MODEL`
- Optional `NEWS_IMAGE_MODEL` (default: `gpt-image-2`)
- Optional `NEWS_GEMINI_IMAGE_MODEL`

Deploy:

```powershell
npx.cmd supabase functions deploy news-ingest
npx.cmd supabase functions deploy news-generate
npx.cmd supabase functions deploy news-refresh
npx.cmd supabase db push --linked
```

Create two Vault entries after choosing a strong `NEWS_CRON_SECRET`:

```sql
select vault.create_secret(
  'https://PROJECT_REF.supabase.co/functions/v1/news-refresh',
  'news_refresh_url'
);

select vault.create_secret(
  'THE_SAME_VALUE_AS_NEWS_CRON_SECRET',
  'news_refresh_secret'
);
```

The scheduled SQL is deliberately inert until both Vault entries exist.

## Discovery

- `/sitemap.xml` is a sitemap index.
- `/sitemap-static.xml` contains canonical public application and knowledge pages.
- `/api/news-sitemap` is generated from currently published Supabase articles and
  includes image metadata.
- `/api/news-feed` provides RSS 2.0 with recent full article content.
- `/nieuws` and `/nieuws/:slug` receive crawlable server-rendered initial HTML on
  Vercel, then load the existing React application.
- `/llms.txt` is an optional discovery aid. Google indexing does not depend on it.

All canonical URLs use `https://www.fainl.com`, matching the production redirect.

## Google Ads

Set `VITE_ADSENSE_NEWS_SLOT` in the Vercel build environment to a responsive
AdSense display-unit slot ID. Without a valid slot ID, the news ad components
render nothing.

Ads load only when:

- the visitor explicitly accepted advertising consent;
- the account is not ad-free;
- the profile state is known;
- a slot ID is configured.

The code uses one manual unit per news listing or article. Keep AdSense Auto Ads
anchor, vignette, and automatic in-page placements disabled for these routes.

Before production ad serving in the EEA, configure Google's Privacy & Messaging
or another Google-certified TCF CMP in AdSense. The application consent gate is
defense in depth, not a replacement for the certified CMP requirement.

## Release Checks

1. Confirm the cron job exists in `cron.job`.
2. Trigger `news-refresh` once with the cron secret.
3. Confirm one succeeded `cron` run plus nested `ingest` and `generate` runs.
4. Verify either a published post with a reachable image or a review item with
   explicit gate notes.
5. Check the slug in `/api/news-sitemap`, `/api/news-feed`, and the initial HTML.
6. Submit `https://www.fainl.com/sitemap.xml` in Google Search Console.
7. Validate the AdSense placement after certified consent is active.
