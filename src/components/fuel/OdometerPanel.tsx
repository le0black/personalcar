import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Gauge, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseNumero } from "@/lib/fuel-data";

type Props = {
  /** Odômetro vigente (persistido) ou, na falta, o último registro. */
  odometro: number;
  /** Último odômetro registrado em abastecimento (piso de validação). */
  ultimoOdometro: number;
  onSave: (km: number) => void | Promise<void>;
};

export function OdometerPanel({ odometro, ultimoOdometro, onSave }: Props) {
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
      return setErro(`Não pode ser menor que o último registro (${ultimoOdometro.toLocaleString("pt-BR")} km).`);
    setErro(null);
    await onSave(km);
    setEditando(false);
  }

  return (
    <section className="panel flex flex-wrap items-center justify-between gap-4 p-5">
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
              <Button
                size="sm"
                variant="ghost"
                className="h-9"
                onClick={() => setEditando(false)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <button
              onClick={abrir}
              className="mt-1 font-display text-lg font-semibold hover:text-primary"
              title="Atualizar odômetro"
            >
              <span className="numeral">{(odometro || 0).toLocaleString("pt-BR")}</span> km
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
    </section>
  );
}
