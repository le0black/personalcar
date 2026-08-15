import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gauge, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { brl, num, parseNumero } from "@/lib/fuel-data";

type Props = {
  /** Odômetro vigente (persistido) ou, na falta, o último registro. */
  odometro: number;
  /** Último odômetro registrado em abastecimento (piso de validação e base do trecho). */
  ultimoOdometro: number;
  /** Consumo médio histórico (km/l) — usado para estimar o trecho. */
  consumoMedio?: number | undefined;
  /** Preço médio do litro (R$) — usado para estimar o custo do trecho. */
  precoMedio?: number | undefined;
  /** Capacidade do tanque (L) — para o % estimado usado. */
  tanque?: number | undefined;
  onSave: (km: number) => void | Promise<void>;
};

export function OdometerPanel({
  odometro,
  ultimoOdometro,
  consumoMedio,
  precoMedio,
  tanque,
  onSave,
}: Props) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(String(odometro || ""));
  const [erro, setErro] = useState<string | null>(null);

  function abrir() {
    setValor(String(odometro || ""));
    setErro(null);
    setEditando(true);
  }

  async function salvar() {
    const km = parseNumero(valor);
    if (!km || km <= 0) return setErro("Informe um valor válido.");
    if (km < ultimoOdometro)
      return setErro(
        `Não pode ser menor que o último registro (${ultimoOdometro.toLocaleString("pt-BR")} km).`,
      );
    setErro(null);
    await onSave(km);
    setEditando(false);
  }

  // Desempenho desde o último abastecimento (estimado pela média histórica).
  const kmDesde = Math.max(0, (odometro || 0) - ultimoOdometro);
  const temEstimativa = !!consumoMedio && consumoMedio > 0 && kmDesde > 0;
  const litrosEstimados = temEstimativa ? kmDesde / consumoMedio! : 0;
  const custoEstimado = litrosEstimados * (precoMedio ?? 0);
  const pctTanque = tanque && tanque > 0 ? Math.min(100, (litrosEstimados / tanque) * 100) : 0;

  return (
    <section className="panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Gauge className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
              Odômetro atual
            </p>
            {editando ? (
              <div className="mt-1 flex items-center gap-2">
                <Input
                  autoFocus
                  inputMode="numeric"
                  className="numeral h-9 w-32"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") salvar();
                    if (e.key === "Escape") setEditando(false);
                  }}
                />
                <Button size="sm" className="h-9" onClick={salvar}>
                  Salvar
                </Button>
                <Button size="sm" variant="ghost" className="h-9" onClick={() => setEditando(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <button
                onClick={abrir}
                className="mt-1 flex items-center gap-1.5 font-display text-lg font-semibold hover:text-primary"
                title="Atualizar odômetro"
              >
                <span className="numeral">{(odometro || 0).toLocaleString("pt-BR")}</span> km
                <Pencil className="size-3.5 text-muted-foreground" />
              </button>
            )}
            {erro ? <p className="mt-1 text-xs text-destructive">{erro}</p> : null}
          </div>
        </div>

        <Link
          to="/percurso"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <MapPin className="size-4" />
          Rastrear percurso (GPS)
        </Link>
      </div>

      {kmDesde > 0 ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Desde o último abastecimento
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Rodados" value={`${num(kmDesde, 0)} km`} destaque />
            {temEstimativa ? (
              <>
                <Stat label="Combustível (est.)" value={`${num(litrosEstimados, 1)} L`} />
                <Stat label="Custo (est.)" value={brl(custoEstimado)} />
                <Stat label="Do tanque (est.)" value={`${num(pctTanque, 0)}%`} />
              </>
            ) : null}
          </div>
          {temEstimativa ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Estimativa pelo consumo médio de {num(consumoMedio!, 2)} km/l. O valor real aparece no
              próximo abastecimento com tanque cheio.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Registre pelo menos dois abastecimentos para estimar combustível e custo do trecho.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value, destaque }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`numeral font-display text-lg font-bold ${destaque ? "text-primary" : ""}`}>
        {value}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
