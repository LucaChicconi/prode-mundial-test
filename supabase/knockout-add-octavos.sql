begin;

-- Actualizar octavos-1
update knockout_matches
set home_team = 'Ganador 16avos 1', away_team = 'Ganador 16avos 2'
where match_id = 'octavos-1';

-- Agregar octavos 2 al 8
insert into knockout_matches (match_id, home_team, away_team, match_time, stage)
values
  ('octavos-2', 'Ganador 16avos 3', 'Ganador 16avos 4', '2026-07-02T18:00:00Z', 'Octavos'),
  ('octavos-3', 'Ganador 16avos 5', 'Ganador 16avos 6', '2026-07-02T18:00:00Z', 'Octavos'),
  ('octavos-4', 'Ganador 16avos 7', 'Ganador 16avos 8', '2026-07-02T18:00:00Z', 'Octavos'),
  ('octavos-5', 'Ganador 16avos 9', 'Ganador 16avos 10', '2026-07-02T18:00:00Z', 'Octavos'),
  ('octavos-6', 'Ganador 16avos 11', 'Ganador 16avos 12', '2026-07-02T18:00:00Z', 'Octavos'),
  ('octavos-7', 'Ganador 16avos 13', 'Ganador 16avos 14', '2026-07-02T18:00:00Z', 'Octavos'),
  ('octavos-8', 'Ganador 16avos 15', 'Ganador 16avos 16', '2026-07-02T18:00:00Z', 'Octavos');

commit;
