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
  /** Hodômetro no cadastro — início da vida operacional. */
  odometroInicial?: number | null;
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
  /** Valor total pago (âncora); preço/litro = valorTotal / litros. */
  valorTotal?: number | null;
  observacoes?: string | null;
};

/** Nível de confiança de uma medição de consumo. */
export type Confianca = "alta" | "media" | "baixa";

export const confiancaLabel: Record<Confianca, string> = {
  alta: "Alta confiança",
  media: "Média confiança",
  baixa: "Baixa confiança",
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

/** Gasto de um abastecimento (âncora valor_total, senão litros x preço). */
const gastoDe = (r: Refuel) => (r.valorTotal != null ? r.valorTotal : r.litros * r.precoLitro);

const dataCurta = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

/** Um intervalo de consumo medido, com a origem dos dados (rastreabilidade). */
export type Intervalo = {
  data: string;
  km: number;
  litros: number;
  consumo: number; // km/l
  preco: number; // preço/litro do fechamento
  gasto: number; // gasto do intervalo
  custoKm: number;
  confianca: Confianca;
  odoInicio: number;
  odoFim: number;
  ids: string[]; // abastecimentos que formaram a medição
};

export type Metrics = {
  consumoMedio: number;
  consumoL100: number;
  confianca: Confianca;
  melhorConsumo: number;
  piorConsumo: number;
  custoPorKm: number;
  gastoTotal: number;
  litrosTotal: number;
  kmRodados: number;
  precoMedio: number;
  autonomia: number;
  gastoMensal: number;
  qtdAbastecimentos: number;
  serie: { data: string; consumo: number; preco: number; custoKm: number; confianca: Confianca }[];
  porMes: { mes: string; gasto: number; litros: number }[];
  tendencia: number;
  intervalos: Intervalo[];
};

/**
 * Métricas derivadas dos eventos de abastecimento.
 *
 * Consumo de ALTA confiança: intervalo tanque-cheio → tanque-cheio, somando os
 * litros de todos os abastecimentos do intervalo (inclui parciais). Se não
 * houver dois tanques cheios, cai para uma estimativa por pares consecutivos,
 * marcada como MÉDIA confiança. Sem trecho válido → null.
 */
export function computeMetrics(list: Refuel[], tanque: number): Metrics | null {
  const rows = [...list].sort((a, b) => a.odometro - b.odometro || a.data.localeCompare(b.data));
  if (rows.length < 2) return null;

  const gastoTotal = rows.reduce((s, r) => s + gastoDe(r), 0);
  const litrosTotal = rows.reduce((s, r) => s + r.litros, 0);
  const precoMedio = litrosTotal > 0 ? gastoTotal / litrosTotal : 0;
  const kmRodados = rows[rows.length - 1]!.odometro - rows[0]!.odometro;

  // ── Intervalos tanque-cheio → tanque-cheio (alta confiança) ──────────────
  const alta: Intervalo[] = [];
  let lastFull = -1;
  let litrosAcum = 0;
  let gastoAcum = 0;
  let idsAcum: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    if (lastFull >= 0) {
      litrosAcum += r.litros;
      gastoAcum += gastoDe(r);
      idsAcum.push(r.id);
    }
    if (r.tanqueCheio) {
      if (lastFull >= 0) {
        const ini = rows[lastFull]!;
        const km = r.odometro - ini.odometro;
        if (km > 0 && litrosAcum > 0) {
          const consumo = km / litrosAcum;
          alta.push({
            data: dataCurta(r.data),
            km,
            litros: litrosAcum,
            consumo: Number(consumo.toFixed(2)),
            preco: r.precoLitro,
            gasto: gastoAcum,
            custoKm: Number((gastoAcum / km).toFixed(3)),
            confianca: "alta",
            odoInicio: ini.odometro,
            odoFim: r.odometro,
            ids: [ini.id, ...idsAcum],
          });
        }
      }
      lastFull = i;
      litrosAcum = 0;
      gastoAcum = 0;
      idsAcum = [];
    }
  }

  let intervalos: Intervalo[];
  let confianca: Confianca;
  if (alta.length > 0) {
    intervalos = alta;
    confianca = "alta";
  } else {
    // Sem par de tanque cheio: estimativa por pares consecutivos (média).
    const rough: Intervalo[] = [];
    for (let i = 1; i < rows.length; i++) {
      const cur = rows[i]!;
      const prev = rows[i - 1]!;
      const km = cur.odometro - prev.odometro;
      if (km <= 0 || cur.litros <= 0) continue;
      const gasto = gastoDe(cur);
      rough.push({
        data: dataCurta(cur.data),
        km,
        litros: cur.litros,
        consumo: Number((km / cur.litros).toFixed(2)),
        preco: cur.precoLitro,
        gasto,
        custoKm: Number((gasto / km).toFixed(3)),
        confianca: "media",
        odoInicio: prev.odometro,
        odoFim: cur.odometro,
        ids: [prev.id, cur.id],
      });
    }
    if (rough.length === 0) return null;
    intervalos = rough;
    confianca = "media";
  }

  const consumos = intervalos.map((x) => x.consumo);
  const somaKm = intervalos.reduce((s, x) => s + x.km, 0);
  const somaLitros = intervalos.reduce((s, x) => s + x.litros, 0);
  const consumoMedio = somaLitros > 0 ? somaKm / somaLitros : 0;

  // ── Agregados mensais ────────────────────────────────────────────────────
  const mapMes = new Map<string, { gasto: number; litros: number }>();
  for (const r of rows) {
    const key = new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR", {
      month: "short",
      year: "2-digit",
    });
    const cur = mapMes.get(key) ?? { gasto: 0, litros: 0 };
    cur.gasto += gastoDe(r);
    cur.litros += r.litros;
    mapMes.set(key, cur);
  }
  const porMes = [...mapMes.entries()].map(([mes, v]) => ({
    mes,
    gasto: Number(v.gasto.toFixed(2)),
    litros: Number(v.litros.toFixed(1)),
  }));

  // ── Tendência (metade recente vs. metade antiga) ─────────────────────────
  const half = Math.floor(consumos.length / 2) || 1;
  const antigo = consumos.slice(0, half).reduce((a, b) => a + b, 0) / half;
  const recenteArr = consumos.slice(-half);
  const recente = recenteArr.reduce((a, b) => a + b, 0) / recenteArr.length;
  const tendencia = antigo > 0 ? ((recente - antigo) / antigo) * 100 : 0;

  return {
    consumoMedio,
    consumoL100: consumoMedio > 0 ? 100 / consumoMedio : 0,
    confianca,
    melhorConsumo: Math.max(...consumos),
    piorConsumo: Math.min(...consumos),
    custoPorKm: consumoMedio > 0 ? precoMedio / consumoMedio : 0,
    gastoTotal,
    litrosTotal,
    kmRodados,
    precoMedio,
    autonomia: consumoMedio * tanque,
    gastoMensal: porMes.length > 0 ? porMes.reduce((s, m) => s + m.gasto, 0) / porMes.length : 0,
    qtdAbastecimentos: rows.length,
    serie: intervalos.map((x) => ({
      data: x.data,
      consumo: x.consumo,
      preco: x.preco,
      custoKm: x.custoKm,
      confianca: x.confianca,
    })),
    porMes,
    tendencia,
    intervalos,
  };
}
