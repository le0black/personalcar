/**
 * Acesso a dados no Supabase para veículos e abastecimentos.
 * Converte entre as linhas snake_case do Postgres e os tipos camelCase do app.
 * Todas as consultas são filtradas por RLS pelo user_id do usuário logado.
 */

import { requireSupabase } from "@/lib/supabase";
import type { FuelType, Refuel, Vehicle } from "@/lib/fuel-data";

// ── Linhas do banco (snake_case) ──────────────────────────────────────────
type VehicleRow = {
  id: string;
  nome: string;
  placa: string;
  modelo: string;
  ano: number;
  tanque: number;
  odometro_atual: number | null;
};

const VEHICLE_COLS = "id, nome, placa, modelo, ano, tanque, odometro_atual";

type RefuelRow = {
  id: string;
  vehicle_id: string;
  data: string;
  odometro: number;
  litros: number;
  preco_litro: number;
  combustivel: string;
  tanque_cheio: boolean;
  posto: string;
};

// ── Mapeamentos ───────────────────────────────────────────────────────────
const toVehicle = (r: VehicleRow): Vehicle => ({
  id: r.id,
  nome: r.nome,
  placa: r.placa,
  modelo: r.modelo,
  ano: r.ano,
  tanque: Number(r.tanque),
  odometroAtual: r.odometro_atual === null ? null : Number(r.odometro_atual),
});

const toRefuel = (r: RefuelRow): Refuel => ({
  id: r.id,
  vehicleId: r.vehicle_id,
  data: r.data,
  odometro: Number(r.odometro),
  litros: Number(r.litros),
  precoLitro: Number(r.preco_litro),
  combustivel: r.combustivel as FuelType,
  tanqueCheio: r.tanque_cheio,
  posto: r.posto,
});

// ── Veículos ──────────────────────────────────────────────────────────────
export async function fetchVehicles(): Promise<Vehicle[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("vehicles")
    .select(VEHICLE_COLS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as VehicleRow[]).map(toVehicle);
}

/** Insere um veículo. `user_id` é preenchido pelo default do banco (auth.uid()). */
export async function insertVehicle(v: Omit<Vehicle, "id">): Promise<Vehicle> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("vehicles")
    .insert({
      nome: v.nome,
      placa: v.placa,
      modelo: v.modelo,
      ano: v.ano,
      tanque: v.tanque,
    })
    .select(VEHICLE_COLS)
    .single();
  if (error) throw error;
  return toVehicle(data as VehicleRow);
}

/** Atualiza campos editáveis do veículo (apelido, placa, tanque, modelo, ano). */
export async function updateVehicle(
  id: string,
  v: Partial<Omit<Vehicle, "id">>,
): Promise<Vehicle> {
  const sb = requireSupabase();
  const patch: Record<string, unknown> = {};
  if (v.nome !== undefined) patch["nome"] = v.nome;
  if (v.placa !== undefined) patch["placa"] = v.placa;
  if (v.modelo !== undefined) patch["modelo"] = v.modelo;
  if (v.ano !== undefined) patch["ano"] = v.ano;
  if (v.tanque !== undefined) patch["tanque"] = v.tanque;
  if (v.odometroAtual !== undefined) patch["odometro_atual"] = v.odometroAtual;
  const { data, error } = await sb
    .from("vehicles")
    .update(patch)
    .eq("id", id)
    .select(VEHICLE_COLS)
    .single();
  if (error) throw error;
  return toVehicle(data as VehicleRow);
}

/** Atualiza apenas o odômetro atual do veículo (uso manual ou via GPS). */
export async function updateOdometro(id: string, km: number): Promise<Vehicle> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("vehicles")
    .update({ odometro_atual: km })
    .eq("id", id)
    .select(VEHICLE_COLS)
    .single();
  if (error) throw error;
  return toVehicle(data as VehicleRow);
}

/** Remove o veículo. Os abastecimentos ligados caem por ON DELETE CASCADE. */
export async function deleteVehicle(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("vehicles").delete().eq("id", id);
  if (error) throw error;
}

// ── Abastecimentos ────────────────────────────────────────────────────────
export async function fetchRefuels(): Promise<Refuel[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("refuels")
    .select("id, vehicle_id, data, odometro, litros, preco_litro, combustivel, tanque_cheio, posto")
    .order("odometro", { ascending: true });
  if (error) throw error;
  return (data as RefuelRow[]).map(toRefuel);
}

/** Insere um abastecimento. `user_id` é preenchido pelo default do banco. */
export async function insertRefuel(r: Omit<Refuel, "id">): Promise<Refuel> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("refuels")
    .insert({
      vehicle_id: r.vehicleId,
      data: r.data,
      odometro: r.odometro,
      litros: r.litros,
      preco_litro: r.precoLitro,
      combustivel: r.combustivel,
      tanque_cheio: r.tanqueCheio,
      posto: r.posto,
    })
    .select("id, vehicle_id, data, odometro, litros, preco_litro, combustivel, tanque_cheio, posto")
    .single();
  if (error) throw error;
  return toRefuel(data as RefuelRow);
}

/** Atualiza campos editáveis de um abastecimento. */
export async function updateRefuel(
  id: string,
  r: Partial<Omit<Refuel, "id" | "vehicleId">>,
): Promise<Refuel> {
  const sb = requireSupabase();
  const patch: Record<string, unknown> = {};
  if (r.data !== undefined) patch["data"] = r.data;
  if (r.odometro !== undefined) patch["odometro"] = r.odometro;
  if (r.litros !== undefined) patch["litros"] = r.litros;
  if (r.precoLitro !== undefined) patch["preco_litro"] = r.precoLitro;
  if (r.combustivel !== undefined) patch["combustivel"] = r.combustivel;
  if (r.tanqueCheio !== undefined) patch["tanque_cheio"] = r.tanqueCheio;
  if (r.posto !== undefined) patch["posto"] = r.posto;
  const { data, error } = await sb
    .from("refuels")
    .update(patch)
    .eq("id", id)
    .select("id, vehicle_id, data, odometro, litros, preco_litro, combustivel, tanque_cheio, posto")
    .single();
  if (error) throw error;
  return toRefuel(data as RefuelRow);
}

export async function deleteRefuel(id: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("refuels").delete().eq("id", id);
  if (error) throw error;
}
