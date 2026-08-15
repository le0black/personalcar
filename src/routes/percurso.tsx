import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Gauge, MapPin, Play, Square } from "lucide-react";
import { toast, Toaster } from "sonner";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/components/auth/AuthGate";
import { fetchRefuels, fetchVehicles, updateOdometro } from "@/lib/db";
import { haversineKm, type LatLng } from "@/lib/geo";
import { num, type Vehicle } from "@/lib/fuel-data";

export const Route = createFileRoute("/percurso")({
  head: () => ({
    meta: [{ title: "Percurso GPS — Abastece" }],
  }),
  component: PercursoRoute,
});

function PercursoRoute() {
  return (
    <AuthGate>
      <Percurso />
      <Toaster richColors position="top-center" />
    </AuthGate>
  );
}

function Percurso() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [basePorVeiculo, setBasePorVeiculo] = useState<Record<string, number>>({});
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const [tracking, setTracking] = useState(false);
  const [distancia, setDistancia] = useState(0);
  const [pontosCount, setPontosCount] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [salvo, setSalvo] = useState(false);

  const mapElRef = useRef<HTMLDivElement>(null);
  // Refs de Leaflet e do rastreamento (evitam closures obsoletas no watchPosition).
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const lineRef = useRef<import("leaflet").Polyline | null>(null);
  const markerRef = useRef<import("leaflet").CircleMarker | null>(null);
  const pontosRef = useRef<LatLng[]>([]);
  const distRef = useRef(0);
  const watchRef = useRef<number | null>(null);
  const inicioRef = useRef<number>(0);

  // Carrega veículos e calcula o odômetro base (persistido ou último abastecimento).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [vs, rs] = await Promise.all([fetchVehicles(), fetchRefuels()]);
        if (!ativo) return;
        const base: Record<string, number> = {};
        for (const v of vs) {
          const maxRefuel = rs
            .filter((r) => r.vehicleId === v.id)
            .reduce((m, r) => Math.max(m, r.odometro), 0);
          base[v.id] = v.odometroAtual ?? maxRefuel;
        }
        setVehicles(vs);
        setBasePorVeiculo(base);
        setVehicleId((cur) => cur ?? vs[0]?.id ?? null);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao carregar veículos.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Inicializa o mapa (Leaflet só no cliente).
  // Depende de `carregando` porque o container do mapa só entra no DOM
  // depois que os veículos carregam.
  useEffect(() => {
    if (carregando) return;
    let cancelado = false;
    (async () => {
      const mod = await import("leaflet");
      const L = mod.default ?? mod;
      if (cancelado || !mapElRef.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(mapElRef.current, { zoomControl: true }).setView([-14.24, -51.93], 4);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      lineRef.current = L.polyline([], { color: "#f5a623", weight: 5, opacity: 0.9 }).addTo(map);
      markerRef.current = L.circleMarker([-14.24, -51.93], {
        radius: 7,
        color: "#ffffff",
        weight: 2,
        fillColor: "#f5a623",
        fillOpacity: 1,
      });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
      // Centraliza na posição atual, se permitido.
      navigator.geolocation?.getCurrentPosition(
        (p) => {
          const ll: LatLng = [p.coords.latitude, p.coords.longitude];
          map.setView(ll, 16);
          markerRef.current?.setLatLng(ll).addTo(map);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      );
    })();
    return () => {
      cancelado = true;
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [carregando]);

  // Cronômetro enquanto rastreia.
  useEffect(() => {
    if (!tracking) return;
    const t = setInterval(() => {
      setSegundos(Math.floor((Date.now() - inicioRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [tracking]);

  function onPos(pos: GeolocationPosition) {
    const pt: LatLng = [pos.coords.latitude, pos.coords.longitude];
    if (pos.coords.accuracy > 50) return; // ignora leitura muito imprecisa
    const prev = pontosRef.current[pontosRef.current.length - 1];
    if (prev) {
      const d = haversineKm(prev, pt);
      if (d < 0.005) return; // <5 m: ruído parado
      distRef.current += d;
      setDistancia(distRef.current);
    }
    pontosRef.current.push(pt);
    setPontosCount(pontosRef.current.length);
    lineRef.current?.addLatLng(pt);
    const map = mapRef.current;
    if (map) {
      markerRef.current?.setLatLng(pt).addTo(map);
      map.setView(pt, Math.max(map.getZoom(), 16));
    }
  }

  function iniciar() {
    if (!navigator.geolocation) {
      toast.error("Este dispositivo/navegador não tem GPS disponível.");
      return;
    }
    pontosRef.current = [];
    distRef.current = 0;
    lineRef.current?.setLatLngs([]);
    setDistancia(0);
    setPontosCount(0);
    setSegundos(0);
    setSalvo(false);
    inicioRef.current = Date.now();
    setTracking(true);
    watchRef.current = navigator.geolocation.watchPosition(
      onPos,
      (e) => toast.error(`GPS: ${e.message}`),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  }

  function parar() {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    setTracking(false);
  }

  async function somarNoOdometro() {
    const v = vehicles.find((x) => x.id === vehicleId);
    if (!v) return;
    const base = v.odometroAtual ?? basePorVeiculo[v.id] ?? 0;
    const novo = Math.round(base + distRef.current);
    try {
      const salvoV = await updateOdometro(v.id, novo);
      setVehicles((prev) => prev.map((x) => (x.id === v.id ? salvoV : x)));
      setSalvo(true);
      toast.success(`Odômetro do ${v.nome} atualizado para ${novo.toLocaleString("pt-BR")} km.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível atualizar o odômetro.");
    }
  }

  const vehicle = vehicles.find((v) => v.id === vehicleId) ?? null;
  const base = vehicle ? (vehicle.odometroAtual ?? basePorVeiculo[vehicle.id] ?? 0) : 0;
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  const temPercurso = distancia > 0 && !tracking;

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Voltar"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate font-display text-xl font-bold tracking-tight">Percurso GPS</h1>
          <p className="truncate text-xs text-muted-foreground">
            Rastreie a distância pelo GPS e some ao odômetro
          </p>
        </div>
      </header>

      {carregando ? (
        <p className="panel mt-6 p-6 text-sm text-muted-foreground">Carregando…</p>
      ) : vehicles.length === 0 ? (
        <div className="panel mt-6 p-6 text-center text-sm text-muted-foreground">
          Cadastre um veículo primeiro.{" "}
          <Link to="/" className="font-medium text-primary hover:underline">
            Voltar ao painel
          </Link>
        </div>
      ) : (
        <>
          {/* Seleção de veículo */}
          <div className="mt-6 flex flex-wrap items-center gap-1 rounded-full border border-border bg-card p-1">
            {vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => !tracking && setVehicleId(v.id)}
                disabled={tracking}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${
                  v.id === vehicleId
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v.nome}
              </button>
            ))}
          </div>

          {/* Mapa */}
          <div className="panel mt-4 overflow-hidden p-0">
            <div ref={mapElRef} className="h-[46vh] min-h-[300px] w-full bg-secondary" />
          </div>

          {/* Painel de controle */}
          <section className="panel mt-4 p-5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Distância" value={`${num(distancia, 2)} km`} destaque />
              <Metric label="Pontos GPS" value={String(pontosCount)} />
              <Metric label="Tempo" value={`${mm}:${ss}`} />
            </div>

            <div className="mt-5">
              {!tracking ? (
                <Button onClick={iniciar} className="h-12 w-full text-base font-semibold">
                  <Play className="mr-2 size-5" /> Iniciar rastreamento
                </Button>
              ) : (
                <Button
                  onClick={parar}
                  variant="destructive"
                  className="h-12 w-full text-base font-semibold"
                >
                  <Square className="mr-2 size-5" /> Encerrar percurso
                </Button>
              )}
            </div>

            {temPercurso ? (
              <div className="mt-4 rounded-xl border border-border bg-card/50 p-4">
                {vehicle ? (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="size-4 shrink-0 text-primary" />
                    <span className="numeral">
                      {base.toLocaleString("pt-BR")} km + {num(distancia, 2)} ={" "}
                      <strong className="text-foreground">
                        {Math.round(base + distancia).toLocaleString("pt-BR")} km
                      </strong>
                    </span>
                  </p>
                ) : null}
                <Button
                  onClick={somarNoOdometro}
                  disabled={salvo}
                  className="mt-3 w-full font-semibold"
                >
                  <MapPin className="mr-2 size-4" />
                  {salvo
                    ? "Odômetro atualizado ✓"
                    : `Somar ${num(distancia, 1)} km ao odômetro do ${vehicle?.nome ?? "veículo"}`}
                </Button>
              </div>
            ) : (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Toque em iniciar e permita o acesso à localização. Funciona melhor no celular, com a
                tela ligada.
              </p>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Metric({ label, value, destaque }: { label: string; value: string; destaque?: boolean }) {
  return (
    <div>
      <p
        className={`numeral font-display font-bold ${destaque ? "text-2xl text-primary" : "text-2xl"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
