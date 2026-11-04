/**
 * Postos de combustível próximos, vindos do OpenStreetMap (Overpass API),
 * com a bandeira (marca) normalizada para desenhar o logo no mapa.
 */

export type Bandeira =
  "petrobras" | "ipiranga" | "shell" | "ale" | "texaco" | "rodoil" | "total" | "esso" | "outra";

export type Posto = {
  id: string;
  lat: number;
  lng: number;
  nome: string;
  bandeira: Bandeira;
  marca: string | null;
  endereco: string | null;
  aberto24h: boolean;
};

export type Bbox = { s: number; w: number; n: number; e: number };

const ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

const REGRAS: [RegExp, Bandeira][] = [
  [/petrobras|\bbr\b|vibra/i, "petrobras"],
  [/ipiranga/i, "ipiranga"],
  [/shell|ra[ií]zen/i, "shell"],
  [/\bale\b/i, "ale"],
  [/texaco/i, "texaco"],
  [/rodoil/i, "rodoil"],
  [/total/i, "total"],
  [/esso/i, "esso"],
];

export function bandeiraDe(...textos: (string | undefined)[]): Bandeira {
  for (const t of textos) {
    if (!t) continue;
    for (const [re, b] of REGRAS) if (re.test(t)) return b;
  }
  return "outra";
}

type OverpassEl = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Partial<
    Record<
      | "name"
      | "brand"
      | "operator"
      | "opening_hours"
      | "addr:street"
      | "addr:housenumber"
      | "addr:city",
      string
    >
  >;
};

function converter(el: OverpassEl): Posto[] {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return [];
  const t = el.tags ?? {};
  const marca = t.brand ?? t.operator ?? null;
  const rua = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", ");
  return [
    {
      id: `${el.type}/${el.id}`,
      lat,
      lng,
      nome: t.name ?? marca ?? "Posto de combustível",
      bandeira: bandeiraDe(t.brand, t.operator, t.name),
      marca,
      endereco: rua || t["addr:city"] || null,
      aberto24h: t.opening_hours === "24/7",
    },
  ];
}

async function consultar(url: string, q: string, signal: AbortSignal): Promise<Posto[]> {
  const r = await fetch(url, {
    method: "POST",
    body: "data=" + encodeURIComponent(q),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    signal,
  });
  if (!r.ok) throw new Error(`Overpass ${r.status}`);
  const json = (await r.json()) as { elements: OverpassEl[] };
  return json.elements.flatMap(converter);
}

/**
 * Consulta todos os servidores Overpass em paralelo e fica com a primeira
 * resposta boa (os públicos vivem sobrecarregados); desiste após 25 s.
 */
export async function buscarPostos(b: Bbox, signal?: AbortSignal): Promise<Posto[]> {
  const q = `[out:json][timeout:20];nwr["amenity"="fuel"](${b.s},${b.w},${b.n},${b.e});out center tags 300;`;
  const ctrl = new AbortController();
  const cancelar = () => ctrl.abort();
  signal?.addEventListener("abort", cancelar);
  const limite = setTimeout(cancelar, 25_000);
  try {
    return await Promise.any(ENDPOINTS.map((u) => consultar(u, q, ctrl.signal)));
  } finally {
    clearTimeout(limite);
    signal?.removeEventListener("abort", cancelar);
    ctrl.abort();
  }
}

const CACHE = "abastece:postos";
const CACHE_MAX = 1500;

/** Postos já vistos, guardados no aparelho para aparecerem sem esperar a rede. */
export function lerCachePostos(): Posto[] {
  try {
    const raw = localStorage.getItem(CACHE);
    return raw ? (JSON.parse(raw) as Posto[]) : [];
  } catch {
    return [];
  }
}

export function salvarCachePostos(postos: Posto[]) {
  try {
    localStorage.setItem(CACHE, JSON.stringify(postos.slice(-CACHE_MAX)));
  } catch {
    /* armazenamento indisponível */
  }
}
