-- ============================================================
-- Ancre : un nom de profil n'existe qu'une fois.
-- À coller dans Supabase → SQL Editor → Run, après 0001 à 0004.
-- Les doublons « selmen » ont été supprimés le 21/09/2026 : l'index peut être créé.
--
-- L'app vérifie déjà les noms (majuscules, accents et espaces ignorés) avant d'écrire.
-- Cet index est la garantie de la base : même deux créations au même instant
-- ne peuvent plus produire deux profils du même nom (majuscules et espaces ignorés).
-- ============================================================

create unique index if not exists profiles_nom_unique
  on profiles (lower(btrim(regexp_replace(name, '\s+', ' ', 'g'))));
