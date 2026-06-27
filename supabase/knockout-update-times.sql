begin;

update knockout_matches
set match_time = (case match_id
  when '16avos-1' then '2026-06-29T20:30:00Z'   -- Lun 29/06 17:30
  when '16avos-2' then '2026-06-30T21:00:00Z'   -- Mar 30/06 18:00
  when '16avos-3' then '2026-06-28T19:00:00Z'   -- Dom 28/06 16:00
  when '16avos-4' then '2026-06-30T01:00:00Z'   -- Lun 29/06 22:00
  when '16avos-5' then '2026-07-02T23:00:00Z'   -- Jue 02/07 20:00
  when '16avos-6' then '2026-07-02T19:00:00Z'   -- Jue 02/07 16:00
  when '16avos-7' then '2026-07-02T00:00:00Z'   -- Mie 01/07 21:00
  when '16avos-8' then '2026-07-01T20:00:00Z'   -- Mie 01/07 17:00
  when '16avos-9' then '2026-06-29T17:00:00Z'   -- Lun 29/06 14:00
  when '16avos-10' then '2026-06-30T17:00:00Z'  -- Mar 30/06 14:00
  when '16avos-11' then '2026-07-01T01:00:00Z'  -- Mar 30/06 22:00
  when '16avos-12' then '2026-07-01T16:00:00Z'  -- Mie 01/07 13:00
  when '16avos-13' then '2026-07-03T22:00:00Z'  -- Vie 03/07 19:00
  when '16avos-14' then '2026-07-03T18:00:00Z'  -- Vie 03/07 15:00
  when '16avos-15' then '2026-07-03T03:00:00Z'  -- Vie 03/07 00:00
  when '16avos-16' then '2026-07-04T01:30:00Z'  -- Vie 03/07 22:30
end)::timestamptz
where match_id in (
  '16avos-1', '16avos-2', '16avos-3', '16avos-4',
  '16avos-5', '16avos-6', '16avos-7', '16avos-8',
  '16avos-9', '16avos-10', '16avos-11', '16avos-12',
  '16avos-13', '16avos-14', '16avos-15', '16avos-16'
);

commit;
