-- ============================================================================
--  Abastece — schema do banco (Supabase / Postgres)
--  Execute este script no SQL Editor do seu projeto Supabase.
--  Cria as tabelas de veículos e abastecimentos, com Row Level Security (RLS)
--  garantindo que cada usuário só enxerga e altera os próprios dados.
-- ============================================================================

-- ── Veículos ────────────────────────────────────────────────────────────────
create table if not exists public.vehicles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome       text not null,
  placa      text not null default 'Sem placa',
  modelo     text not null,
  ano        integer not null,
  tanque     numeric not null check (tanque > 0),
  created_at timestamptz not null default now()
);

-- ── Abastecimentos ──────────────────────────────────────────────────────────
create table if not exists public.refuels (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  vehicle_id   uuid not null references public.vehicles (id) on delete cascade,
  data         date not null default current_date,
  odometro     numeric not null,
  litros       numeric not null check (litros > 0),
  preco_litro  numeric not null check (preco_litro >= 0),
  combustivel  text not null default 'Gasolina',
  tanque_cheio boolean not null default true,
  posto        text not null default 'Não informado',
  created_at   timestamptz not null default now()
);

create index if not exists refuels_vehicle_id_idx on public.refuels (vehicle_id);
create index if not exists refuels_user_id_idx on public.refuels (user_id);
create index if not exists vehicles_user_id_idx on public.vehicles (user_id);

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.vehicles enable row level security;
alter table public.refuels  enable row level security;

-- Veículos: dono faz tudo com as próprias linhas.
drop policy if exists "vehicles_select_own" on public.vehicles;
create policy "vehicles_select_own" on public.vehicles
  for select using (auth.uid() = user_id);

drop policy if exists "vehicles_insert_own" on public.vehicles;
create policy "vehicles_insert_own" on public.vehicles
  for insert with check (auth.uid() = user_id);

drop policy if exists "vehicles_update_own" on public.vehicles;
create policy "vehicles_update_own" on public.vehicles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vehicles_delete_own" on public.vehicles;
create policy "vehicles_delete_own" on public.vehicles
  for delete using (auth.uid() = user_id);

-- Abastecimentos: idem.
drop policy if exists "refuels_select_own" on public.refuels;
create policy "refuels_select_own" on public.refuels
  for select using (auth.uid() = user_id);

drop policy if exists "refuels_insert_own" on public.refuels;
create policy "refuels_insert_own" on public.refuels
  for insert with check (auth.uid() = user_id);

drop policy if exists "refuels_update_own" on public.refuels;
create policy "refuels_update_own" on public.refuels
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "refuels_delete_own" on public.refuels;
create policy "refuels_delete_own" on public.refuels
  for delete using (auth.uid() = user_id);
