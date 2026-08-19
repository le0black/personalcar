import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BellRing,
  Car,
  Droplets,
  Fuel,
  Gauge,
  LogOut,
  MapPin,
  Route as RouteIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { MetricCard } from "@/components/fuel/MetricCard";
import { RefuelForm } from "@/components/fuel/RefuelForm";
import { RefuelItem } from "@/components/fuel/RefuelItem";
import { VehicleForm } from "@/components/fuel/VehicleForm";
import { VehicleEditDialog } from "@/components/fuel/VehicleEditDialog";
import { VehicleIllustration } from "@/components/fuel/VehicleIllustration";
import { OdometerPanel } from "@/components/fuel/OdometerPanel";
import { getConsumoByModeloCompleto, getTipoByModeloCompleto } from "@/lib/vehicle-database";
import { ConsumoChart, GastoChart, PrecoChart } from "@/components/fuel/Charts";
import { ReminderPanel, computeReminder } from "@/components/fuel/ReminderPanel";
import { AuthGate } from "@/components/auth/AuthGate";
import { supabase } from "@/lib/supabase";
import {
  deleteRefuel,
  deleteVehicle,
  fetchRefuels,
  fetchVehicles,
  insertRefuel,
  insertVehicle,
  updateOdometro,
  updateRefuel,
  updateVehicle,
} from "@/lib/db";

import {
  brl,
  computeMetrics,
  confiancaLabel,
  num,
  type Refuel,
  type Vehicle,
} from "@/lib/fuel-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Abastece — Controle de combustível e consumo do seu carro" },
      {
        name: "description",
        content:
          "Registre abastecimentos e acompanhe consumo km/l, custo por km e gasto mensal de cada veículo em um painel claro.",
      },
      { property: "og:title", content: "Abastece — Controle de combustível e consumo" },
      {
        property: "og:description",
        content:
          "Painel de métricas de combustível: consumo médio, custo por km, autonomia e gasto mensal por veículo.",
      },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <AuthGate>
      <Dashboard />
      <Toaster richColors position="top-center" />
    </AuthGate>
  );
}

function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState<string | null>(null);

  // Carrega veículos e abastecimentos do usuário logado.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [vs, rs] = await Promise.all([fetchVehicles(), fetchRefuels()]);
        if (!ativo) return;
        setVehicles(vs);
        setRefuels(rs);
        setVehicleId((cur) => cur ?? vs[0]?.id ?? null);
      } catch (e) {
        if (ativo) setErroCarga(e instanceof Error ? e.message : "Falha ao carregar dados.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const consumoRef = vehicle ? getConsumoByModeloCompleto(vehicle.modelo) : null;

  const doVeiculo = useMemo(
    () =>
      refuels
        .filter((r) => r.vehicleId === vehicleId)
        .sort((a, b) => b.odometro - a.odometro),
    [refuels, vehicleId],
  );
  const metrics = useMemo(
    () => computeMetrics(doVeiculo, vehicle?.tanque ?? 0),
    [doVeiculo, vehicle?.tanque],
  );

  const ultimoOdometro = doVeiculo[0]?.odometro ?? 0;
  const melhorando = (metrics?.tendencia ?? 0) >= 0;

  const [odometros, setOdometros] = useState<Record<string, number>>({});
  const [limites, setLimites] = useState<Record<string, number>>({});
  const [lembretes, setLembretes] = useState<Record<string, boolean>>({});

  const chave = vehicleId ?? "";
  const odometroAtual =
    odometros[chave] ?? vehicle?.odometroAtual ?? ultimoOdometro + 320;
  const limiteKm = limites[chave] ?? 80;
  const lembreteAtivo = lembretes[chave] ?? true;

  const status = computeReminder(
    odometroAtual,
    ultimoOdometro,
    metrics?.autonomia ?? 0,
    metrics?.consumoMedio ?? 1,
    metrics?.precoMedio ?? 0,
    limiteKm,
  );
  const alertando = Boolean(metrics) && lembreteAtivo && status.nivel !== "ok";

  async function adicionarVeiculo(v: Vehicle): Promise<boolean> {
    try {
      // O id vindo do form é descartado; o banco gera o definitivo.
      const salvo = await insertVehicle({
        nome: v.nome,
        placa: v.placa,
        modelo: v.modelo,
        ano: v.ano,
        tanque: v.tanque,
      });
      setVehicles((prev) => [...prev, salvo]);
      setVehicleId(salvo.id);
      toast.success("Veículo adicionado.");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o veículo.");
      return false;
    }
  }

  async function adicionarAbastecimento(r: Refuel): Promise<boolean> {
    try {
      const salvo = await insertRefuel({
        vehicleId: r.vehicleId,
        data: r.data,
        odometro: r.odometro,
        litros: r.litros,
        precoLitro: r.precoLitro,
        combustivel: r.combustivel,
        tanqueCheio: r.tanqueCheio,
        posto: r.posto,
        valorTotal: r.valorTotal ?? null,
        observacoes: r.observacoes ?? null,
      });
      setRefuels((prev) => [...prev, salvo]);
      setOdometros((p) => ({ ...p, [salvo.vehicleId]: salvo.odometro }));

      // Resumo pós-salvar, com o consumo do último intervalo se houver.
      const valor = salvo.valorTotal ?? salvo.litros * salvo.precoLitro;
      let desc = `${num(salvo.litros, 1)} L · ${brl(valor)} · ${brl(salvo.precoLitro)}/L · ${salvo.odometro.toLocaleString("pt-BR")} km`;
      const lista = [...refuels, salvo].filter((x) => x.vehicleId === salvo.vehicleId);
      const ult = computeMetrics(lista, vehicle?.tanque ?? 0)?.intervalos.at(-1);
      if (ult) desc += `\nConsumo: ${num(ult.consumo, 2)} km/l · ${confiancaLabel[ult.confianca]}`;
      toast.success("Abastecimento registrado", { description: desc });
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível salvar o abastecimento.");
      return false;
    }
  }

  async function editarVeiculo(id: string, patch: Pick<Vehicle, "nome" | "placa" | "tanque">) {
    try {
      const salvo = await updateVehicle(id, patch);
      setVehicles((prev) => prev.map((v) => (v.id === id ? salvo : v)));
      toast.success("Veículo atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar o veículo.");
    }
  }

  async function excluirVeiculo(id: string) {
    try {
      await deleteVehicle(id);
      const restantes = vehicles.filter((v) => v.id !== id);
      setVehicles(restantes);
      setRefuels((prev) => prev.filter((r) => r.vehicleId !== id));
      if (vehicleId === id) setVehicleId(restantes[0]?.id ?? null);
      toast.success("Veículo excluído.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir o veículo.");
    }
  }

  async function editarAbastecimento(
    id: string,
    patch: Partial<Omit<Refuel, "id" | "vehicleId">>,
  ) {
    try {
      const salvo = await updateRefuel(id, patch);
      setRefuels((prev) => prev.map((r) => (r.id === id ? salvo : r)));
      toast.success("Abastecimento atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar o abastecimento.");
    }
  }

  async function excluirAbastecimento(id: string) {
    try {
      await deleteRefuel(id);
      setRefuels((prev) => prev.filter((r) => r.id !== id));
      toast.success("Abastecimento excluído.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível excluir o abastecimento.");
    }
  }

  async function salvarOdometro(km: number) {
    if (!vehicle) return;
    try {
      const salvo = await updateOdometro(vehicle.id, km);
      setVehicles((prev) => prev.map((v) => (v.id === vehicle.id ? salvo : v)));
      setOdometros((p) => ({ ...p, [vehicle.id]: km }));
      toast.success("Odômetro atualizado.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar o odômetro.");
    }
  }

  async function sair() {
    await supabase?.auth.signOut();
  }

  if (carregando) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Fuel className="size-5" />
          </div>
          <span className="text-sm">Carregando seus veículos…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Fuel className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-xl font-bold tracking-tight sm:text-2xl">
              Abastece
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Conheça o consumo real dos seus veículos
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => setVehicleId(v.id)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  v.id === vehicleId
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.nome}
              </button>
            ))}
            <VehicleForm onAdd={adicionarVeiculo} />
          </div>
          <button
            onClick={sair}
            className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>

      {erroCarga ? (
        <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {erroCarga}
        </div>
      ) : null}

      {vehicles.length === 0 ? (
        <section className="panel mt-8 grid place-items-center gap-4 p-10 text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Car className="size-7" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Adicione seu primeiro veículo</h2>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
              Escolha marca, modelo e ano — carros e motos de 1970 até hoje — e comece a registrar
              os abastecimentos.
            </p>
          </div>
          <VehicleForm onAdd={adicionarVeiculo} />
        </section>
      ) : !vehicle ? null : (
        <>
          {alertando ? (
            <div
              className={`mt-6 flex items-start gap-3 rounded-xl border p-4 ${
                status.nivel === "critico"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-warning/40 bg-warning/10 text-warning"
              }`}
            >
              <BellRing className="mt-0.5 size-5 shrink-0" />
              <p className="min-w-0 text-sm">
                <span className="font-semibold">
                  {status.nivel === "critico"
                    ? `Abasteça o ${vehicle.nome} agora.`
                    : `Hora de abastecer o ${vehicle.nome} em breve.`}
                </span>{" "}
                <span className="numeral text-foreground/80">
                  restam cerca de {num(status.kmRestantes, 0)} km ({num(status.litrosRestantes, 1)}{" "}
                  L) com o consumo médio de {num(metrics?.consumoMedio ?? 0, 2)} km/l.
                </span>
              </p>
            </div>
          ) : null}

          <section className="panel mt-6 grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="flex min-w-0 items-center gap-4">
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <VehicleIllustration
                  tipo={getTipoByModeloCompleto(vehicle.modelo)}
                  className="w-11"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Veículo selecionado
                </p>
                <p className="mt-1 truncate font-display text-lg font-semibold">
                  {vehicle.modelo} · {vehicle.ano}
                </p>
                <p className="numeral mt-1 text-sm text-muted-foreground">
                  {vehicle.placa} · tanque {vehicle.tanque} L
                </p>
                {consumoRef ? (
                  <p className="numeral mt-1 text-xs text-muted-foreground">
                    consumo ref.: {num(consumoRef.cidade, 0)} cidade · {num(consumoRef.rodovia, 0)}{" "}
                    rodovia km/l
                  </p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {metrics ? (
                <div
                  className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm ${
                    melhorando ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {melhorando ? (
                    <TrendingUp className="size-4 shrink-0" />
                  ) : (
                    <TrendingDown className="size-4 shrink-0" />
                  )}
                  <span className="numeral font-medium">
                    {melhorando ? "+" : ""}
                    {num(metrics.tendencia, 1)}%
                  </span>
                  <span className="text-muted-foreground">de eficiência recente</span>
                </div>
              ) : null}
              <VehicleEditDialog
                vehicle={vehicle}
                onSave={(patch) => editarVeiculo(vehicle.id, patch)}
                onDelete={() => excluirVeiculo(vehicle.id)}
              />
            </div>
          </section>

          <div className="mt-4">
            <OdometerPanel
              odometro={vehicle.odometroAtual ?? ultimoOdometro}
              ultimoOdometro={ultimoOdometro}
              consumoMedio={metrics?.consumoMedio ?? consumoRef?.misto}
              precoMedio={metrics?.precoMedio}
              tanque={vehicle.tanque}
              onSave={salvarOdometro}
            />
          </div>

          {metrics ? (
            <>
              <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Consumo médio"
                  value={num(metrics.consumoMedio, 2)}
                  unit="km/l"
                  hint={`${confiancaLabel[metrics.confianca]} · ${num(metrics.consumoL100, 1)} L/100km`}
                  icon={Gauge}
                  tone="primary"
                />
                <MetricCard
                  label="Custo por km"
                  value={brl(metrics.custoPorKm)}
                  hint={`preço médio ${brl(metrics.precoMedio)}/l`}
                  icon={Wallet}
                />
                <MetricCard
                  label="Gasto mensal"
                  value={brl(metrics.gastoMensal)}
                  hint={`total ${brl(metrics.gastoTotal)}`}
                  icon={Droplets}
                />
                <MetricCard
                  label="Autonomia estimada"
                  value={num(metrics.autonomia, 0)}
                  unit="km"
                  hint={`${num(metrics.kmRodados, 0)} km monitorados`}
                  icon={RouteIcon}
                  tone="success"
                />
              </section>

              <section className="mt-6 grid gap-4 lg:grid-cols-2">
                <ConsumoChart serie={metrics.serie} media={metrics.consumoMedio} />
                <GastoChart porMes={metrics.porMes} />
              </section>

              <section className="mt-4">
                <PrecoChart serie={metrics.serie} />
              </section>
            </>
          ) : (
            <p className="panel mt-6 p-6 text-sm text-muted-foreground">
              Registre pelo menos dois abastecimentos com tanque cheio para ver as métricas.
            </p>
          )}

          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="panel overflow-hidden">
              <div className="border-b border-border p-5">
                <h3 className="font-display text-lg font-semibold">Histórico</h3>
                <p className="text-xs text-muted-foreground">
                  {doVeiculo.length} abastecimentos registrados
                </p>
              </div>
              {doVeiculo.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  Nenhum abastecimento ainda. Registre o primeiro ao lado.
                </p>
              ) : (
                <ul className="max-h-[520px] divide-y divide-border overflow-y-auto">
                  {doVeiculo.map((r) => (
                    <RefuelItem
                      key={r.id}
                      refuel={r}
                      onSave={(patch) => editarAbastecimento(r.id, patch)}
                      onDelete={() => excluirAbastecimento(r.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            <div className="grid gap-4">
              {metrics ? (
                <ReminderPanel
                  odometroAtual={odometroAtual}
                  onOdometroChange={(v) => setOdometros((p) => ({ ...p, [chave]: v }))}
                  ultimoOdometro={ultimoOdometro}
                  limiteKm={limiteKm}
                  onLimiteChange={(v) => setLimites((p) => ({ ...p, [chave]: v }))}
                  ativo={lembreteAtivo}
                  onAtivoChange={(v) => setLembretes((p) => ({ ...p, [chave]: v }))}
                  status={status}
                  autonomia={metrics.autonomia}
                  precoMedio={metrics.precoMedio}
                  tanque={vehicle.tanque}
                />
              ) : null}

              <RefuelForm
                vehicleId={vehicle.id}
                ultimoOdometro={ultimoOdometro}
                onAdd={adicionarAbastecimento}
              />
            </div>
          </section>
        </>
      )}

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Seus dados ficam salvos na sua conta · Abastece
      </footer>
    </main>
  );
}
