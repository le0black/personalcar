import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";

type Props = {
  tema: "dia" | "noite";
  /** Trajeto da viagem em andamento (vazio quando parada). */
  trilha: LatLng[];
  className?: string;
};

/** Base OpenStreetMap; o tom escuro/claro do Tesla vem de filtro CSS (.tesla-map). */
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const AZUL = "#3e6ae1";

/**
 * Mapa do painel, no estilo da navegação do Tesla: base escura (ou clara de
 * dia, em cinza), posição em azul e o trajeto da viagem desenhado por cima.
 */
export function CockpitMap({ tema, trilha, className }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const lineRef = useRef<import("leaflet").Polyline | null>(null);
  const haloRef = useRef<import("leaflet").CircleMarker | null>(null);
  const dotRef = useRef<import("leaflet").CircleMarker | null>(null);

  function mover(ll: LatLng) {
    const map = mapRef.current;
    if (!map) return;
    haloRef.current?.setLatLng(ll).addTo(map);
    dotRef.current?.setLatLng(ll).addTo(map);
    map.setView(ll, Math.max(map.getZoom(), 16), { animate: true });
  }

  // Cria o mapa (Leaflet só no cliente) e centraliza na posição atual.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const mod = await import("leaflet");
      const L = mod.default ?? mod;
      if (cancelado || !elRef.current || mapRef.current) return;
      const map = L.map(elRef.current, { zoomControl: false, attributionControl: true }).setView(
        [-14.24, -51.93],
        4,
      );
      L.tileLayer(TILES, { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
      lineRef.current = L.polyline([], { color: AZUL, weight: 6, opacity: 0.9 }).addTo(map);
      haloRef.current = L.circleMarker([0, 0], {
        radius: 16,
        stroke: false,
        fillColor: AZUL,
        fillOpacity: 0.18,
      });
      dotRef.current = L.circleMarker([0, 0], {
        radius: 7,
        color: "#ffffff",
        weight: 3,
        fillColor: AZUL,
        fillOpacity: 1,
      });
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
      navigator.geolocation?.getCurrentPosition(
        (p) => mover([p.coords.latitude, p.coords.longitude]),
        () => {},
        { enableHighAccuracy: true, timeout: 8000 },
      );
    })();
    return () => {
      cancelado = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Desenha o trajeto e segue a posição.
  useEffect(() => {
    lineRef.current?.setLatLngs(trilha);
    const ultimo = trilha[trilha.length - 1];
    if (ultimo) mover(ultimo);
  }, [trilha]);

  // O tamanho muda ao girar o celular.
  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => mapRef.current?.invalidateSize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return <div ref={elRef} className={`tesla-map ${className ?? ""}`} data-tema={tema} />;
}
