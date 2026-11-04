import type * as Leaflet from "leaflet";
import {
  buscarPostos,
  lerCachePostos,
  salvarCachePostos,
  type Bandeira,
  type Bbox,
  type Posto,
} from "@/lib/postos";

/** Cores e emblema simplificado de cada bandeira (desenhado em SVG 40×40). */
const LOGOS: Record<Bandeira, { cor: string; borda: string; svg: string }> = {
  petrobras: {
    cor: "#00843d",
    borda: "#005c2a",
    svg: `<text x="20" y="27" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="19" fill="#ffd400">BR</text>`,
  },
  ipiranga: {
    cor: "#ffd100",
    borda: "#c9a300",
    svg: `<rect x="7" y="13" width="26" height="14" rx="7" fill="#0057a8"/><text x="20" y="24.5" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="10" fill="#ffd100">IPI</text>`,
  },
  shell: {
    cor: "#ffd500",
    borda: "#dd1d21",
    svg: `<path d="M20 30 L9 19 A12 12 0 0 1 31 19 Z" fill="#dd1d21"/><g stroke="#ffd500" stroke-width="1.6" stroke-linecap="round"><line x1="20" y1="29" x2="20" y2="9"/><line x1="20" y1="29" x2="13" y2="12"/><line x1="20" y1="29" x2="27" y2="12"/><line x1="20" y1="29" x2="10" y2="17"/><line x1="20" y1="29" x2="30" y2="17"/></g><rect x="14" y="29" width="12" height="3" rx="1" fill="#dd1d21"/>`,
  },
  ale: {
    cor: "#0a3d91",
    borda: "#062a66",
    svg: `<text x="20" y="26" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="15" fill="#fff">ale</text><rect x="10" y="29" width="20" height="2.5" rx="1" fill="#f58220"/>`,
  },
  texaco: {
    cor: "#e21b23",
    borda: "#111",
    svg: `<circle cx="20" cy="20" r="12" fill="#fff"/><path d="M20 10.5l2.6 6.5h6.9l-5.6 4.2 2.1 6.7L20 23.8l-6 4.1 2.1-6.7-5.6-4.2h6.9z" fill="#e21b23"/>`,
  },
  rodoil: {
    cor: "#d71920",
    borda: "#8f0f14",
    svg: `<text x="20" y="25" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="10" fill="#fff">RODOIL</text>`,
  },
  total: {
    cor: "#ffffff",
    borda: "#ed0000",
    svg: `<circle cx="20" cy="20" r="10" fill="none" stroke="#ed0000" stroke-width="3"/><circle cx="20" cy="20" r="5" fill="#0055a4"/><path d="M12 26 A10 10 0 0 0 28 26" stroke="#f7a600" stroke-width="3" fill="none"/>`,
  },
  esso: {
    cor: "#ffffff",
    borda: "#0c2a8a",
    svg: `<ellipse cx="20" cy="20" rx="14" ry="9" fill="none" stroke="#0c2a8a" stroke-width="2.5"/><text x="20" y="24" text-anchor="middle" font-family="Arial Black,Arial" font-weight="900" font-size="10" fill="#e3000f">Esso</text>`,
  },
  outra: {
    cor: "#334155",
    borda: "#1e293b",
    svg: `<g fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"><rect x="11" y="10" width="12" height="20" rx="1.5"/><line x1="11" y1="18" x2="23" y2="18"/><path d="M23 14h3l3 3v9a2 2 0 0 1-4 0v-4h-2"/></g>`,
  },
};

const ZOOM_MIN = 13;

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function iconeHtml(p: Posto) {
  const l = LOGOS[p.bandeira];
  return `<div class="posto3d" style="--cor:${l.cor};--borda:${l.borda}">
    <div class="posto3d__sombra"></div>
    <div class="posto3d__haste"></div>
    <div class="posto3d__disco"><svg viewBox="0 0 40 40" width="30" height="30">${l.svg}</svg></div>
    ${p.aberto24h ? '<span class="posto3d__24h">24h</span>' : ""}
  </div>`;
}

function popupHtml(p: Posto) {
  const rota = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`;
  return `<div class="posto-popup">
    <strong>${esc(p.nome)}</strong>
    ${p.marca && p.marca !== p.nome ? `<span>${esc(p.marca)}</span>` : ""}
    ${p.endereco ? `<span>${esc(p.endereco)}</span>` : ""}
    ${p.aberto24h ? "<span>Aberto 24h</span>" : ""}
    <a href="${rota}" target="_blank" rel="noopener">Rota no Google Maps ↗</a>
  </div>`;
}

/**
 * Camada de postos com logo 3D. Busca os postos da área visível sempre que o
 * mapa para de mexer (a partir do zoom 13) e mantém os já carregados.
 */
export function criarCamadaPostos(L: typeof Leaflet, map: Leaflet.Map) {
  const grupo = L.layerGroup().addTo(map);
  const marcadores = new Map<string, Leaflet.Marker>();
  let coberto: Leaflet.LatLngBounds | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let ctrl: AbortController | null = null;
  let falhas = 0;

  function adicionar(postos: Posto[]) {
    for (const p of postos) {
      if (marcadores.has(p.id)) continue;
      const m = L.marker([p.lat, p.lng], {
        icon: L.divIcon({
          className: "posto3d-icon",
          html: iconeHtml(p),
          iconSize: [44, 60],
          iconAnchor: [22, 56],
          popupAnchor: [0, -50],
        }),
        title: p.nome,
        riseOnHover: true,
      }).bindPopup(popupHtml(p));
      m.addTo(grupo);
      marcadores.set(p.id, m);
    }
  }

  // Mostra na hora os postos já conhecidos; a rede só completa/atualiza.
  adicionar(lerCachePostos());

  function atualizarVisibilidade() {
    if (map.getZoom() >= ZOOM_MIN) {
      if (!map.hasLayer(grupo)) grupo.addTo(map);
    } else grupo.remove();
  }

  async function carregar() {
    atualizarVisibilidade();
    if (map.getZoom() < ZOOM_MIN) return;
    const vis = map.getBounds();
    if (coberto?.contains(vis)) return;
    const area = vis.pad(0.5);
    const b: Bbox = {
      s: area.getSouth(),
      w: area.getWest(),
      n: area.getNorth(),
      e: area.getEast(),
    };
    ctrl?.abort();
    const c = new AbortController();
    ctrl = c;
    try {
      const postos = await buscarPostos(b, c.signal);
      coberto = area;
      falhas = 0;
      adicionar(postos);
      const ids = new Set(postos.map((p) => p.id));
      salvarCachePostos([...lerCachePostos().filter((p) => !ids.has(p.id)), ...postos]);
    } catch {
      // Servidores Overpass sobrecarregados: tenta de novo com espera crescente.
      if (c.signal.aborted || falhas >= 4) return;
      falhas += 1;
      clearTimeout(timer);
      timer = setTimeout(carregar, 2000 * 2 ** falhas);
    }
  }

  function agendar() {
    falhas = 0;
    clearTimeout(timer);
    timer = setTimeout(carregar, 500);
  }

  map.on("moveend zoomend", agendar);
  agendar();

  return () => {
    clearTimeout(timer);
    ctrl?.abort();
    map.off("moveend zoomend", agendar);
    grupo.remove();
  };
}
