-- Migração: módulo de abastecimento v2
-- Rode no SQL Editor do seu projeto Supabase.
--
-- Adiciona campos operacionais ao evento de abastecimento e o hodômetro
-- inicial do veículo. Nada é destrutivo; registros antigos são preenchidos.

-- ── refuels: valor total, observações, updated_at ───────────────────────────
alter table public.refuels
  add column if not exists valor_total numeric,
  add column if not exists observacoes text,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill do valor total a partir de litros x preço nos registros existentes.
update public.refuels
  set valor_total = round((litros * preco_litro)::numeric, 2)
  where valor_total is null;

-- ── vehicles: hodômetro inicial (início da vida operacional) ─────────────────
alter table public.vehicles
  add column if not exists odometro_inicial numeric;

-- ── Índices para consultas por veículo/ordenação ────────────────────────────
create index if not exists refuels_vehicle_odometro_idx on public.refuels (vehicle_id, odometro);
create index if not exists refuels_vehicle_data_idx on public.refuels (vehicle_id, data);
