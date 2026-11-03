import { useEffect, useState } from "react";
import { Check, Clock, Droplets, Gauge, MapPin, Route as RouteIcon } from "lucide-react";
import { brl, num } from "@/lib/fuel-data";

export type DadosResumoViagem = {
  distancia: number;
  segundos: number;
  /** null = sem consumo ou preço para estimar o custo. */
  custo: number | null;
  litros: number | null;
  consumo: number | null;
  precoLitro: number | null;
  odometro: number | null;
};

/** Quanto a contagem do valor leva (ms) e quando começa, depois do check. */
const CONTAGEM_MS = 1500;
const CONTAGEM_ATRASO_MS = 650;

/**
 * Recibo da viagem ao encerrar, no estilo dos apps de corrida: a folha sobe,
 * o check se desenha, o valor conta de R$ 0,00 até o custo estimado e os
 * detalhes entram em sequência. Com "reduzir movimento" aparece tudo pronto.
 */
export function ResumoViagem({
  dados,
  onFechar,
}: {
  dados: DadosResumoViagem;
  onFechar: () => void;
}) {
  const alvo = dados.custo ?? dados.distancia;
  const valor = useContagem(alvo, CONTAGEM_MS, CONTAGEM_ATRASO_MS);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setPronto(true), CONTAGEM_ATRASO_MS + CONTAGEM_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFechar]);

  const detalhes = [
    { icon: RouteIcon, label: "Distância", valor: `${num(dados.distancia, 1)} km` },
    { icon: Clock, label: "Tempo", valor: duracao(dados.segundos) },
    dados.litros != null
      ? { icon: Droplets, label: "Combustível", valor: `~${num(dados.litros, 2)} L` }
      : null,
    dados.consumo != null
      ? { icon: Gauge, label: "Consumo usado", valor: `${num(dados.consumo, 1)} km/l` }
      : null,
    dados.precoLitro != null
      ? { icon: Droplets, label: "Preço do litro", valor: `${brl(dados.precoLitro)}/L` }
      : null,
    dados.odometro != null
      ? { icon: MapPin, label: "Odômetro", valor: `${dados.odometro.toLocaleString("pt-BR")} km` }
      : null,
  ].filter((d) => d != null);

  return (
    <div
      className="viagem-backdrop fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onFechar}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="resumo-viagem-titulo"
        onClick={(e) => e.stopPropagation()}
        className="viagem-folha relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-[var(--t-line)] bg-[var(--t-panel)] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 text-[var(--t-text)] shadow-2xl sm:rounded-[28px]"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[var(--t-line)] sm:hidden" />

        {/* Check */}
        <div className="flex justify-center">
          <div className="viagem-check relative grid size-16 place-items-center rounded-full bg-[var(--t-green)] text-white">
            <span className="viagem-onda absolute inset-0 rounded-full bg-[var(--t-green)]" />
            <Check className="relative size-8" strokeWidth={3} />
          </div>
        </div>

        <p
          id="resumo-viagem-titulo"
          className="viagem-entra mt-4 text-center text-sm font-medium uppercase tracking-[0.2em] text-[var(--t-dim)]"
          style={{ animationDelay: "250ms" }}
        >
          Viagem finalizada
        </p>

        {/* Valor */}
        <p
          className={`mt-2 text-center text-[clamp(2.75rem,14vw,3.75rem)] font-semibold leading-none tracking-tight tabular-nums ${pronto ? "viagem-pop" : ""}`}
          aria-live="polite"
        >
          {dados.custo != null ? (
            brl(valor)
          ) : (
            <>
              {num(valor, 1)}
              <span className="ml-1 text-[0.4em] font-normal text-[var(--t-dim)]">km</span>
            </>
          )}
        </p>
        <p
          className="viagem-entra mt-2 text-center text-sm text-[var(--t-dim)]"
          style={{ animationDelay: "400ms" }}
        >
          {dados.custo != null
            ? `custo estimado de combustível · ${brl(dados.custo / Math.max(dados.distancia, 0.001))}/km`
            : "Registre abastecimentos para estimar o custo das viagens."}
        </p>

        {/* Trajeto: o carro anda da origem ao destino */}
        <div className="viagem-entra relative mx-2 mt-6 h-6" style={{ animationDelay: "500ms" }}>
          <span className="absolute inset-x-2 top-1/2 h-0 -translate-y-1/2 border-t-2 border-dashed border-[var(--t-line)]" />
          <span className="viagem-trilha absolute left-2 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[var(--t-blue)]" />
          <span className="absolute left-0 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-[var(--t-blue)] bg-[var(--t-panel)]" />
          <span className="absolute right-0 top-1/2 size-3 -translate-y-1/2 rounded-sm bg-[var(--t-text)]" />
          <span className="viagem-carro absolute top-1/2 size-4 -translate-y-1/2 rounded-full bg-[var(--t-blue)] shadow-[0_0_0_4px_color-mix(in_oklab,var(--t-blue)_30%,transparent)]" />
        </div>

        {/* Detalhes */}
        <dl className="mt-6 grid gap-0 divide-y divide-[var(--t-line)] rounded-2xl border border-[var(--t-line)] bg-[var(--t-elev)] px-4">
          {detalhes.map((d, i) => (
            <div
              key={d.label}
              className="viagem-entra flex items-center justify-between gap-3 py-3 text-sm"
              style={{ animationDelay: `${CONTAGEM_ATRASO_MS + 150 + i * 90}ms` }}
            >
              <dt className="flex items-center gap-2 text-[var(--t-dim)]">
                <d.icon className="size-4" />
                {d.label}
              </dt>
              <dd className="font-medium tabular-nums">{d.valor}</dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          autoFocus
          onClick={onFechar}
          className="viagem-entra mt-6 h-14 w-full rounded-2xl bg-[var(--t-text)] text-base font-semibold text-[var(--t-bg)] transition-opacity hover:opacity-90"
          style={{ animationDelay: `${CONTAGEM_ATRASO_MS + 300 + detalhes.length * 90}ms` }}
        >
          Concluir
        </button>
      </section>
    </div>
  );
}

/** Conta de 0 até `alvo` com desaceleração no fim. Com reduzir movimento, vai direto. */
function useContagem(alvo: number, ms: number, atraso: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setV(alvo);
      return;
    }
    let raf = 0;
    let inicio: number | null = null;
    const passo = (t: number) => {
      inicio ??= t;
      const p = Math.min(1, (t - inicio) / ms);
      setV(alvo * (1 - Math.pow(1 - p, 4)));
      if (p < 1) raf = requestAnimationFrame(passo);
    };
    const timer = setTimeout(() => (raf = requestAnimationFrame(passo)), atraso);
    // Com a aba em segundo plano os quadros param: termina no valor exato mesmo assim.
    const fim = setTimeout(() => {
      cancelAnimationFrame(raf);
      setV(alvo);
    }, atraso + ms);
    return () => {
      clearTimeout(timer);
      clearTimeout(fim);
      cancelAnimationFrame(raf);
    };
  }, [alvo, ms, atraso]);
  return v;
}

function duracao(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return m > 0 ? `${m} min` : `${segundos} s`;
}
