export type FuelType = "Gasolina" | "Etanol" | "Diesel" | "GNV";

export type Vehicle = {
  id: string;
  nome: string;
  placa: string;
  modelo: string;
  ano: number;
  tanque: number;
  /** Leitura atual do hodômetro (manual ou via GPS). null = nunca informada. */
  odometroAtual?: number | null;
};

export type Refuel = {
  id: string;
  vehicleId: string;
  data: string; // ISO yyyy-mm-dd
  odometro: number;
  litros: number;
  precoLitro: number;
  combustivel: FuelType;
  tanqueCheio: boolean;
  posto: string;
};

export const vehicles: Vehicle[] = [
  {
    id: "v1",
    nome: "Corolla",
    placa: "RQL-2F18",
    modelo: "Toyota Corolla XEi",
    ano: 2021,
    tanque: 50,
  },
  {
    id: "v2",
    nome: "Strada",
    placa: "PXA-7C02",
    modelo: "Fiat Strada Freedom",
    ano: 2019,
    tanque: 55,
  },
];

function build(
  vehicleId: string,
  start: number,
  kmPorL: number,
  base: number,
  posto: string,
  combustivel: FuelType,
): Refuel[] {
  const out: Refuel[] = [];
  let odo = start;
  for (let i = 0; i < 14; i++) {
    const mes = i;
    const date = new Date(Date.UTC(2026, 1 + Math.floor(mes / 2), mes % 2 === 0 ? 6 : 21));
    const eff = kmPorL + Math.sin(i * 1.3) * 0.9;
    const litros = 34 + ((i * 7) % 9);
    odo += Math.round(litros * eff);
    out.push({
      id: `${vehicleId}-r${i}`,
      vehicleId,
      data: date.toISOString().slice(0, 10),
      odometro: odo,
      litros: Number(litros.toFixed(2)),
      precoLitro: Number((base + Math.sin(i * 0.8) * 0.24).toFixed(2)),
      combustivel,
      tanqueCheio: true,
      posto,
    });
  }
  return out;
}

export const initialRefuels: Refuel[] = [
  ...build("v1", 32140, 12.4, 6.09, "Shell Ipiranga Av. Brasil", "Gasolina"),
  ...build("v2", 78450, 9.1, 5.74, "Posto BR Rodovia 101", "Diesel"),
];

/**
 * Converte texto digitado em número, aceitando o formato brasileiro.
 * "38,5" -> 38.5 · "1.234,56" -> 1234.56 · "6.09" -> 6.09 · "45000" -> 45000
 * Retorna NaN quando não dá para interpretar.
 */
export function parseNumero(v: string): number {
  if (!v) return NaN;
  let s = v.trim().replace(/\s/g, "");
  if (s.includes(",")) {
    // vírgula é o separador decimal; pontos são milhar
    s = s.replace(/\./g, "").replace(",", ".");
  }
  return Number(s);
}

/**
 * Data de hoje no fuso LOCAL no formato yyyy-mm-dd.
 * Evita o bug de usar toISOString() (UTC), que à noite no Brasil (UTC-3)
 * registra o dia seguinte.
 */
export function dataLocalISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dia}`;
}

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const num = (n: number, d = 1) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });

export type Metrics = {
  consumoMedio: number;
  melhorConsumo: number;
  piorConsumo: number;
  custoPorKm: number;
  gastoTotal: number;
  litrosTotal: number;
  kmRodados: number;
  precoMedio: number;
  autonomia: number;
  gastoMensal: number;
  serie: { data: string; consumo: number; preco: number; custoKm: number }[];
  porMes: { mes: string; gasto: number; litros: number }[];
  tendencia: number;
};

export function computeMetrics(list: Refuel[], tanque: number): Metrics | null {
  const rows = [...list].sort((a, b) => a.odometro - b.odometro);
  if (rows.length < 2) return null;

  const serie: Metrics["serie"] = [];
  for (let i = 1; i < rows.length; i++) {
    const cur = rows[i]!;
    const prev = rows[i - 1]!;
    const dist = cur.odometro - prev.odometro;
    if (dist <= 0) continue;
    const consumo = dist / cur.litros;
    serie.push({
      data: new Date(cur.data + "T00:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      }),
      consumo: Number(consumo.toFixed(2)),
      preco: cur.precoLitro,
      custoKm: Number(((cur.litros * cur.precoLitro) / dist).toFixed(3)),
    });
  }

  // Sem trecho válido (ex.: odômetros iguais/decrescentes após edição) não há
  // como calcular consumo — evita Infinity/NaN nas métricas.
  if (serie.length === 0) return null;

  const gastoTotal = rows.reduce((s, r) => s + r.litros * r.precoLitro, 0);
  const litrosTotal = rows.reduce((s, r) => s + r.litros, 0);
  const kmRodados = rows[rows.length - 1]!.odometro - rows[0]!.odometro;
  const consumos = serie.map((s) => s.consumo);
  const consumoMedio = kmRodados / rows.slice(1).reduce((s, r) => s + r.litros, 0);


  const mapMes = new Map<string, { gasto: number; litros: number }>();
  for (const r of rows) {
    const key = new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    const cur = mapMes.get(key) ?? { gasto: 0, litros: 0 };
    cur.gasto += r.litros * r.precoLitro;
    cur.litros += r.litros;
    mapMes.set(key, cur);
  }
  const porMes = [...mapMes.entries()].map(([mes, v]) => ({
    mes,
    gasto: Number(v.gasto.toFixed(2)),
    litros: Number(v.litros.toFixed(1)),
  }));

  const half = Math.floor(consumos.length / 2) || 1;
  const antigo = consumos.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const recente =
    consumos.slice(-half).reduce((a, b) => a + b, 0) / consumos.slice(-half).length;

  return {
    consumoMedio,
    melhorConsumo: Math.max(...consumos),
    piorConsumo: Math.min(...consumos),
    custoPorKm: gastoTotal / kmRodados,
    gastoTotal,
    litrosTotal,
    kmRodados,
    precoMedio: gastoTotal / litrosTotal,
    autonomia: consumoMedio * tanque,
    gastoMensal: porMes.reduce((s, m) => s + m.gasto, 0) / porMes.length,
    serie,
    porMes,
    tendencia: ((recente - antigo) / antigo) * 100,
  };
}
