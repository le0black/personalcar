-- Migração: "acabou o combustível" (pane seca) no abastecimento
-- Rode no SQL Editor do seu projeto Supabase.
-- Marca que o tanque estava em 0 L antes deste abastecimento: é uma âncora
-- exata para o medidor virtual e fecha um trecho de consumo medido.

alter table public.refuels
  add column if not exists tanque_vazio boolean not null default false;
