-- Migração: reserva de combustível por veículo (medidor virtual)
-- Rode no SQL Editor do seu projeto Supabase.

alter table public.vehicles
  add column if not exists reserva_litros numeric;
