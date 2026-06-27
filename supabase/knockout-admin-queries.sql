-- =====================================================
-- Queries Admin para Eliminatorias
-- Copiar y pegar en el SQL Editor de Supabase
-- =====================================================
--
-- Sistema de puntos (valores fijos, no acumulativos):
--   3 puntos: acertar ganador
--   6 puntos: acertar resultado exacto (goles)
--  10 puntos: acertar penales (si hubo)
-- =====================================================

-- =====================================================
-- 1. AGREGAR PARTIDO ELIMINATORIO
-- =====================================================

-- 16avos de final
insert into knockout_matches (match_id, home_team, away_team, match_time, stage)
values ('16avos-1', 'Equipo A', 'Equipo B', '2026-06-28T18:00:00Z', '16avos');

-- Octavos de final
insert into knockout_matches (match_id, home_team, away_team, match_time, stage)
values ('octavos-1', 'Equipo A', 'Equipo B', '2026-07-02T18:00:00Z', 'Octavos');

-- Cuartos de final
insert into knockout_matches (match_id, home_team, away_team, match_time, stage)
values ('cuartos-1', 'Equipo A', 'Equipo B', '2026-07-06T18:00:00Z', 'Cuartos');

-- Semifinal
insert into knockout_matches (match_id, home_team, away_team, match_time, stage)
values ('semifinal-1', 'Equipo A', 'Equipo B', '2026-07-10T18:00:00Z', 'Semifinal');

-- Final
insert into knockout_matches (match_id, home_team, away_team, match_time, stage)
values ('final-1', 'Equipo A', 'Equipo B', '2026-07-14T18:00:00Z', 'Final');

-- =====================================================
-- 2. CARGAR RESULTADO SIN PENALES
-- =====================================================

update knockout_matches
set home_score = 2, away_score = 1
where match_id = '16avos-1';

-- =====================================================
-- 3. CARGAR RESULTADO CON PENALES
-- =====================================================

-- Ejemplo: empate 1-1 en goles, Argentina gana 4-3 en penales
update knockout_matches
set home_score = 1, away_score = 1, home_penalties = 4, away_penalties = 3
where match_id = 'cuartos-2';

-- =====================================================
-- 4. BLOQUEAR / DESBLOQUEAR PARTIDO
-- =====================================================

-- Bloquear (no se pueden hacer más predicciones)
update knockout_matches set locked = true where match_id = '16avos-1';

-- Desbloquear
update knockout_matches set locked = false where match_id = '16avos-1';

-- =====================================================
-- 5. VER TODOS LOS PARTIDOS ELIMINATORIOS
-- =====================================================

select
  match_id,
  stage,
  home_team,
  away_team,
  home_score,
  away_score,
  home_penalties,
  away_penalties,
  match_time,
  locked
from knockout_matches
order by match_time;

-- =====================================================
-- 6. VER PREDICCIONES DE UN PARTIDO
-- =====================================================

select
  p.user_id,
  pr.username,
  p.home_score_pred,
  p.away_score_pred,
  p.home_penalties_pred,
  p.away_penalties_pred
from knockout_predictions p
join profiles pr on pr.id = p.user_id
where p.match_id = '16avos-1'
order by pr.username;

-- =====================================================
-- 7. VER TODAS LAS PREDICCIONES CON RESULTADOS
-- =====================================================

select
  pr.username,
  km.stage,
  km.home_team,
  km.away_team,
  p.home_score_pred || '-' || p.away_score_pred as prediccion_goles,
  p.home_penalties_pred || '-' || p.away_penalties_pred as prediccion_penales,
  km.home_score || '-' || km.away_score as resultado_goles,
  km.home_penalties || '-' || km.away_penalties as resultado_penales
from knockout_predictions p
join knockout_matches km on km.match_id = p.match_id
join profiles pr on pr.id = p.user_id
order by km.match_time, pr.username;

-- =====================================================
-- 8. RECALCULAR TODOS LOS PUNTOS (GRUPOS + ELIMINATORIAS)
-- =====================================================

select public.recalculate_total_points();
