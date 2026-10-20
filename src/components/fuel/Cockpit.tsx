import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Fuel,
  Gauge,
  LayoutList,
  Maximize,
  Minimize,
  Moon,
  Navigation,
  Square,
  Sun,
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
import { CalculoAutonomia } from "@/components/fuel/CalculoAutonomia";
import { CockpitMap } from "@/components/fuel/CockpitMap";
import { VehicleIllustration } from "@/components/fuel/VehicleIllustration";
import { getTipoByModeloCompleto } from "@/lib/vehicle-database";
import type { LatLng } from "@/lib/geo";
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
  /** Viagem pelo GPS em andamento (null quando parada). */
  viagem: ViagemAoVivo | null;
  /** Trajeto da viagem, para o mapa. */
  trilha: LatLng[];
  erroGps: string | null;
  onIniciarViagem: () => void;
  onEncerrarViagem: () => Promise<void> | void;
};

export type ViagemAoVivo = {
  distancia: number;
  segundos: number;
  velocidade: number | null;
  erro: string | null;
};

/**
 * Painel de apoio ao visor do carro, inspirado na tela do Tesla: à esquerda o
 * carro com a autonomia em destaque, à direita o mapa, embaixo o dock de ações.
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
  viagem,
  trilha,
  erroGps,
  onIniciarViagem,
  onEncerrarViagem,
}: Props) {
  const [abastecer, setAbastecer] = useState(false);
  const [atualizarKm, setAtualizarKm] = useState(false);
  const [calculo, setCalculo] = useState(false);
  const modoCarro = useModoCarro();
  const hora = useRelogio();
  const [tema, alternarTema] = useTema();

  const semDados = tanque.semDados || tanque.litros == null || tanque.pct == null;
  const pct = tanque.pct ?? 0;
  const cor = tanque.emReserva
    ? "var(--t-red)"
    : tanque.atencao
      ? "var(--t-amber)"
      : "var(--t-green)";
  const movendo = viagem != null && (viagem.velocidade ?? 0) > 3;

  async function iniciarViagem() {
    onIniciarViagem();
    // A tela precisa ficar ligada: com ela apagada o navegador pausa o GPS.
    // Vem depois para uma tela cheia negada ou lenta não segurar a viagem.
    if (!modoCarro.ativo) await modoCarro.alternar();
  }

  function proximoVeiculo() {
    if (vehicles.length < 2 || viagem) return;
    const i = vehicles.findIndex((v) => v.id === vehicle.id);
    onSelectVehicle(vehicles[(i + 1) % vehicles.length]!.id);
  }

  return (
    <div
      className="tesla grid h-[100dvh] w-full grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden landscape:grid-cols-[minmax(17rem,38%)_minmax(0,1fr)] landscape:grid-rows-[minmax(0,1fr)_auto]"
      data-tema={tema}
    >
      {/* Lado do carro */}
      <section className="flex min-h-0 flex-col gap-3 bg-[var(--t-panel)] px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] landscape:gap-2 landscape:py-3">
        <header className="flex items-center justify-between text-sm font-medium">
          <span className="flex shrink-0 items-baseline gap-3">
            <Marchas ativa={movendo ? "D" : "P"} />
            {viagem ? (
              <span className="hidden whitespace-nowrap tabular-nums text-[var(--t-dim)] landscape:inline">
                <span className="text-xl font-light text-[var(--t-text)]">
                  {viagem.velocidade != null ? num(viagem.velocidade, 0) : "—"}
                </span>{" "}
                km/h
              </span>
            ) : null}
          </span>
          <div className="flex min-w-0 items-center gap-3 text-[var(--t-dim)]">
            <button
              type="button"
              onClick={proximoVeiculo}
              className="truncate font-medium disabled:cursor-default"
              disabled={vehicles.length < 2 || viagem != null}
              title={viagem ? "Encerre a viagem para trocar" : "Trocar de veículo"}
            >
              {vehicle.nome}
            </button>
            {viagem ? (
              <span className="flex items-center gap-1.5 text-[var(--t-blue)]">
                <span className="size-1.5 animate-pulse rounded-full bg-current" />
                <span className="landscape:sr-only">GPS</span>
              </span>
            ) : null}
            <span className="tabular-nums text-[var(--t-text)]">{hora}</span>
          </div>
        </header>

        {/* Velocidade (só em viagem) e autonomia */}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden text-center">
          {viagem ? (
            <p className="text-sm font-medium tabular-nums text-[var(--t-dim)] landscape:hidden">
              <span className="text-2xl font-light text-[var(--t-text)]">
                {viagem.velocidade != null ? num(viagem.velocidade, 0) : "—"}
              </span>{" "}
              km/h
            </p>
          ) : null}

          {semDados ? (
            <>
              <p className="text-[clamp(3.5rem,min(18vw,16dvh),6.5rem)] font-light leading-none">
                —
              </p>
              <p className="max-w-[16rem] text-sm text-[var(--t-dim)]">
                Registre um abastecimento com tanque cheio para calcular a autonomia.
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setCalculo(true)}
              className="flex flex-col items-center gap-1"
              title="Como calculei"
            >
              <span className="text-[clamp(3rem,min(22vw,19dvh),8rem)] font-light leading-none tracking-tight tabular-nums">
                {num(tanque.autonomia ?? 0, 0)}
                <span className="ml-1 text-[0.28em] font-normal text-[var(--t-dim)]">km</span>
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.25em] text-[var(--t-dim)]">
                {tanque.calibrado ? "autonomia" : "autonomia · sem calibração"}
              </span>
            </button>
          )}

          <div className="tesla-car mt-2 w-[min(78%,22rem)] landscape:mt-0 landscape:w-[min(60%,9rem)]">
            <VehicleIllustration
              tipo={getTipoByModeloCompleto(vehicle.modelo)}
              className="h-auto w-full"
            />
          </div>
        </div>

        {/* Combustível, no formato da bateria */}
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Fuel className="size-4" style={{ color: cor }} />
              {semDados ? "—" : `${pct}%`}
            </span>
            <span className="truncate tabular-nums text-[var(--t-dim)]">
              {semDados ? "" : `${num(tanque.litros ?? 0, 1)} L`}
              {vehicle.reservaLitros && !semDados && !tanque.emReserva
                ? ` · ${num(tanque.autonomiaAteReserva ?? 0, 0)} km até a reserva`
                : ""}
            </span>
          </div>
          <div className="tesla-bar" style={{ "--t-fill": cor } as React.CSSProperties}>
            <span style={{ width: `${semDados ? 0 : pct}%` }} />
          </div>
        </div>

        {/* Leituras secundárias */}
        <dl className="grid grid-cols-3 divide-x divide-[var(--t-line)] border-t border-[var(--t-line)] pt-3 text-center landscape:pt-2">
          <Leitura
            valor={tanque.consumoUtilizado ? num(tanque.consumoUtilizado, 1) : "—"}
            unidade="km/l"
          />
          <Leitura valor={(odometro || 0).toLocaleString("pt-BR")} unidade="km total" />
          <Leitura valor={custoPorKm ? brl(custoPorKm) : "—"} unidade="por km" />
        </dl>
      </section>

      {/* Mapa */}
      <section className="relative isolate min-h-0">
        <CockpitMap tema={tema} trilha={trilha} className="absolute inset-0" />

        {tanque.emReserva || tanque.atencao ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-4">
            <p
              className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg"
              style={{ background: tanque.emReserva ? "var(--t-red)" : "#b07d00" }}
            >
              <AlertTriangle className="size-4" />
              {tanque.emReserva ? "Abasteça agora" : "Abastecer em breve"}
            </p>
          </div>
        ) : null}

        {viagem ? (
          <div className="absolute bottom-3 left-3 z-[500] rounded-2xl border border-[var(--t-line)] bg-[var(--t-glass)] px-4 py-3 shadow-xl backdrop-blur-md">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--t-dim)]">
              {viagem.erro ?? "Viagem"}
            </p>
            <p className="mt-0.5 text-2xl font-light tabular-nums">
              {num(viagem.distancia, 1)}
              <span className="ml-1 text-sm text-[var(--t-dim)]">km</span>
              <span className="ml-3 text-base text-[var(--t-dim)]">{duracao(viagem.segundos)}</span>
            </p>
          </div>
        ) : erroGps ? (
          <p className="absolute bottom-3 left-3 z-[500] rounded-xl bg-[var(--t-glass)] px-3 py-2 text-sm text-[var(--t-red)] backdrop-blur-md">
            {erroGps}
          </p>
        ) : null}
      </section>

      {/* Dock */}
      <nav className="flex items-center justify-between gap-0.5 border-t border-[var(--t-line)] bg-[var(--t-bg)] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 landscape:col-span-2 landscape:py-1.5">
        <DockButton label="Abasteci" onClick={() => setAbastecer(true)}>
          <Fuel />
        </DockButton>
        <DockButton label="Odômetro" onClick={() => setAtualizarKm(true)}>
          <Gauge />
        </DockButton>

        {viagem ? (
          <button
            type="button"
            onClick={() => void onEncerrarViagem()}
            className="flex h-12 items-center gap-2 rounded-full border-2 border-[var(--t-red)] px-4 text-sm font-semibold text-[var(--t-red)] landscape:h-11"
          >
            <Square className="size-4 fill-current" /> Encerrar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void iniciarViagem()}
            className="flex h-12 items-center gap-2 rounded-full bg-[var(--t-blue)] px-4 text-sm font-semibold text-white shadow-lg landscape:h-11"
          >
            <Navigation className="size-4 fill-current" /> Viagem
          </button>
        )}

        <DockButton label={tema === "noite" ? "Tema claro" : "Tema escuro"} onClick={alternarTema}>
          {tema === "noite" ? <Sun /> : <Moon />}
        </DockButton>
        <DockButton
          label={modoCarro.ativo ? "Sair da tela cheia" : "Tela cheia, sem apagar"}
          onClick={modoCarro.alternar}
          ativo={modoCarro.ativo}
        >
          {modoCarro.ativo ? <Minimize /> : <Maximize />}
        </DockButton>
        <DockButton label="Detalhes" onClick={onDetalhes}>
          <LayoutList />
        </DockButton>
      </nav>

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

      <Drawer open={calculo} onOpenChange={setCalculo}>
        <DrawerContent className="max-h-[92dvh]">
          <div className="mx-auto w-full max-w-lg overflow-y-auto p-5">
            <DrawerHeader className="p-0 pb-4 text-left">
              <DrawerTitle className="font-display text-xl">Como calculei a autonomia</DrawerTitle>
              <DrawerDescription>
                Desde o último tanque cheio: o que entrou, o que foi rodado e quanto sobrou.
              </DrawerDescription>
            </DrawerHeader>
            <CalculoAutonomia tanque={tanque} />
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
    </div>
  );
}

/** Seletor de marchas P R N D, como no topo da tela do Tesla. */
function Marchas({ ativa }: { ativa: "P" | "D" }) {
  return (
    <span
      className="flex gap-2.5 text-base font-semibold tracking-wide"
      aria-label={`Marcha ${ativa}`}
    >
      {(["P", "R", "N", "D"] as const).map((m) => (
        <span
          key={m}
          className={m === ativa ? "text-[var(--t-text)]" : "text-[var(--t-dim)] opacity-50"}
        >
          {m}
        </span>
      ))}
    </span>
  );
}

function Leitura({ valor, unidade }: { valor: string; unidade: string }) {
  return (
    <div className="min-w-0 px-1">
      <dd className="truncate text-lg font-normal tabular-nums">{valor}</dd>
      <dt className="truncate text-xs text-[var(--t-dim)]">{unidade}</dt>
    </div>
  );
}

function DockButton({
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
      className={`grid size-11 shrink-0 place-items-center rounded-xl transition-colors [&_svg]:size-6 ${
        ativo
          ? "bg-[var(--t-elev)] text-[var(--t-blue)]"
          : "text-[var(--t-dim)] hover:bg-[var(--t-elev)] hover:text-[var(--t-text)]"
      }`}
    >
      {children}
    </button>
  );
}

function duracao(segundos: number) {
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

/**
 * Tema do painel: noite ou dia. Começa pela hora (6h–18h é dia), como o
 * Tesla troca com os faróis; a escolha manual fica lembrada no aparelho.
 */
function useTema(): ["dia" | "noite", () => void] {
  const [tema, setTema] = useState<"dia" | "noite">("noite");
  useEffect(() => {
    let salvo: string | null = null;
    try {
      salvo = localStorage.getItem("abastece:tema-painel");
    } catch {
      // sem storage: segue pela hora
    }
    if (salvo === "dia" || salvo === "noite") return setTema(salvo);
    const h = new Date().getHours();
    setTema(h >= 6 && h < 18 ? "dia" : "noite");
  }, []);
  function alternar() {
    const novo = tema === "noite" ? "dia" : "noite";
    setTema(novo);
    try {
      localStorage.setItem("abastece:tema-painel", novo);
    } catch {
      // ignora
    }
  }
  return [tema, alternar];
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
