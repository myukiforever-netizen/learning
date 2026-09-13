-- ============================================================
-- Ancre : profils à la Netflix (plus de connexion par email).
-- À coller dans Supabase → SQL Editor → Run, après 0001, 0002 et 0003.
--
-- Le contenu (matières, modules, concepts, cartes) est partagé.
-- La progression (révisions, réponses, séances, réglages, planètes, XP) est PAR PROFIL.
-- Sans compte, l'accès est ouvert à qui possède l'adresse du projet et la clé publique :
-- l'app est personnelle, pas publique. Le serveur peut utiliser une clé secrète
-- (SUPABASE_SECRET_KEY dans .env.local) pour ne jamais exposer l'écriture au navigateur.
-- ============================================================

-- 0. Les anciennes règles « propriétaire » dépendent de user_id : on les retire d'abord.
do $
declare t text;
begin
  foreach t in array array['subjects','modules','concepts','cards','reviews','sessions','answers','settings','planet_progress','galaxy_progress','profile','progression','xp_events'] loop
    if to_regclass(t) is not null then
      execute format('drop policy if exists "proprietaire" on %I', t);
    end if;
  end loop;
end $;

create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  avatar      text not null default '🚀',
  hue         integer not null default 240 check (hue between 0 and 359),
  created_at  timestamptz not null default now()
);

-- ---------- Le contenu n'appartient plus à un compte ----------
alter table subjects drop column if exists user_id cascade;
alter table modules  drop column if exists user_id cascade;
alter table concepts drop column if exists user_id cascade;
alter table cards    drop column if exists user_id cascade;

-- ---------- La progression appartient à un profil ----------
-- reviews : une ligne par (profil, carte)
alter table reviews drop column if exists user_id cascade;
alter table reviews add column if not exists profile_id uuid references profiles(id) on delete cascade;
alter table reviews drop constraint if exists reviews_pkey;
delete from reviews where profile_id is null;
alter table reviews alter column profile_id set not null;
alter table reviews add primary key (profile_id, card_id);

alter table sessions drop column if exists user_id cascade;
alter table sessions add column if not exists profile_id uuid references profiles(id) on delete cascade;
delete from sessions where profile_id is null;
alter table sessions alter column profile_id set not null;

alter table answers drop column if exists user_id cascade;
alter table answers add column if not exists profile_id uuid references profiles(id) on delete cascade;
delete from answers where profile_id is null;
alter table answers alter column profile_id set not null;

-- settings : une ligne par profil
alter table settings drop constraint if exists settings_pkey;
alter table settings drop column if exists user_id cascade;
alter table settings add column if not exists profile_id uuid references profiles(id) on delete cascade;
delete from settings where profile_id is null;
alter table settings add primary key (profile_id);

-- planet_progress : une ligne par (profil, planète)
alter table planet_progress drop constraint if exists planet_progress_pkey;
alter table planet_progress drop column if exists user_id cascade;
alter table planet_progress add column if not exists profile_id uuid references profiles(id) on delete cascade;
delete from planet_progress where profile_id is null;
alter table planet_progress alter column profile_id set not null;
alter table planet_progress add primary key (profile_id, concept_id);

-- galaxy_progress : une ligne par (profil, galaxie)
alter table galaxy_progress drop constraint if exists galaxy_progress_pkey;
alter table galaxy_progress drop column if exists user_id cascade;
alter table galaxy_progress add column if not exists profile_id uuid references profiles(id) on delete cascade;
delete from galaxy_progress where profile_id is null;
alter table galaxy_progress alter column profile_id set not null;
alter table galaxy_progress add primary key (profile_id, module_id);

-- profile (XP, carburant, badges, vaisseau, audio) devient « progression », une ligne par profil
alter table if exists profile rename to progression;
alter table progression drop constraint if exists profile_pkey;
alter table progression drop column if exists user_id cascade;
alter table progression add column if not exists profile_id uuid references profiles(id) on delete cascade;
delete from progression where profile_id is null;
alter table progression add primary key (profile_id);

alter table xp_events drop column if exists user_id cascade;
alter table xp_events add column if not exists profile_id uuid references profiles(id) on delete cascade;
delete from xp_events where profile_id is null;
alter table xp_events alter column profile_id set not null;

create index if not exists reviews_profile_due_idx on reviews (profile_id, due_date);
create index if not exists answers_profile_idx on answers (profile_id);
create index if not exists sessions_profile_idx on sessions (profile_id);

-- ---------- Accès sans compte : les règles par utilisateur sont remplacées ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','subjects','modules','concepts','cards','reviews','sessions','answers','settings','planet_progress','galaxy_progress','progression','xp_events'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "proprietaire" on %I', t);
    execute format('drop policy if exists "ouvert" on %I', t);
    execute format('create policy "ouvert" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;
