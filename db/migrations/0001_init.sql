-- Tuneboxd is a single-owner music diary. Login lives at the application level
-- (one username/password from environment variables), so the database has no
-- auth tables and no row-level security: only the server talks to it.

-- Releases & tracks -----------------------------------------------------------

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  mbid uuid not null unique, -- MusicBrainz release group id
  title text not null,
  artist text not null,
  primary_type text,
  secondary_types jsonb not null default '[]'::jsonb,
  release_date text, -- MusicBrainz dates can be partial: YYYY, YYYY-MM, YYYY-MM-DD
  created_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  release_id uuid not null references public.releases (id) on delete cascade,
  disc smallint not null default 1,
  position smallint not null,
  title text not null,
  length_ms int,
  unique (release_id, disc, position)
);

create index tracks_release_idx on public.tracks (release_id);

-- Listens ---------------------------------------------------------------------

create table public.listens (
  release_id uuid primary key references public.releases (id) on delete cascade,
  listened_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('manual', 'lastfm'))
);

create index listens_recent_idx on public.listens (listened_at desc);

-- Ratings ---------------------------------------------------------------------
-- Score: (c1 + c2 + c3 + c4) * 1.4 * vibe multiplier, where the multiplier grows
-- linearly from x1.0000 (vibe 1) to x1.6072 (vibe 10). Max = 56 * 1.6072 ~ 90.
-- Keep in sync with src/lib/score.ts.

create table public.ratings (
  release_id uuid primary key references public.releases (id) on delete cascade,
  rhymes smallint not null check (rhymes between 1 and 10),
  structure smallint not null check (structure between 1 and 10),
  style smallint not null check (style between 1 and 10),
  individuality smallint not null check (individuality between 1 and 10),
  vibe smallint not null check (vibe between 1 and 10),
  score smallint generated always as (
    least(90, round(
      (rhymes + structure + style + individuality) * 1.4
      * (1 + (vibe - 1) * 0.6072 / 9)
    ))::smallint
  ) stored,
  review text check (char_length(review) <= 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ratings_recent_idx on public.ratings (updated_at desc);
create index ratings_score_idx on public.ratings (score desc);

-- Rating a release implies it was listened to.
create or replace function public.rating_marks_listened()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  insert into public.listens (release_id)
  values (new.release_id)
  on conflict (release_id) do nothing;
  new.updated_at := now();
  return new;
end;
$$;

create trigger ratings_mark_listened
  before insert or update on public.ratings
  for each row execute function public.rating_marks_listened();

-- Favourite tracks ------------------------------------------------------------

create table public.favourite_tracks (
  track_id uuid primary key references public.tracks (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index favourite_tracks_release_idx on public.favourite_tracks (release_id);

-- Keeps release_id consistent with the track so counts per release are correct.
create or replace function public.favourite_track_release()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select t.release_id into new.release_id from public.tracks t where t.id = new.track_id;
  return new;
end;
$$;

create trigger favourite_tracks_release
  before insert on public.favourite_tracks
  for each row execute function public.favourite_track_release();

-- Top-10 ----------------------------------------------------------------------
-- The list is ordered by position, so a single owner needs no user column.

create table public.top_releases (
  position smallint primary key check (position between 1 and 10),
  release_id uuid not null unique references public.releases (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Aggregates ------------------------------------------------------------------

create view public.release_stats as
select
  r.release_id,
  count(*)::int as ratings_count,
  round(avg(r.score), 1) as avg_score,
  round(avg(r.rhymes), 1) as avg_rhymes,
  round(avg(r.structure), 1) as avg_structure,
  round(avg(r.style), 1) as avg_style,
  round(avg(r.individuality), 1) as avg_individuality,
  round(avg(r.vibe), 1) as avg_vibe
from public.ratings r
group by r.release_id;

-- App settings ----------------------------------------------------------------
-- Small key/value store for the Last.fm credentials and sync bookkeeping.

create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
