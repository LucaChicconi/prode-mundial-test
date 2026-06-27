-- =====================================================
-- Trigger para recalcular puntos incluyendo eliminatorias
-- =====================================================

-- Función auxiliar para obtener puntos de eliminatorias por usuario
create or replace function public.get_knockout_points_for_user(p_user_id uuid)
returns integer
language sql
security definer
as $$
  with knockout_scored as (
    select
      kp.user_id,
      case
        -- Si el partido no tiene resultado, 0 puntos
        when km.home_score is null or km.away_score is null then 0

        -- Si el usuario no predijo, 0 puntos
        when kp.home_score_pred is null or kp.away_score_pred is null then 0

        -- Si hubo penales
        when km.home_penalties is not null and km.away_penalties is not null then
          case
            -- Acertó penales: 10 puntos
            when kp.home_penalties_pred = km.home_penalties
              and kp.away_penalties_pred = km.away_penalties
            then 10

            -- Acertó resultado exacto de goles: 6 puntos
            when kp.home_score_pred = km.home_score
              and kp.away_score_pred = km.away_score
            then 6

            -- Acertó ganador (incluyendo penales): 3 puntos
            when (
              case
                when kp.home_score_pred > kp.away_score_pred then 'home'
                when kp.away_score_pred > kp.home_score_pred then 'away'
                else 'draw'
              end
            ) = (
              case
                when km.home_penalties > km.away_penalties then 'home'
                when km.away_penalties > km.home_penalties then 'away'
                else 'draw'
              end
            ) then 3

            else 0
          end

        -- Sin penales
        else
          case
            -- Acertó resultado exacto: 6 puntos
            when kp.home_score_pred = km.home_score
              and kp.away_score_pred = km.away_score
            then 6

            -- Acertó ganador: 3 puntos
            when (
              case
                when kp.home_score_pred > kp.away_score_pred then 'home'
                when kp.away_score_pred > kp.home_score_pred then 'away'
                else 'draw'
              end
            ) = (
              case
                when km.home_score > km.away_score then 'home'
                when km.away_score > km.home_score then 'away'
                else 'draw'
              end
            ) then 3

            else 0
          end
      end as points
    from public.knockout_predictions kp
    join public.knockout_matches km on km.match_id = kp.match_id
    where kp.user_id = p_user_id
  )
  select coalesce(sum(points), 0)::integer from knockout_scored;
$$;

-- Función principal de recálculo (modificada para incluir eliminatorias)
create or replace function public.recalculate_total_points()
returns void
language sql
security definer
as $$
  with normalized_matches as (
    select
      m.*,
      lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as home_team_norm,
      lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) as away_team_norm,
      lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania') as home_is_top,
      lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('francia', 'espana', 'argentina', 'inglaterra', 'portugal', 'brasil', 'paises bajos', 'marruecos', 'belgica', 'alemania') as away_is_top,
      lower(translate(coalesce(m.home_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia') as home_is_low,
      lower(translate(coalesce(m.away_team, ''), 'ÁÀÂÄÃÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑáàâäãéèêëíìîïóòôöõúùûüñ', 'AAAAAEEEEIIIIOOOOOUUUUNaaaaaeeeeiiiiooooouuuun')) in ('nueva zelanda', 'haiti', 'curazao', 'ghana', 'cabo verde', 'bosnia y herzegovina', 'jordania', 'arabia saudita', 'sudafrica', 'irak', 'qatar', 'uzbekistan', 'rd congo', 'tunez', 'escocia') as away_is_low
    from public.matches m
  ), scored_predictions as (
    select
      p.user_id,
      case
        when m.home_score is null or m.away_score is null then 0
        when p.home_score_pred is null or p.away_score_pred is null then 0
        when p.home_score_pred = m.home_score and p.away_score_pred = m.away_score then
          3 + case
            when (
              (m.home_is_low and m.away_is_top)
              or (m.away_is_low and m.home_is_top)
            ) and (
              case
                when m.home_is_low then m.home_score
                else m.away_score
              end >= case
                when m.home_is_low then m.away_score
                else m.home_score
              end
            ) then 5
            else 0
          end
        when (
          case
            when p.home_score_pred > p.away_score_pred then 'home'
            when p.away_score_pred > p.home_score_pred then 'away'
            else 'draw'
          end
        ) = (
          case
            when m.home_score > m.away_score then 'home'
            when m.away_score > m.home_score then 'away'
            else 'draw'
          end
        ) then 1
        else 0
      end as points
    from public.predictions p
    join normalized_matches m
      on m.id::text = p.match_id::text
  ), group_totals as (
    select user_id, sum(points)::int as group_points
    from scored_predictions
    group by user_id
  )
  update public.profiles pr
  set total_points = (
    coalesce(gt.group_points, 0)
    + public.get_knockout_points_for_user(pr.id)
    + coalesce(pr.elijo_creer_bonus, 0)
  )
  from (
    select pr_all.id as user_id, gt.group_points
    from public.profiles pr_all
    left join group_totals gt on gt.user_id = pr_all.id
  ) gt
  where pr.id = gt.user_id;
$$;

-- Trigger en knockout_matches
drop trigger if exists trigger_recalculate_total_points_on_knockout_matches on public.knockout_matches;
create trigger trigger_recalculate_total_points_on_knockout_matches
after insert or update or delete on public.knockout_matches
for each statement
execute function public.trigger_recalculate_total_points();

-- Trigger en knockout_predictions
drop trigger if exists trigger_recalculate_total_points_on_knockout_predictions on public.knockout_predictions;
create trigger trigger_recalculate_total_points_on_knockout_predictions
after insert or update or delete on public.knockout_predictions
for each statement
execute function public.trigger_recalculate_total_points();
