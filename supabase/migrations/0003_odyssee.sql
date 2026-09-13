-- ============================================================
-- Ancre : Odyssée (refonte spatiale) : progression des planètes et galaxies, profil.
-- À coller dans Supabase → SQL Editor → Run, après 0001 et 0002.
-- ============================================================

-- Progression par planète (= concept). Pas de ligne = planète jamais visitée.
create table if not exists planet_progress (
  concept_id    text primary key references concepts(id) on delete cascade,
  user_id       uuid not null default auth.uid(),
  stage         text not null default 'available'
                check (stage in ('available','discovered','understood','trained','validated')),
  best_score    integer not null default 0 check (best_score between 0 and 100),
  attempts      integer not null default 0,
  probe_passed  boolean not null default false,
  validated_at  timestamptz,
  updated_at    timestamptz not null default now()
);

-- Progression par galaxie (= module). Pas de ligne = soleil pas encore franchi.
create table if not exists galaxy_progress (
  module_id   text primary key references modules(id) on delete cascade,
  user_id     uuid not null default auth.uid(),
  sun_score   integer not null default 0 check (sun_score between 0 and 100),
  attempts    integer not null default 0,
  passed_at   timestamptz,
  jumped      boolean not null default false,
  updated_at  timestamptz not null default now()
);

-- Profil du joueur : une ligne par utilisateur.
create table if not exists profile (
  user_id     uuid primary key default auth.uid(),
  xp          integer not null default 0,
  fuel        integer not null default 50,
  badges      jsonb not null default '[]'::jsonb,
  ship        jsonb not null default '{}'::jsonb,
  audio       jsonb not null default '{"music": true, "effects": true, "volume": 0.6}'::jsonb,
  updated_at  timestamptz not null default now()
);

-- Phase et niveau d'une carte (surcharges du JSON ; sinon déduits du type), écrans de découverte d'un concept.
alter table cards add column if not exists phase text check (phase in ('comprehension','entrainement'));
alter table cards add column if not exists level integer check (level between 1 and 3);
alter table concepts add column if not exists discovery jsonb;
alter table modules add column if not exists galaxy jsonb;
alter table concepts add column if not exists planet jsonb;

-- Contexte d'une réponse : dans quelle phase elle a été donnée.
alter table answers add column if not exists context text
  check (context in ('comprehension','entrainement','mission','soleil','patrouille','comete','sonde'));

-- Journal des gains d'XP (pour les statistiques et les badges).
create table if not exists xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  kind        text not null,
  amount      integer not null,
  ref_id      text,
  created_at  timestamptz not null default now()
);

alter table planet_progress enable row level security;
alter table galaxy_progress enable row level security;
alter table profile         enable row level security;
alter table xp_events       enable row level security;

do $$
declare t text;
begin
  foreach t in array array['planet_progress','galaxy_progress','profile','xp_events'] loop
    execute format('drop policy if exists "proprietaire" on %I', t);
    execute format(
      'create policy "proprietaire" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;
