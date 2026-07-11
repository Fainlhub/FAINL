-- Columns the announcement-banner insert already sends (App.tsx).
ALTER TABLE public.newsletter_subscribers
  ADD COLUMN promo_code text,
  ADD COLUMN source text;
