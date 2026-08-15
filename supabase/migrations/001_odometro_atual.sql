-- Migração: odômetro atual por veículo
-- Rode no SQL Editor do seu projeto Supabase.
-- Guarda a leitura atual do hodômetro (atualizada manualmente ou pelo GPS),
-- usada para autonomia/lembrete e como base para somar os km de cada percurso.

alter table public.vehicles
  add column if not exists odometro_atual numeric;
