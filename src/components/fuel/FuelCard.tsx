import { Droplets, Fuel } from "lucide-react";
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
};

export function FuelCard({ ultimo, metrics, estado }: Props) {
  return (
    <section className="panel p-5">
      <div className="flex items-center gap-2">
        <Fuel className="size-4 shrink-0 text-primary" />
        <h3 className="font-display text-lg font-semibold">Resumo de combustível</h3>
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
