import { useCallback, useEffect, useRef, useState } from "react";
import { haversineKm, type LatLng } from "@/lib/geo";

/** Precisão mínima aceita (m); leituras piores são descartadas. */
const PRECISAO_MAX_M = 50;
/** Deslocamento mínimo entre pontos (km): abaixo disso é ruído com o carro parado. */
const PASSO_MIN_KM = 0.005;
/** Velocidade implícita acima disso é salto de GPS, não deslocamento real. */
const VELOCIDADE_MAX_KMH = 220;

const CHAVE = "abastece:viagem";

export type ViagemSalva = {
  vehicleId: string;
  /** Odômetro no início da viagem. */
  base: number;
  distancia: number;
  inicio: number;
};

function lerSalva(): ViagemSalva | null {
  try {
    const raw = localStorage.getItem(CHAVE);
    return raw ? (JSON.parse(raw) as ViagemSalva) : null;
  } catch {
    return null;
  }
}

function gravar(v: ViagemSalva | null) {
  try {
    if (v) localStorage.setItem(CHAVE, JSON.stringify(v));
    else localStorage.removeItem(CHAVE);
  } catch {
    // Sem storage (aba privada): a viagem só não sobrevive a um recarregamento.
  }
}

/**
 * Rastreia uma viagem pelo GPS e soma a distância percorrida. A viagem em
 * andamento fica salva no aparelho, então um recarregamento da página (ou o
 * navegador matar a aba) não perde os km: ao voltar, o rastreamento continua.
 */
export function useViagemGps(opts: { onPonto?: (pt: LatLng) => void } = {}) {
  const [viagem, setViagem] = useState<ViagemSalva | null>(null);
  const [velocidade, setVelocidade] = useState<number | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const viagemRef = useRef<ViagemSalva | null>(null);
  const ultimoRef = useRef<{ pt: LatLng; t: number } | null>(null);
  const watchRef = useRef<number | null>(null);
  const onPontoRef = useRef(opts.onPonto);
  onPontoRef.current = opts.onPonto;

  const onPos = useCallback((pos: GeolocationPosition) => {
    const atual = viagemRef.current;
    if (!atual) return;
    setErro(null);
    if (pos.coords.speed != null && pos.coords.speed >= 0) {
      setVelocidade(pos.coords.speed * 3.6);
    }
    if (pos.coords.accuracy > PRECISAO_MAX_M) return;

    const pt: LatLng = [pos.coords.latitude, pos.coords.longitude];
    const prev = ultimoRef.current;
    if (prev) {
      const d = haversineKm(prev.pt, pt);
      if (d < PASSO_MIN_KM) return;
      const horas = (pos.timestamp - prev.t) / 3_600_000;
      if (horas > 0 && d / horas > VELOCIDADE_MAX_KMH) return;
      const nova = { ...atual, distancia: atual.distancia + d };
      viagemRef.current = nova;
      setViagem(nova);
      gravar(nova);
    }
    ultimoRef.current = { pt, t: pos.timestamp };
    onPontoRef.current?.(pt);
  }, []);

  const assistir = useCallback(() => {
    if (watchRef.current != null) return;
    ultimoRef.current = null;
    watchRef.current = navigator.geolocation.watchPosition(
      onPos,
      (e) =>
        setErro(e.code === e.PERMISSION_DENIED ? "Permita o acesso à localização." : e.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  }, [onPos]);

  const soltar = useCallback(() => {
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    watchRef.current = null;
    ultimoRef.current = null;
    setVelocidade(null);
  }, []);

  // Retoma uma viagem que estava em andamento antes do recarregamento.
  useEffect(() => {
    const salva = lerSalva();
    if (salva && navigator.geolocation) {
      viagemRef.current = salva;
      setViagem(salva);
      assistir();
    }
    return soltar;
  }, [assistir, soltar]);

  // Cronômetro da viagem.
  useEffect(() => {
    if (!viagem) return;
    const tick = () => setSegundos(Math.floor((Date.now() - viagem.inicio) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [viagem?.inicio]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Começa uma viagem a partir do odômetro informado. Retorna false sem GPS. */
  const iniciar = useCallback(
    (vehicleId: string, base: number) => {
      if (!navigator.geolocation) {
        setErro("Este dispositivo/navegador não tem GPS disponível.");
        return false;
      }
      soltar();
      const nova: ViagemSalva = { vehicleId, base, distancia: 0, inicio: Date.now() };
      viagemRef.current = nova;
      setViagem(nova);
      setSegundos(0);
      gravar(nova);
      assistir();
      return true;
    },
    [assistir, soltar],
  );

  /** Encerra a viagem e devolve o que foi percorrido. */
  const encerrar = useCallback((): ViagemSalva | null => {
    soltar();
    const fim = viagemRef.current;
    viagemRef.current = null;
    setViagem(null);
    gravar(null);
    return fim;
  }, [soltar]);

  return { viagem, velocidade, segundos, erro, iniciar, encerrar };
}
