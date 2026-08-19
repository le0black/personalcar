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
  /** Reserva de combustível (litros) para alertas do medidor virtual. */
  reservaLitros?: number | null;
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

/** Estado estimado do combustível do veículo. `restante = null` = não determinado. */
export type EstadoCombustivel = {
  litrosAbastecidos: number; // acumulado (soma de todos os abastecimentos)
  litrosConsumidos: number | null; // estimado, desde o início da vida
  restante: number | null; // litros no tanque agora (null = não determinado)
  pctTanque: number | null;
  confianca: Confianca | null;
};

/**
 * Estima o estado do combustível a partir dos eventos.
 * Só determina o "restante" quando há uma âncora confiável (um tanque cheio) e
 * um consumo estimado; caso contrário retorna null (não determinado).
 */
export function estimarCombustivel(args: {
  refuels: Refuel[];
  tanque: number;
  odometroInicial?: number | null | undefined;
  odometroAtual?: number | null | undefined;
  metrics: Metrics | null;
}): EstadoCombustivel {
  const { tanque, odometroInicial, odometroAtual, metrics } = args;
  const rows = [...args.refuels].sort(
    (a, b) => a.odometro - b.odometro || a.data.localeCompare(b.data),
  );
  const litrosAbastecidos = Number(rows.reduce((s, r) => s + r.litros, 0).toFixed(1));
  const consumo = metrics?.consumoMedio ?? null;

  // Litros consumidos estimados desde o início da vida operacional.
  const odoBase = odometroInicial ?? rows[0]?.odometro ?? null;
  let litrosConsumidos: number | null = null;
  if (consumo && consumo > 0 && odoBase != null && odometroAtual != null && odometroAtual > odoBase) {
    litrosConsumidos = Number(((odometroAtual - odoBase) / consumo).toFixed(1));
  }

  // Restante estimado — ancorado no último abastecimento de tanque cheio.
  let restante: number | null = null;
  let pctTanque: number | null = null;
  let confianca: Confianca | null = null;
  let idxCheio = -1;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i]!.tanqueCheio) {
      idxCheio = i;
      break;
    }
  }
  if (idxCheio >= 0 && consumo && consumo > 0 && odometroAtual != null) {
    const cheio = rows[idxCheio]!;
    const km = odometroAtual - cheio.odometro;
    if (km >= 0) {
      const litrosApos = rows.slice(idxCheio + 1).reduce((s, r) => s + r.litros, 0);
      let r = tanque - km / consumo + litrosApos;
      r = Math.max(0, Math.min(tanque, r));
      restante = Number(r.toFixed(1));
      pctTanque = tanque > 0 ? Number(((r / tanque) * 100).toFixed(0)) : null;
      // Restante é sempre uma estimativa: rebaixa um nível da confiança do consumo.
      const c = metrics?.confianca ?? "baixa";
      confianca = c === "alta" ? "media" : "baixa";
    }
  }

  return { litrosAbastecidos, litrosConsumidos, restante, pctTanque, confianca };
}

// ── Medidor virtual de combustível ─────────────────────────────────────────

/**
 * Pesos do consumo adaptativo (mais peso ao recente). Ajustáveis aqui.
 * O consumo usado = 50% dos mais recentes + 30% do histórico recente + 20% geral.
 */
export const PESOS_CONSUMO = { recentes: 0.5, recenteHist: 0.3, geral: 0.2 };
const JANELA_RECENTES = 2;
const JANELA_RECENTE_HIST = 5;

export type ConsumoAdaptativo = { valor: number | null; confianca: Confianca | null };

/**
 * Consumo (km/l) para o medidor virtual, priorizando medições recentes.
 * Cai para o consumo de referência do cadastro (baixa confiança) quando não há
 * medições; null quando não há nada.
 */
export function consumoAdaptativo(
  metrics: Metrics | null,
  referenciaMisto?: number | null,
): ConsumoAdaptativo {
  const ints = metrics?.intervalos ?? [];
  if (ints.length === 0) {
    if (referenciaMisto && referenciaMisto > 0) return { valor: referenciaMisto, confianca: "baixa" };
    return { valor: null, confianca: null };
  }
  const aggr = (arr: Intervalo[]) => {
    const km = arr.reduce((s, x) => s + x.km, 0);
    const l = arr.reduce((s, x) => s + x.litros, 0);
    return l > 0 ? km / l : 0;
  };
  const recentes = aggr(ints.slice(-JANELA_RECENTES));
  const recenteHist = aggr(ints.slice(-JANELA_RECENTE_HIST));
  const geral = aggr(ints);
  const valor =
    PESOS_CONSUMO.recentes * recentes +
    PESOS_CONSUMO.recenteHist * recenteHist +
    PESOS_CONSUMO.geral * geral;

  const cheio = metrics?.confianca === "alta";
  const confianca: Confianca =
    cheio && ints.length >= 2 ? "alta" : cheio || metrics?.confianca === "media" ? "media" : "baixa";
  return { valor: Number(valor.toFixed(2)), confianca };
}

export type EventoTanque = {
  tipo: "REFUEL" | "CONSUMO" | "CALIBRACAO";
  odometro: number;
  data?: string;
  litros: number; // positivo abastece, negativo consome
  saldo: number; // saldo estimado após o evento
};

export type TanqueVirtual = {
  litros: number | null;
  pct: number | null;
  autonomia: number | null;
  autonomiaAteReserva: number | null;
  emReserva: boolean;
  atencao: boolean;
  confianca: Confianca | null;
  consumoUtilizado: number | null;
  semDados: boolean; // sem consumo para estimar
  extrato: EventoTanque[];
};

/**
 * Estima o combustível no tanque a partir da sequência de eventos (fold):
 * começa em 0 L, cada abastecimento soma, cada trecho rodado desconta o
 * consumo, e "tanque cheio" recalibra para a capacidade. Nunca abaixo de 0
 * nem acima da capacidade. Derivado — recalcula sozinho ao editar/excluir.
 */
export function computeTanqueVirtual(args: {
  refuels: Refuel[];
  capacidade: number;
  reserva?: number | null | undefined;
  consumo: ConsumoAdaptativo;
  odometroAtual?: number | null | undefined;
}): TanqueVirtual {
  const { capacidade, consumo, odometroAtual } = args;
  const reserva = args.reserva ?? 0;
  const cu = consumo.valor;
  const vazio: TanqueVirtual = {
    litros: null,
    pct: null,
    autonomia: null,
    autonomiaAteReserva: null,
    emReserva: false,
    atencao: false,
    confianca: consumo.confianca,
    consumoUtilizado: cu,
    semDados: true,
    extrato: [],
  };
  if (!cu || cu <= 0 || capacidade <= 0) return vazio;

  const rows = [...args.refuels].sort(
    (a, b) => a.odometro - b.odometro || a.data.localeCompare(b.data),
  );

  let saldo = 0;
  let prevOdo: number | null = null;
  const extrato: EventoTanque[] = [];
  for (const r of rows) {
    if (prevOdo != null) {
      const km = r.odometro - prevOdo;
      if (km > 0) {
        const c = km / cu;
        saldo = Math.max(0, saldo - c);
        extrato.push({
          tipo: "CONSUMO",
          odometro: r.odometro,
          litros: -Number(c.toFixed(2)),
          saldo: Number(saldo.toFixed(2)),
        });
      }
    }
    saldo = Math.min(capacidade, saldo + r.litros);
    let tipo: EventoTanque["tipo"] = "REFUEL";
    if (r.tanqueCheio) {
      saldo = capacidade; // calibração: completou o tanque
      tipo = "CALIBRACAO";
    }
    extrato.push({
      tipo,
      odometro: r.odometro,
      data: r.data,
      litros: r.litros,
      saldo: Number(saldo.toFixed(2)),
    });
    prevOdo = r.odometro;
  }

  // Consumo do último abastecimento até o hodômetro atual.
  if (odometroAtual != null && prevOdo != null && odometroAtual > prevOdo) {
    const c = (odometroAtual - prevOdo) / cu;
    saldo = Math.max(0, saldo - c);
    extrato.push({
      tipo: "CONSUMO",
      odometro: odometroAtual,
      litros: -Number(c.toFixed(2)),
      saldo: Number(saldo.toFixed(2)),
    });
  }

  const litros = Number(saldo.toFixed(1));
  const pct = Number(((saldo / capacidade) * 100).toFixed(0));
  const emReserva = reserva > 0 ? saldo <= reserva : pct <= 10;
  const atencao = !emReserva && pct <= 25;

  // Confiança do medidor: exige uma calibração recente para ser alta.
  const temCalibracao = extrato.some((e) => e.tipo === "CALIBRACAO");
  let confianca: Confianca = consumo.confianca ?? "baixa";
  if (confianca === "alta" && !temCalibracao) confianca = "media";

  return {
    litros,
    pct,
    autonomia: Number((saldo * cu).toFixed(0)),
    autonomiaAteReserva: Number((Math.max(0, saldo - reserva) * cu).toFixed(0)),
    emReserva,
    atencao,
    confianca,
    consumoUtilizado: cu,
    semDados: false,
    extrato,
  };
}

/**
 * Detecta situações incomuns em um abastecimento e devolve avisos (não bloqueia).
 * O bloqueio duro (hodômetro ≤ anterior) fica no formulário. Aqui é só alerta
 * para o usuário confirmar. `consumoMedio` é a média histórica (km/l).
 */
export function detectarAnomalias(args: {
  novo: Pick<Refuel, "odometro" | "litros" | "precoLitro" | "valorTotal" | "data">;
  refuels: Refuel[];
  tanque: number;
  consumoMedio?: number | null | undefined;
}): string[] {
  const { novo, refuels, tanque, consumoMedio } = args;
  const avisos: string[] = [];

  // Litros acima da capacidade do tanque.
  if (tanque > 0 && novo.litros > tanque) {
    avisos.push(
      `Litros abastecidos (${num(novo.litros, 1)} L) acima da capacidade do tanque (${num(tanque, 0)} L).`,
    );
  }

  // Valor total incompatível com litros × preço/litro.
  const esperado = novo.litros * novo.precoLitro;
  if (novo.valorTotal != null && esperado > 0) {
    const tolerancia = Math.max(0.5, esperado * 0.02);
    if (Math.abs(novo.valorTotal - esperado) > tolerancia) {
      avisos.push(
        `Valor total (${brl(novo.valorTotal)}) diverge de litros × preço (${brl(esperado)}).`,
      );
    }
  }

  const ordenados = [...refuels].sort((a, b) => b.odometro - a.odometro);
  const ultimo = ordenados[0];

  // Consumo do trecho muito diferente da média.
  if (consumoMedio && consumoMedio > 0 && ultimo && novo.litros > 0) {
    const km = novo.odometro - ultimo.odometro;
    if (km > 0) {
      const c = km / novo.litros;
      if (c > consumoMedio * 2) {
        avisos.push(
          `O consumo deste trecho (~${num(c, 1)} km/l) está muito acima da média (${num(consumoMedio, 1)} km/l).`,
        );
      } else if (c < consumoMedio * 0.5) {
        avisos.push(
          `O consumo deste trecho (~${num(c, 1)} km/l) está muito abaixo da média (${num(consumoMedio, 1)} km/l).`,
        );
      }
    }
  }

  // Possível duplicado.
  if (refuels.some((r) => r.odometro === novo.odometro)) {
    avisos.push("Já existe um abastecimento com esse hodômetro.");
  } else if (
    refuels.some((r) => r.data === novo.data && Math.abs(r.litros - novo.litros) < 0.1)
  ) {
    avisos.push("Parece um abastecimento duplicado (mesma data e litros de outro registro).");
  }

  // Data inconsistente.
  if (novo.data > dataLocalISO()) {
    avisos.push("A data informada está no futuro.");
  }
  if (ultimo && novo.data < ultimo.data) {
    avisos.push(
      `A data é anterior ao último abastecimento (${new Date(ultimo.data + "T00:00:00").toLocaleDateString("pt-BR")}), mas o hodômetro é maior.`,
    );
  }

  return avisos;
}
