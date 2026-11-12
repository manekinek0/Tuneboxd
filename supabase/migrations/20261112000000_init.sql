-- Tuneboxd initial schema.
-- Releases and tracks are a local cache of MusicBrainz release groups; they are
-- written only by the server (secret key), everything else is user-owned and
-- protected by RLS.

create extension if not exists citext with schema extensions;

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username extensions.citext not null unique
    check (username ~ '^[a-zA-Z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 60),
  bio text check (char_length(bio) <= 500),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Creates a profile for every new auth user with a unique username derived
-- from OAuth metadata or the email local part.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n int := 0;
begin
  base := coalesce(
    new.raw_user_meta_data ->> 'user_name',
    new.raw_user_meta_data ->> 'preferred_username',
    split_part(coalesce(new.email, ''), '@', 1),
    'user'
  );
  base := left(regexp_replace(base, '[^a-zA-Z0-9_]', '', 'g'), 20);
  if char_length(base) < 3 then
    base := 'user' || base;
  end if;
  candidate := base;
  while exists (select 1 from public.profiles where username = candidate::extensions.citext) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    candidate,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Releases & tracks -----------------------------------------------------------

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  mbid uuid not null unique, -- MusicBrainz release group id
  title text not null,
  artist text not null,
  primary_type text,
  secondary_types text[] not null default '{}',
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

-- Listens & ratings -----------------------------------------------------------

create table public.listens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, release_id)
);

create index listens_user_idx on public.listens (user_id, created_at desc);

-- Score: (c1 + c2 + c3 + c4) * 1.4 * vibe multiplier, where the multiplier grows
-- linearly from x1.0000 (vibe 1) to x1.6072 (vibe 10). Max = 56 * 1.6072 ~ 90.
-- Keep in sync with src/lib/score.ts.
create table public.ratings (
  user_id uuid not null references public.profiles (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
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
  updated_at timestamptz not null default now(),
  primary key (user_id, release_id)
);

create index ratings_release_idx on public.ratings (release_id, updated_at desc);
create index ratings_recent_idx on public.ratings (updated_at desc);

-- Rating a release implies it was listened to.
create or replace function public.rating_marks_listened()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.listens (user_id, release_id)
  values (new.user_id, new.release_id)
  on conflict do nothing;
  new.updated_at := now();
  return new;
end;
$$;

create trigger ratings_mark_listened
  before insert or update on public.ratings
  for each row execute function public.rating_marks_listened();

-- Favourite tracks -------------------------------------------------------------

create table public.favourite_tracks (
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  release_id uuid not null references public.releases (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

create index favourite_tracks_release_idx on public.favourite_tracks (release_id);

-- Keeps release_id consistent with the track so counts per release are correct.
create or replace function public.favourite_track_release()
returns trigger
language plpgsql
security invoker
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

-- Top-10 -----------------------------------------------------------------------

create table public.top_releases (
  user_id uuid not null references public.profiles (id) on delete cascade,
  position smallint not null check (position between 1 and 10),
  release_id uuid not null references public.releases (id) on delete cascade,
  primary key (user_id, position),
  unique (user_id, release_id)
);

-- Atomically replaces the caller's top list (ordered, up to 10 releases).
create or replace function public.set_top_releases(release_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if coalesce(array_length(release_ids, 1), 0) > 10 then
    raise exception 'top list can contain at most 10 releases';
  end if;

  delete from public.top_releases where user_id = auth.uid();
  insert into public.top_releases (user_id, position, release_id)
  select auth.uid(), ord, rid
  from unnest(release_ids) with ordinality as u(rid, ord);
end;
$$;

-- Follows ----------------------------------------------------------------------

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index follows_following_idx on public.follows (following_id);

-- Aggregates -------------------------------------------------------------------

create view public.release_stats
with (security_invoker = on) as
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

create view public.track_favourite_counts
with (security_invoker = on) as
select track_id, release_id, count(*)::int as favourites
from public.favourite_tracks
group by track_id, release_id;

-- Row level security -------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.releases enable row level security;
alter table public.tracks enable row level security;
alter table public.listens enable row level security;
alter table public.ratings enable row level security;
alter table public.favourite_tracks enable row level security;
alter table public.top_releases enable row level security;
alter table public.follows enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update
  to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "releases are public" on public.releases for select using (true);
create policy "tracks are public" on public.tracks for select using (true);

create policy "listens are public" on public.listens for select using (true);
create policy "users add own listens" on public.listens for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "users delete own listens" on public.listens for delete
  to authenticated using ((select auth.uid()) = user_id);

create policy "ratings are public" on public.ratings for select using (true);
create policy "users add own ratings" on public.ratings for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "users update own ratings" on public.ratings for update
  to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "users delete own ratings" on public.ratings for delete
  to authenticated using ((select auth.uid()) = user_id);

create policy "favourite tracks are public" on public.favourite_tracks for select using (true);
create policy "users add own favourite tracks" on public.favourite_tracks for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "users delete own favourite tracks" on public.favourite_tracks for delete
  to authenticated using ((select auth.uid()) = user_id);

create policy "top lists are public" on public.top_releases for select using (true);
create policy "users add own top" on public.top_releases for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "users delete own top" on public.top_releases for delete
  to authenticated using ((select auth.uid()) = user_id);

create policy "follows are public" on public.follows for select using (true);
create policy "users follow" on public.follows for insert
  to authenticated with check ((select auth.uid()) = follower_id);
create policy "users unfollow" on public.follows for delete
  to authenticated using ((select auth.uid()) = follower_id);

grant execute on function public.set_top_releases(uuid[]) to authenticated;
revoke execute on function public.set_top_releases(uuid[]) from anon, public;
