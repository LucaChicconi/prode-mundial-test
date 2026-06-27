-- =====================================================
-- Cruces Eliminatorios - Schema
-- =====================================================

-- Tabla de partidos eliminatorios
create table if not exists public.knockout_matches (
  id integer generated always as identity primary key,
  match_id text unique not null,
  home_team text not null,
  away_team text not null,
  home_score integer,
  away_score integer,
  home_penalties integer,
  away_penalties integer,
  match_time timestamptz not null,
  stage text not null,
  locked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tabla de predicciones eliminatorias
create table if not exists public.knockout_predictions (
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id text not null references public.knockout_matches(match_id),
  home_score_pred integer not null,
  away_score_pred integer not null,
  home_penalties_pred integer,
  away_penalties_pred integer,
  created_at timestamptz not null default now(),
  primary key (user_id, match_id)
);

-- =====================================================
-- RLS Policies - knockout_matches
-- =====================================================

alter table public.knockout_matches enable row level security;

drop policy if exists "Anyone can read knockout matches" on public.knockout_matches;
create policy "Anyone can read knockout matches"
  on public.knockout_matches
  for select
  using (true);

drop policy if exists "Admins can update knockout matches" on public.knockout_matches;
create policy "Admins can update knockout matches"
  on public.knockout_matches
  for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- =====================================================
-- RLS Policies - knockout_predictions
-- =====================================================

alter table public.knockout_predictions enable row level security;

drop policy if exists "Users can read own knockout predictions" on public.knockout_predictions;
create policy "Users can read own knockout predictions"
  on public.knockout_predictions
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own knockout predictions" on public.knockout_predictions;
create policy "Users can insert own knockout predictions"
  on public.knockout_predictions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own knockout predictions" on public.knockout_predictions;
create policy "Users can delete own knockout predictions"
  on public.knockout_predictions
  for delete
  using (auth.uid() = user_id);
