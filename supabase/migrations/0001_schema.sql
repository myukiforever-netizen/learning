-- ============================================================
-- Ancre — schéma de base (jalon 2)
-- À coller tel quel dans Supabase → SQL Editor → Run.
-- Toutes les tables portent user_id (rempli automatiquement) et sont
-- protégées par RLS : seul l'utilisateur connecté voit ses lignes.
-- Les identifiants de matières / modules / concepts / cartes sont des
-- textes stables fournis par les fichiers JSON (clé de fusion v1 → v2).
-- ============================================================

create table if not exists subjects (
  id          text primary key,
  user_id     uuid not null default auth.uid(),
  name        text not null,
  version     integer not null default 1,
  color       text,
  status      text not null default 'active' check (status in ('active', 'paused')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists modules (
  id          text primary key,
  user_id     uuid not null default auth.uid(),
  subject_id  text not null references subjects(id) on delete cascade,
  name        text not null,
  position    integer not null default 0
);

create table if not exists concepts (
  id          text primary key,
  user_id     uuid not null default auth.uid(),
  module_id   text not null references modules(id) on delete cascade,
  name        text not null,
  position    integer not null default 0
);

create table if not exists cards (
  id               text primary key,
  user_id          uuid not null default auth.uid(),
  concept_id       text not null references concepts(id) on delete cascade,
  type             text not null check (type in ('flash','qcm','cloze','why','whatif','worked_example','faded_example','problem','duel','sort')),
  question         text not null,
  answer           text not null,
  explanation      text not null default '',
  explanation_more text,
  options          jsonb,
  options_why      jsonb,
  data             jsonb,
  retention_goal   text not null default '1y' check (retention_goal in ('3m','1y','life')),
  status           text not null default 'active' check (status in ('active','archived')),
  position         integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Une ligne par carte déjà rencontrée. Pas de ligne = carte nouvelle.
create table if not exists reviews (
  card_id        text primary key references cards(id) on delete cascade,
  user_id        uuid not null default auth.uid(),
  due_date       date not null,
  interval_days  integer not null default 0,
  step           integer not null default 0,
  ease_state     text not null default 'new' check (ease_state in ('new','ok','failed','thought_knew')),
  introduced_on  date not null,
  history        jsonb not null default '[]'::jsonb,
  updated_at     timestamptz not null default now()
);

create table if not exists sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid(),
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  duration_target   integer not null,
  free_recall_text  text
);

create table if not exists answers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid(),
  card_id     text not null references cards(id) on delete cascade,
  session_id  uuid not null references sessions(id) on delete cascade,
  correct     boolean not null,
  confidence  integer not null check (confidence between 1 and 3),
  error_box   text check (error_box in ('never_knew','not_retrieved','thought_knew')),
  created_at  timestamptz not null default now()
);

create index if not exists reviews_due_idx on reviews (user_id, due_date);
create index if not exists answers_session_idx on answers (session_id);
create index if not exists answers_card_idx on answers (card_id);
create index if not exists cards_concept_idx on cards (concept_id);

-- ---------- Sécurité : chaque table n'est visible que par son propriétaire ----------
alter table subjects enable row level security;
alter table modules  enable row level security;
alter table concepts enable row level security;
alter table cards    enable row level security;
alter table reviews  enable row level security;
alter table sessions enable row level security;
alter table answers  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['subjects','modules','concepts','cards','reviews','sessions','answers'] loop
    execute format('drop policy if exists "proprietaire" on %I', t);
    execute format(
      'create policy "proprietaire" on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())',
      t
    );
  end loop;
end $$;
