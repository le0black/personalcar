import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Metrics } from "@/lib/fuel-data";
import { brl, num } from "@/lib/fuel-data";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

const tooltipStyle = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  fontSize: "12px",
  color: "var(--popover-foreground)",
};

export function ConsumoChart({ serie, media }: { serie: Metrics["serie"]; media: number }) {
  return (
    <div className="panel p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold">Consumo por abastecimento</h3>
          <p className="text-xs text-muted-foreground">km/l calculado entre tanques cheios</p>
        </div>
        <span className="numeral shrink-0 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
          média {num(media, 2)} km/l
        </span>
      </div>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gConsumo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.45} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="data" {...axis} />
            <YAxis {...axis} domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number) => [`${num(v, 2)} km/l`, "Consumo"]}
            />
            <Area
              type="monotone"
              dataKey="consumo"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#gConsumo)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function GastoChart({ porMes }: { porMes: Metrics["porMes"] }) {
  return (
    <div className="panel p-5">
      <h3 className="font-display text-lg font-semibold">Gasto mensal</h3>
      <p className="text-xs text-muted-foreground">Total investido em combustível por mês</p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={porMes} margin={{ left: -10, right: 8, top: 8 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="mes" {...axis} />
            <YAxis {...axis} />
            <Tooltip
              cursor={{ fill: "var(--accent)" }}
              contentStyle={tooltipStyle}
              formatter={(v: number) => [brl(v), "Gasto"]}
            />
            <Bar dataKey="gasto" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={38} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PrecoChart({ serie }: { serie: Metrics["serie"] }) {
  return (
    <div className="panel p-5">
      <h3 className="font-display text-lg font-semibold">Preço do litro x custo por km</h3>
      <p className="text-xs text-muted-foreground">
        Acompanhe se o posto mais barato realmente rende mais
      </p>
      <div className="mt-5 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie} margin={{ left: -20, right: 8, top: 8 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis dataKey="data" {...axis} />
            <YAxis {...axis} domain={["dataMin - 0.5", "dataMax + 0.5"]} />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(v: number, name) => [
                name === "preco" ? brl(v) : `${brl(v)}/km`,
                name === "preco" ? "Preço/litro" : "Custo/km",
              ]}
            />
            <Area
              type="monotone"
              dataKey="preco"
              stroke="var(--chart-3)"
              strokeWidth={2}
              fill="transparent"
            />
            <Line type="monotone" dataKey="custoKm" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
