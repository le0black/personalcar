import { useEffect, useState } from "react";

type Faixa = "normal" | "atencao" | "reserva";

type Props = {
  pct: number;
  /** Nível da reserva em % da capacidade (linha tracejada no tanque). */
  reservaPct?: number | null | undefined;
  faixa: Faixa;
  /** Leitura exibida acima da barra de segmentos. */
  children?: React.ReactNode;
};

const corFaixa: Record<Faixa, string> = {
  normal: "var(--primary)",
  atencao: "var(--warning)",
  reserva: "var(--destructive)",
};

/** Onda periódica: dois ciclos em 400 de largura, para o loop de -50% não emendar. */
const ONDA = "M0 10 Q50 0 100 10 T200 10 T300 10 T400 10 V20 H0 Z";

const SEGMENTOS = 10;

/**
 * Marcador digital de combustível: tanque com o líquido balançando e barra de
 * segmentos estilo painel. Tocar no tanque "chacoalha" o combustível.
 */
export function FuelTank({ pct, reservaPct, faixa, children }: Props) {
  const nivel = Math.min(100, Math.max(0, pct));
  // Começa vazio e enche até o nível na montagem (animação de entrada).
  const [exibido, setExibido] = useState(0);
  const [chacoalhando, setChacoalhando] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setExibido(nivel));
    return () => cancelAnimationFrame(id);
  }, [nivel]);

  const baixo = faixa === "reserva";
  const acesos = Math.round((nivel / 100) * SEGMENTOS);
  const style = {
    "--fuel": corFaixa[faixa],
    "--lvl": `${Math.max(3, exibido)}%`,
    "--surface": `${100 - Math.max(3, exibido)}%`,
  } as React.CSSProperties;

  return (
    <div
      className={`fuel-tank-wrap flex items-stretch gap-4 ${baixo ? "is-low" : ""}`}
      style={style}
    >
      <button
        type="button"
        aria-label={`Tanque com ${Math.round(nivel)}% de combustível. Toque para chacoalhar.`}
        onClick={() => setChacoalhando(true)}
        onAnimationEnd={(e) => {
          if (e.animationName === "fuel-shake") setChacoalhando(false);
        }}
        className={`fuel-tank fuel-glass h-48 w-28 shrink-0 sm:h-52 sm:w-32 ${
          chacoalhando ? "is-shaking" : ""
        } ${baixo ? "is-low" : ""}`}
      >
        <div className="fuel-surface" aria-hidden>
          <div className="fuel-liquid">
            <svg className="fuel-wave back" viewBox="0 0 400 20" preserveAspectRatio="none">
              <path d={ONDA} />
            </svg>
            <svg className="fuel-wave" viewBox="0 0 400 20" preserveAspectRatio="none">
              <path d={ONDA} />
            </svg>
            {nivel > 8
              ? [
                  { l: "38%", s: 6, d: "0s" },
                  { l: "52%", s: 4, d: "1.3s" },
                  { l: "61%", s: 5, d: "2.6s" },
                ].map((b) => (
                  <span
                    key={b.l}
                    className="fuel-bubble"
                    style={{ left: b.l, width: b.s, height: b.s, animationDelay: b.d }}
                  />
                ))
              : null}
          </div>
        </div>

        {/* Marcas de nível */}
        <div
          className="pointer-events-none absolute inset-y-3 right-2 flex flex-col justify-between"
          aria-hidden
        >
          {["F", "", "½", "", "E"].map((m, i) => (
            <div key={i} className="flex items-center justify-end gap-1">
              {m ? (
                <span className="text-[9px] font-semibold text-white/70 drop-shadow">{m}</span>
              ) : null}
              <span className={`h-px bg-white/45 ${m ? "w-3" : "w-2"}`} />
            </div>
          ))}
        </div>

        {reservaPct && reservaPct > 0 && reservaPct < 100 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-2 border-t border-dashed border-destructive/80"
            style={{ bottom: `${reservaPct}%` }}
          />
        ) : null}
      </button>

      {/* Leitura digital */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3">
        {children}
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="text-[10px] font-semibold text-muted-foreground">E</span>
          <div className="grid flex-1 grid-cols-10 gap-1">
            {Array.from({ length: SEGMENTOS }, (_, i) => (
              <span
                key={i}
                className={`fuel-seg h-5 rounded-sm bg-secondary ${i < acesos ? "on" : ""}`}
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">F</span>
        </div>
      </div>
    </div>
  );
}
