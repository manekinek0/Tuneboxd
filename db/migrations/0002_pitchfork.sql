-- Pitchfork score -----------------------------------------------------------
-- Scores are scraped from the public review page and cached here so a release
-- is looked up at most once per month (including releases without a review).

alter table public.releases
  add column pitchfork_score numeric(3, 1)
    check (pitchfork_score between 0 and 10),
  add column pitchfork_url text,
  add column pitchfork_checked_at timestamptz;

comment on column public.releases.pitchfork_score is 'Pitchfork review score (0–10), null when not reviewed';
comment on column public.releases.pitchfork_url is 'Canonical Pitchfork review URL';
comment on column public.releases.pitchfork_checked_at is 'Last successful Pitchfork lookup, including no-result lookups';
