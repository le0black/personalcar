import { GitCommitVertical } from "lucide-react";
import { confiancaLabel, num, type Confianca, type Intervalo, type Refuel } from "@/lib/fuel-data";

type Props = {
  intervalos: Intervalo[];
  refuels: Refuel[];
};

const cor: Record<Confianca, string> = {
  alta: "bg-success/15 text-success",
  media: "bg-warning/15 text-warning",
  baixa: "bg-muted text-muted-foreground",
};

export function Timeline({ intervalos, refuels }: Props) {
  const byId = new Map(refuels.map((r) => [r.id, r]));
  // Mais recente primeiro.
  const lista = [...intervalos].reverse();

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-border p-5">
        <h3 className="font-display text-lg font-semibold">Linha do tempo de consumo</h3>
        <p className="text-xs text-muted-foreground">
          Cada medição e os abastecimentos que a formaram
        </p>
      </div>

      {lista.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">
          Registre dois abastecimentos (idealmente com tanque cheio) para medir o consumo.
        </p>
      ) : (
        <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
          {lista.map((it, i) => {
            const formadores = it.ids
              .map((id) => byId.get(id))
              .filter((r): r is Refuel => Boolean(r));
            return (
              <li key={`${it.odoFim}-${i}`} className="px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <GitCommitVertical className="size-4 shrink-0 text-primary" />
                    <span className="numeral font-display text-lg font-semibold">
                      {num(it.consumo, 2)} km/l
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${cor[it.confianca]}`}>
                    {confiancaLabel[it.confianca]}
                  </span>
                </div>
                <p className="numeral mt-1 text-xs text-muted-foreground">
                  {it.odoInicio.toLocaleString("pt-BR")} → {it.odoFim.toLocaleString("pt-BR")} km ·{" "}
                  {num(it.km, 0)} km · {num(it.litros, 1)} L · custo {num(it.custoKm, 2)}/km
                </p>
                {formadores.length > 0 ? (
                  <p className="numeral mt-1 text-[11px] text-muted-foreground">
                    formado por:{" "}
                    {formadores
                      .map(
                        (r) =>
                          `${new Date(r.data + "T00:00:00").toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })} (${num(r.litros, 1)} L${r.tanqueCheio ? "" : ", parcial"})`,
                      )
                      .join(" · ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
