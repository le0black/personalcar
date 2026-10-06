import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Fuel,
  Gauge,
  LayoutList,
  Maximize,
  Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RefuelForm } from "@/components/fuel/RefuelForm";
import { FuelTank, SEGMENTOS, Segmentos, corFaixa, type Faixa } from "@/components/fuel/FuelTank";
import {
  brl,
  num,
  parseNumero,
  type Refuel,
  type TanqueVirtual,
  type Vehicle,
} from "@/lib/fuel-data";

type Props = {
  vehicle: Vehicle;
  vehicles: Vehicle[];
  onSelectVehicle: (id: string) => void;
  tanque: TanqueVirtual;
  odometro: number;
  ultimoOdometro: number;
  custoPorKm?: number | undefined;
  /** Abastecimentos do veículo (o formulário usa para validar anomalias). */
  refuels: Refuel[];
  consumoMedio?: number | undefined;
  onAddRefuel: (r: Refuel) => Promise<boolean> | boolean;
  onSaveOdometro: (km: number) => Promise<void> | void;
  onDetalhes: () => void;
};

/**
 * Painel de apoio ao visor do carro: só o que se lê de relance dirigindo
 * (nível, autonomia, alerta) e duas ações grandes. O resto fica em "Detalhes".
 */
export function Cockpit({
  vehicle,
  vehicles,
  onSelectVehicle,
  tanque,
  odometro,
  ultimoOdometro,
  custoPorKm,
  refuels,
  consumoMedio,
  onAddRefuel,
  onSaveOdometro,
  onDetalhes,
}: Props) {
  const [abastecer, setAbastecer] = useState(false);
  const [atualizarKm, setAtualizarKm] = useState(false);
  const modoCarro = useModoCarro();
  const hora = useRelogio();

  const semDados = tanque.semDados || tanque.litros == null || tanque.pct == null;
  const pct = tanque.pct ?? 0;
  const faixa: Faixa = tanque.emReserva ? "reserva" : tanque.atencao ? "atencao" : "normal";
  const reservaPct =
    vehicle.reservaLitros && vehicle.tanque > 0
      ? (vehicle.reservaLitros / vehicle.tanque) * 100
      : null;

  function proximoVeiculo() {
    if (vehicles.length < 2) return;
    const i = vehicles.findIndex((v) => v.id === vehicle.id);
    onSelectVehicle(vehicles[(i + 1) % vehicles.length]!.id);
  }

  return (
    <main
      className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col gap-4 px-4 py-4 sm:px-6 landscape:grid landscape:h-[100dvh] landscape:grid-cols-[minmax(0,1fr)_14rem] landscape:grid-rows-[auto_minmax(0,1fr)] landscape:gap-3 landscape:py-3"
      style={{ "--fuel": corFaixa[faixa] } as React.CSSProperties}
    >
      {/* Barra superior mínima */}
      <header className="flex items-center justify-between gap-3 landscape:col-span-2">
        <button
          type="button"
          onClick={proximoVeiculo}
          className="flex min-w-0 items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold"
          title={vehicles.length > 1 ? "Trocar de veículo" : vehicle.modelo}
        >
          <span className="truncate">{vehicle.nome}</span>
          {vehicles.length > 1 ? (
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          ) : null}
        </button>
        <span className="numeral text-lg font-semibold text-muted-foreground">{hora}</span>
        <div className="flex shrink-0 items-center gap-2">
          <IconButton
            label={modoCarro.ativo ? "Sair do modo carro" : "Modo carro (tela cheia, sem apagar)"}
            onClick={modoCarro.alternar}
            ativo={modoCarro.ativo}
          >
            {modoCarro.ativo ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </IconButton>
          <IconButton label="Detalhes, histórico e gráficos" onClick={onDetalhes}>
            <LayoutList className="size-5" />
          </IconButton>
        </div>
      </header>

      {/* Leitura principal */}
      <section className="panel flex flex-1 flex-col items-center justify-center gap-6 p-5 sm:p-8 landscape:min-h-0 landscape:flex-row landscape:gap-8 landscape:p-5">
        <FuelTank
          pct={semDados ? 0 : pct}
          faixa={faixa}
          reservaPct={reservaPct}
          segmentos={false}
          tankClassName="h-[34dvh] min-h-44 max-h-80 w-[min(40vw,11rem)] landscape:h-[min(60dvh,20rem)] landscape:min-h-32 landscape:w-32"
        />

        <div className="flex w-full min-w-0 max-w-md flex-col items-center gap-4 text-center landscape:items-start landscape:text-left">
          {semDados ? (
            <>
              <p className="font-display text-2xl font-bold">Sem estimativa ainda</p>
              <p className="text-sm text-muted-foreground">
                Registre um abastecimento (de preferência com tanque cheio) para o painel calcular o
                nível e a autonomia.
              </p>
            </>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Autonomia
                </p>
                <p
                  className="numeral font-display font-bold leading-none"
                  style={{ color: "var(--fuel)", fontSize: "clamp(3rem, min(16vw, 22dvh), 7rem)" }}
                >
                  {num(tanque.autonomia ?? 0, 0)}
                  <span className="ml-2 text-[0.35em] font-semibold text-muted-foreground">km</span>
                </p>
                {vehicle.reservaLitros && !tanque.emReserva ? (
                  <p className="numeral mt-1 text-sm text-muted-foreground">
                    {num(tanque.autonomiaAteReserva ?? 0, 0)} km até a reserva
                  </p>
                ) : null}
              </div>

              <div className="w-full">
                <Segmentos acesos={Math.round((pct / 100) * SEGMENTOS)} className="h-6" />
                <p className="numeral mt-2 text-lg font-semibold">
                  {num(tanque.litros ?? 0, 1)} L
                  <span className="ml-2 text-muted-foreground">· {pct}%</span>
                </p>
              </div>
            </>
          )}

          {tanque.emReserva ? (
            <p className="flex items-center gap-2 rounded-xl bg-destructive/15 px-4 py-2.5 font-display text-lg font-bold text-destructive">
              <AlertTriangle className="size-5 shrink-0" />
              Abasteça agora
            </p>
          ) : tanque.atencao ? (
            <p className="flex items-center gap-2 rounded-xl bg-warning/15 px-4 py-2.5 font-semibold text-warning">
              <AlertTriangle className="size-5 shrink-0" />
              Abastecer em breve
            </p>
          ) : null}
        </div>
      </section>

      {/* Coluna lateral no modo deitado: leituras secundárias + ações */}
      <div className="flex flex-col gap-4 landscape:min-h-0 landscape:justify-between landscape:gap-3">
        <section className="grid grid-cols-3 gap-2 text-center landscape:grid-cols-1">
          <Leitura
            valor={tanque.consumoUtilizado ? num(tanque.consumoUtilizado, 1) : "—"}
            unidade="km/l"
          />
          <Leitura valor={(odometro || 0).toLocaleString("pt-BR")} unidade="odômetro" />
          <Leitura valor={custoPorKm ? brl(custoPorKm) : "—"} unidade="por km" />
        </section>

        {/* Ações grandes */}
        <section className="grid grid-cols-2 gap-3 pb-[env(safe-area-inset-bottom)] landscape:grid-cols-1">
          <Button
            size="lg"
            className="h-16 rounded-2xl text-lg font-bold landscape:h-14"
            onClick={() => setAbastecer(true)}
          >
            <Fuel className="size-6" /> Abasteci
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="h-16 rounded-2xl text-lg font-bold landscape:h-14"
            onClick={() => setAtualizarKm(true)}
          >
            <Gauge className="size-6" /> Atualizar km
          </Button>
        </section>
      </div>

      <Drawer open={abastecer} onOpenChange={setAbastecer}>
        <DrawerContent className="max-h-[92dvh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Novo abastecimento</DrawerTitle>
            <DrawerDescription>Registre litros, valor e odômetro.</DrawerDescription>
          </DrawerHeader>
          <div className="mx-auto w-full max-w-2xl overflow-y-auto p-4">
            <RefuelForm
              vehicleId={vehicle.id}
              ultimoOdometro={ultimoOdometro}
              refuels={refuels}
              tanque={vehicle.tanque}
              consumoMedio={consumoMedio}
              onAdd={async (r) => {
                const ok = await onAddRefuel(r);
                if (ok) setAbastecer(false);
                return ok;
              }}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={atualizarKm} onOpenChange={setAtualizarKm}>
        <DrawerContent>
          <OdometroRapido
            odometro={odometro}
            ultimoOdometro={ultimoOdometro}
            onSave={async (km) => {
              await onSaveOdometro(km);
              setAtualizarKm(false);
            }}
          />
        </DrawerContent>
      </Drawer>
    </main>
  );
}

function Leitura({ valor, unidade }: { valor: string; unidade: string }) {
  return (
    <div className="panel min-w-0 px-2 py-3 landscape:flex landscape:items-baseline landscape:justify-between landscape:gap-2 landscape:px-3 landscape:py-2">
      <p className="numeral truncate font-display text-xl font-bold sm:text-2xl landscape:text-lg">
        {valor}
      </p>
      <p className="truncate text-xs text-muted-foreground">{unidade}</p>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  ativo,
  children,
}: {
  label: string;
  onClick: () => void;
  ativo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid size-11 place-items-center rounded-full border transition-colors ${
        ativo
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function OdometroRapido({
  odometro,
  ultimoOdometro,
  onSave,
}: {
  odometro: number;
  ultimoOdometro: number;
  onSave: (km: number) => Promise<void>;
}) {
  const [valor, setValor] = useState(String(odometro || ""));
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const km = parseNumero(valor);
    if (!km || km <= 0) return setErro("Informe um valor válido.");
    if (km < ultimoOdometro)
      return setErro(
        `Não pode ser menor que o último registro (${ultimoOdometro.toLocaleString("pt-BR")} km).`,
      );
    setErro(null);
    setSalvando(true);
    try {
      await onSave(km);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="mx-auto grid w-full max-w-md gap-4 p-5">
      <DrawerHeader className="p-0 text-left">
        <DrawerTitle className="font-display text-xl">Odômetro do painel</DrawerTitle>
        <DrawerDescription>Digite os km que aparecem no painel do carro.</DrawerDescription>
      </DrawerHeader>
      <Input
        autoFocus
        inputMode="numeric"
        aria-label="Odômetro em km"
        className="numeral h-16 text-center font-display text-3xl font-bold"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
      <Button
        type="submit"
        size="lg"
        className="h-14 rounded-2xl text-lg font-bold"
        disabled={salvando}
      >
        {salvando ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}

/** Hora atual (HH:MM), atualizada a cada 15 s. Vazia no SSR para não divergir. */
function useRelogio() {
  const [hora, setHora] = useState("");
  useEffect(() => {
    const fmt = () =>
      setHora(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    fmt();
    const id = setInterval(fmt, 15_000);
    return () => clearInterval(id);
  }, []);
  return hora;
}

/**
 * Modo carro: tela cheia + Wake Lock (a tela não apaga). O navegador solta o
 * wake lock quando a aba some; ao voltar, pedimos de novo.
 */
function useModoCarro() {
  const [ativo, setAtivo] = useState(false);
  const lock = useRef<WakeLockSentinel | null>(null);

  async function pedirWakeLock() {
    try {
      lock.current = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      lock.current = null;
    }
  }

  useEffect(() => {
    if (!ativo) return;
    const onVis = () => {
      if (document.visibilityState === "visible") void pedirWakeLock();
    };
    const onFs = () => {
      // Saiu da tela cheia pelo gesto do sistema: desliga o modo.
      if (!document.fullscreenElement && document.fullscreenEnabled) setAtivo(false);
    };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
      void lock.current?.release().catch(() => {});
      lock.current = null;
    };
  }, [ativo]);

  async function alternar() {
    if (ativo) {
      setAtivo(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      return;
    }
    // iPhone não suporta tela cheia em páginas; o wake lock funciona mesmo assim.
    await document.documentElement.requestFullscreen?.().catch(() => {});
    await pedirWakeLock();
    setAtivo(true);
  }

  return { ativo, alternar };
}
