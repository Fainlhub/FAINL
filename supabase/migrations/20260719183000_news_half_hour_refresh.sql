-- Trigger the bounded news refresh every 30 minutes.
-- The job is inert until both Vault values exist:
--   news_refresh_url    = https://<project-ref>.supabase.co/functions/v1/news-refresh
--   news_refresh_secret = the same value as the NEWS_CRON_SECRET Edge secret

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
declare
  v_job_id bigint;
begin
  select jobid
    into v_job_id
    from cron.job
   where jobname = 'fainl-news-refresh-half-hour';

  if found then
    perform cron.unschedule(v_job_id);
  end if;

  perform cron.schedule(
    'fainl-news-refresh-half-hour',
    '*/30 * * * *',
    $refresh$
      select net.http_post(
        url := refresh_url.decrypted_secret,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-news-cron-secret', refresh_secret.decrypted_secret
        ),
        body := '{"scheduled":true}'::jsonb,
        timeout_milliseconds := 120000
      )
      from vault.decrypted_secrets as refresh_url
      cross join vault.decrypted_secrets as refresh_secret
      where refresh_url.name = 'news_refresh_url'
        and refresh_secret.name = 'news_refresh_secret';
    $refresh$
  );
end;
$$;
