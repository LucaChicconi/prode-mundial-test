begin;

update knockout_matches
set
  home_team = case match_id
    when '16avos-1' then 'Alemania'
    else home_team
  end,
  away_team = case match_id
    when '16avos-1' then '3A/B/C/D/F'
    else away_team
  end
where match_id in (
  '16avos-1', '16avos-2', '16avos-3', '16avos-4',
  '16avos-5', '16avos-6', '16avos-7', '16avos-8',
  '16avos-9', '16avos-10', '16avos-11', '16avos-12',
  '16avos-13', '16avos-14', '16avos-15', '16avos-16'
);

commit;
