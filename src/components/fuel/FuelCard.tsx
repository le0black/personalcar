import { Droplets, Fuel, HelpCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  brl,
  confiancaLabel,
  num,
  type EstadoCombustivel,
  type Metrics,
  type Refuel,
} from "@/lib/fuel-data";

type Props = {
  ultimo: Refuel | null;
  metrics: Metrics | null;
  estado: EstadoCombustivel;
  tanque: number;
};

export function FuelCard({ ultimo, metrics, estado, tanque }: Props) {
  const temRestante = estado.restante != null && estado.pctTanque != null;

  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <Fuel className="size-4 shrink-0 text-primary" />
        <h3 className="font-display text-lg font-semibold">Combustível</h3>
      </div>

      {/* Estado estimado do tanque */}
      <div className="mt-4 rounded-xl border border-border bg-card/50 p-4">
        {temRestante ? (
          <>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Combustível restante (estimado)
                </p>
                <p className="numeral mt-1 font-display text-2xl font-bold">
                  {num(estado.restante!, 1)} L
                  <span className="ml-2 text-base font-medium text-muted-foreground">
                    ~{estado.pctTanque}% de {num(tanque, 0)} L
                  </span>
                </p>
              </div>
              {estado.confianca ? (
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                  {confiancaLabel[estado.confianca]}
                </span>
              ) : null}
            </div>
            <Progress value={estado.pctTanque!} className="mt-3 h-2" />
          </>
        ) : (
          <div className="flex items-start gap-3">
            <HelpCircle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="font-medium">Combustível restante não determinado</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Precisa de um abastecimento com tanque cheio, um consumo estimado e o odômetro
                atual para calcular com segurança.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Último abastecimento */}
      {ultimo ? (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
            Último abastecimento
          </p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini label="Litros" value={`${num(ultimo.litros, 1)} L`} />
            <Mini label="Valor" value={brl(ultimo.valorTotal ?? ultimo.litros * ultimo.precoLitro)} />
            <Mini label="Preço/L" value={brl(ultimo.precoLitro)} />
            <Mini label="Hodômetro" value={`${ultimo.odometro.toLocaleString("pt-BR")} km`} />
          </div>
        </div>
      ) : null}

      {/* Totais acumulados */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3">
        <Mini
          label="Consumo médio"
          value={metrics ? `${num(metrics.consumoMedio, 2)} km/l` : "—"}
          hint={metrics ? confiancaLabel[metrics.confianca] : undefined}
        />
        <Mini label="Custo por km" value={metrics ? brl(metrics.custoPorKm) : "—"} />
        <Mini label="Total gasto" value={metrics ? brl(metrics.gastoTotal) : "—"} />
        <Mini
          label="Total abastecido"
          value={`${num(estado.litrosAbastecidos, 1)} L`}
        />
        <Mini
          label="Consumo estimado"
          value={estado.litrosConsumidos != null ? `${num(estado.litrosConsumidos, 1)} L` : "—"}
        />
        <Mini label="Abastecimentos" value={metrics ? String(metrics.qtdAbastecimentos) : "—"} />
      </div>
    </section>
  );
}

function Mini({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
}) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <Droplets className="size-3 shrink-0 opacity-60" />
        {label}
      </p>
      <p className="numeral mt-0.5 truncate font-display text-base font-semibold">{value}</p>
      {hint ? <p className="truncate text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
