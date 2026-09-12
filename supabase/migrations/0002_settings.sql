-- ============================================================
-- Ancre — jalon 5 : réglages (une ligne par utilisateur)
-- À coller dans Supabase → SQL Editor → Run, après 0001_schema.sql.
-- ============================================================

create table if not exists settings (
  user_id      uuid primary key default auth.uid(),
  new_per_day  integer not null default 15 check (new_per_day between 1 and 60),
  updated_at   timestamptz not null default now()
);

alter table settings enable row level security;

drop policy if exists "proprietaire" on settings;
create policy "proprietaire" on settings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
