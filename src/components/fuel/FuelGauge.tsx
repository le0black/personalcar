import { AlertTriangle, Fuel, Gauge } from "lucide-react";
import { confiancaLabel, num, type Confianca, type TanqueVirtual } from "@/lib/fuel-data";

type Props = {
  tanque: TanqueVirtual;
  capacidade: number;
  reserva?: number | null | undefined;
};

const emoji: Record<Confianca, string> = { alta: "🟢", media: "🟡", baixa: "🔴" };

export function FuelGauge({ tanque, capacidade, reserva }: Props) {
  const faixa = tanque.emReserva ? "reserva" : tanque.atencao ? "atencao" : "normal";
  const barra =
    faixa === "reserva" ? "bg-destructive" : faixa === "atencao" ? "bg-warning" : "bg-primary";
  const valorCor =
    faixa === "reserva" ? "text-destructive" : faixa === "atencao" ? "text-warning" : "";

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Fuel className="size-4 shrink-0 text-primary" />
          <h3 className="font-display text-lg font-semibold">Combustível estimado</h3>
        </div>
        {tanque.confianca ? (
          <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
            {emoji[tanque.confianca]} {confiancaLabel[tanque.confianca]}
          </span>
        ) : null}
      </div>

      {tanque.semDados || tanque.litros == null || tanque.pct == null ? (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-border bg-card/50 p-4">
          <Gauge className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Ainda não há dados suficientes para estimar o consumo. Registre abastecimentos
            (idealmente com tanque cheio) ou informe o consumo no cadastro do veículo.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-3">
            <p className={`numeral font-display text-3xl font-bold ${valorCor}`}>
              {num(tanque.litros, 1)} <span className="text-lg font-medium">L</span>
              <span className="ml-2 text-base font-medium text-muted-foreground">
                {tanque.pct}% de {num(capacidade, 0)} L
              </span>
            </p>
          </div>

          {/* Barra da boia */}
          <div className="mt-3 h-4 overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all ${barra}`}
              style={{ width: `${Math.max(2, tanque.pct)}%` }}
            />
          </div>

          {tanque.emReserva ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              Combustível estimado em nível de reserva.
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Autonomia estimada</p>
              <p className="numeral mt-0.5 font-display text-lg font-semibold">
                {num(tanque.autonomia ?? 0, 0)} km
              </p>
              {reserva && reserva > 0 && !tanque.emReserva ? (
                <p className="numeral text-[11px] text-muted-foreground">
                  {num(tanque.autonomiaAteReserva ?? 0, 0)} km até a reserva
                </p>
              ) : null}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consumo usado</p>
              <p className="numeral mt-0.5 font-display text-lg font-semibold">
                {num(tanque.consumoUtilizado ?? 0, 1)} km/l
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Reserva</p>
              <p className="numeral mt-0.5 font-display text-lg font-semibold">
                {reserva && reserva > 0 ? `${num(reserva, 0)} L` : "—"}
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Estimativa — não é uma leitura física do tanque. Abastecer com tanque cheio recalibra
            para 100%.
          </p>
        </>
      )}
    </section>
  );
}
