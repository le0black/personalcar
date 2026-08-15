/**
 * Banco de dados de veículos — carros e motos do mercado brasileiro.
 * Cobertura: modelos de fabricação/comercialização de 1970 até hoje (2026).
 *
 * Estrutura: marca -> modelo -> faixa de anos -> combustíveis -> tanque.
 * anoFim = null significa que o modelo ainda é produzido/comercializado.
 * As faixas de ano são aproximadas para alguns modelos antigos.
 *
 * Como usar (ex.: montar selects de marca/modelo/ano):
 *   getMarcas("carro")            -> lista de marcas
 *   getModelos("Volkswagen")      -> modelos da marca
 *   getAnos("Volkswagen", "Gol")  -> anos disponíveis (desc)
 *   findModelo("Volkswagen","Gol")-> metadados (combustíveis, tanque, etc.)
 */

import type { FuelType } from "@/lib/fuel-data";

export type VehicleCategory = "carro" | "moto";

export type VehicleModel = {
  marca: string;
  modelo: string;
  categoria: VehicleCategory;
  /** Primeiro ano-modelo conhecido. */
  anoInicio: number;
  /** Último ano-modelo; null = ainda em linha. */
  anoFim: number | null;
  /** Combustíveis de fábrica mais comuns para o modelo. */
  combustiveis: FuelType[];
  /** Capacidade típica do tanque em litros (aproximada). */
  tanque?: number;
};

/** O ano-modelo mais recente considerado "hoje". */
export const ANO_ATUAL = 2026;

// ── Atalhos de combustível ────────────────────────────────────────────────
const G: FuelType[] = ["Gasolina"];
const E: FuelType[] = ["Etanol"];
const D: FuelType[] = ["Diesel"];
const FLEX: FuelType[] = ["Gasolina", "Etanol"];
const GD: FuelType[] = ["Gasolina", "Diesel"];
const GGNV: FuelType[] = ["Gasolina", "GNV"];
const FLEXGNV: FuelType[] = ["Gasolina", "Etanol", "GNV"];
const GE: FuelType[] = ["Gasolina", "Etanol"]; // gasolina ou etanol (carburados antigos)

// ── Builder compacto ──────────────────────────────────────────────────────
// [modelo, anoInicio, anoFim(null=atual), combustiveis, tanque?]
type Row = [string, number, number | null, FuelType[], number?];

function marca(nome: string, categoria: VehicleCategory, rows: Row[]): VehicleModel[] {
  return rows.map(([modelo, anoInicio, anoFim, combustiveis, tanque]) => {
    const v: VehicleModel = { marca: nome, modelo, categoria, anoInicio, anoFim, combustiveis };
    if (tanque !== undefined) v.tanque = tanque;
    return v;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
//  CARROS
// ═══════════════════════════════════════════════════════════════════════════

const CARROS: VehicleModel[] = [
  ...marca("Volkswagen", "carro", [
    ["Fusca", 1959, 1996, GE, 40],
    ["Brasília", 1973, 1982, G, 42],
    ["Variant", 1970, 1980, G, 45],
    ["TL", 1970, 1975, G, 45],
    ["SP2", 1972, 1976, G, 45],
    ["Passat", 1974, 1988, G, 50],
    ["Gol", 1980, 2023, FLEX, 55],
    ["Voyage", 1981, null, FLEX, 55],
    ["Parati", 1982, 2012, FLEX, 55],
    ["Saveiro", 1982, null, FLEX, 55],
    ["Santana", 1984, 2006, GGNV, 70],
    ["Quantum", 1985, 2002, G, 70],
    ["Apollo", 1990, 1992, G, 55],
    ["Logus", 1993, 1996, G, 55],
    ["Pointer", 1994, 1996, G, 55],
    ["Polo", 1996, null, FLEX, 52],
    ["Polo Sedan / Virtus", 2003, null, FLEX, 52],
    ["Golf", 1994, 2019, FLEX, 55],
    ["Bora", 2000, 2011, FLEX, 55],
    ["Fox", 2003, 2021, FLEX, 50],
    ["CrossFox", 2005, 2017, FLEX, 50],
    ["SpaceFox", 2006, 2019, FLEX, 55],
    ["Jetta", 2007, null, G, 55],
    ["Amarok", 2010, null, D, 80],
    ["up!", 2014, 2021, FLEX, 50],
    ["Tiguan", 2009, null, G, 60],
    ["T-Cross", 2019, null, FLEX, 52],
    ["Nivus", 2020, null, FLEX, 52],
    ["Taos", 2021, null, G, 60],
    ["Virtus", 2017, null, FLEX, 52],
  ]),

  ...marca("Fiat", "carro", [
    ["147", 1976, 1986, GE, 48],
    ["Panorama", 1980, 1986, G, 48],
    ["Oggi", 1983, 1986, G, 48],
    ["Uno", 1984, 2013, FLEX, 48],
    ["Uno (novo)", 2010, 2021, FLEX, 48],
    ["Prêmio", 1985, 1995, G, 48],
    ["Elba", 1986, 1996, G, 48],
    ["Tempra", 1992, 1999, GGNV, 63],
    ["Tipo", 1993, 1997, G, 63],
    ["Tipo (novo)", 2024, null, G, 50],
    ["Palio", 1996, 2017, FLEX, 48],
    ["Palio Weekend", 1997, 2020, FLEX, 51],
    ["Siena", 1997, 2016, FLEX, 48],
    ["Grand Siena", 2012, 2021, FLEX, 48],
    ["Brava", 1999, 2003, G, 60],
    ["Marea", 1998, 2007, GGNV, 60],
    ["Doblò", 2001, 2022, FLEX, 60],
    ["Stilo", 2002, 2011, G, 58],
    ["Idea", 2005, 2016, FLEX, 48],
    ["Punto", 2007, 2017, FLEX, 48],
    ["Linea", 2008, 2016, FLEX, 55],
    ["Bravo", 2010, 2016, FLEX, 58],
    ["Strada", 1998, null, FLEX, 55],
    ["Toro", 2016, null, FLEX, 60],
    ["Mobi", 2016, null, FLEX, 47],
    ["Argo", 2017, null, FLEX, 48],
    ["Cronos", 2018, null, FLEX, 48],
    ["Fastback", 2022, null, FLEX, 47],
    ["Pulse", 2021, null, FLEX, 47],
    ["Fiorino", 1988, null, FLEX, 58],
    ["500", 2009, 2019, G, 35],
  ]),

  ...marca("Chevrolet", "carro", [
    ["Opala", 1968, 1992, GE, 68],
    ["Caravan", 1975, 1992, GE, 68],
    ["Chevette", 1973, 1993, GE, 50],
    ["Marajó", 1980, 1989, G, 50],
    ["Chevy 500", 1983, 1995, G, 50],
    ["Monza", 1982, 1996, GE, 56],
    ["Kadett", 1989, 1998, G, 52],
    ["Ipanema", 1990, 1998, G, 52],
    ["Omega", 1992, 1998, GGNV, 75],
    ["Vectra", 1993, 2011, FLEX, 60],
    ["Corsa", 1994, 2012, FLEX, 50],
    ["Astra", 1998, 2011, FLEX, 60],
    ["Celta", 2000, 2015, FLEX, 45],
    ["Meriva", 2002, 2012, FLEX, 54],
    ["Montana", 2003, 2022, FLEX, 54],
    ["Prisma", 2006, 2019, FLEX, 54],
    ["Agile", 2009, 2014, FLEX, 54],
    ["Cobalt", 2011, 2019, FLEX, 54],
    ["Onix", 2012, null, FLEX, 44],
    ["Onix Plus", 2019, null, FLEX, 44],
    ["Spin", 2012, null, FLEX, 53],
    ["Tracker", 2013, null, G, 44],
    ["Cruze", 2011, null, FLEX, 60],
    ["S10", 1995, null, D, 76],
    ["Blazer", 1995, 2011, GD, 76],
    ["Trailblazer", 2012, null, D, 76],
    ["Equinox", 2017, null, G, 59],
    ["Camaro", 2010, null, G, 72],
    ["Zafira", 2001, 2012, FLEX, 58],
  ]),

  ...marca("Ford", "carro", [
    ["Corcel", 1968, 1986, GE, 55],
    ["Maverick", 1973, 1979, G, 74],
    ["Belina", 1970, 1991, GE, 55],
    ["Del Rey", 1981, 1991, GE, 55],
    ["Escort", 1983, 2002, GE, 55],
    ["Verona", 1989, 1996, G, 55],
    ["Versailles", 1991, 1996, G, 68],
    ["Ka", 1997, 2021, FLEX, 42],
    ["Fiesta", 1996, 2019, FLEX, 45],
    ["EcoSport", 2003, 2021, FLEX, 55],
    ["Focus", 2000, 2019, FLEX, 55],
    ["Fusion", 2006, 2020, G, 66],
    ["Ranger", 1998, null, D, 80],
    ["Territory", 2020, null, G, 57],
    ["Bronco Sport", 2021, null, G, 60],
    ["Maverick (picape)", 2022, null, G, 60],
    ["Mustang", 2018, null, G, 60],
    ["Edge", 2011, 2020, G, 68],
    ["Courier", 1998, 2013, G, 55],
    ["F-1000", 1979, 1998, D, 90],
    ["F-250", 1999, 2012, D, 90],
  ]),

  ...marca("Renault", "carro", [
    ["Clio", 1996, 2016, FLEX, 50],
    ["Scénic", 1999, 2010, G, 60],
    ["Mégane", 1998, 2011, G, 60],
    ["Kangoo", 1999, 2020, FLEX, 60],
    ["Symbol", 2009, 2013, FLEX, 50],
    ["Logan", 2007, null, FLEX, 50],
    ["Sandero", 2007, null, FLEX, 50],
    ["Stepway", 2008, null, FLEX, 50],
    ["Duster", 2011, null, FLEX, 50],
    ["Oroch", 2015, null, FLEX, 50],
    ["Captur", 2017, null, FLEX, 50],
    ["Kwid", 2017, null, FLEX, 38],
    ["Fluence", 2011, 2017, FLEX, 60],
    ["Master", 2002, null, D, 80],
  ]),

  ...marca("Toyota", "carro", [
    ["Bandeirante", 1962, 2001, D, 90],
    ["Corolla", 1993, null, FLEX, 50],
    ["Corolla Cross", 2021, null, FLEX, 47],
    ["Camry", 1998, 2020, G, 70],
    ["Etios", 2012, 2021, FLEX, 45],
    ["Yaris", 2018, null, FLEX, 42],
    ["Hilux", 1998, null, D, 80],
    ["SW4", 2005, null, D, 80],
    ["RAV4", 2001, null, G, 55],
    ["Prius", 2013, 2022, G, 43],
  ]),

  ...marca("Honda", "carro", [
    ["Civic", 1992, null, FLEX, 50],
    ["Accord", 1994, 2020, G, 65],
    ["Fit", 2003, 2021, FLEX, 42],
    ["City", 2009, null, FLEX, 40],
    ["HR-V", 2015, null, FLEX, 50],
    ["WR-V", 2017, null, FLEX, 40],
    ["CR-V", 2007, null, G, 57],
    ["ZR-V", 2023, null, G, 57],
  ]),

  ...marca("Hyundai", "carro", [
    ["HB20", 2012, null, FLEX, 50],
    ["HB20S", 2013, null, FLEX, 50],
    ["HB20X", 2013, null, FLEX, 50],
    ["i30", 2009, 2016, G, 53],
    ["Elantra", 2011, 2018, G, 50],
    ["Azera", 2007, 2018, G, 70],
    ["Tucson", 2005, null, G, 62],
    ["Creta", 2017, null, FLEX, 50],
    ["Santa Fé", 2007, null, GD, 71],
    ["ix35", 2010, 2021, FLEX, 58],
    ["Veloster", 2011, 2016, G, 50],
  ]),

  ...marca("Nissan", "carro", [
    ["March", 2011, 2021, FLEX, 41],
    ["Versa", 2011, null, FLEX, 41],
    ["Sentra", 2007, null, FLEX, 52],
    ["Tiida", 2007, 2013, FLEX, 52],
    ["Livina", 2009, 2014, FLEX, 52],
    ["Kicks", 2016, null, FLEX, 41],
    ["Frontier", 2002, null, D, 80],
    ["Leaf", 2019, null, G, 0],
  ]),

  ...marca("Jeep", "carro", [
    ["Cherokee", 1993, 2014, G, 76],
    ["Grand Cherokee", 1996, null, GD, 87],
    ["Wrangler", 2007, null, G, 81],
    ["Renegade", 2015, null, FLEX, 48],
    ["Compass", 2011, null, FLEX, 60],
    ["Commander", 2021, null, FLEX, 60],
  ]),

  ...marca("Peugeot", "carro", [
    ["205", 1992, 1998, G, 50],
    ["206", 1999, 2010, FLEX, 50],
    ["207", 2008, 2015, FLEX, 50],
    ["208", 2013, null, FLEX, 47],
    ["307", 2002, 2012, FLEX, 60],
    ["308", 2012, 2019, G, 60],
    ["408", 2011, 2019, G, 60],
    ["2008", 2015, null, FLEX, 50],
    ["3008", 2010, null, G, 53],
    ["Partner", 2000, 2018, G, 55],
  ]),

  ...marca("Citroën", "carro", [
    ["C3", 2002, null, FLEX, 47],
    ["C4", 2007, 2015, G, 60],
    ["C4 Lounge", 2013, 2019, FLEX, 60],
    ["C4 Cactus", 2018, null, FLEX, 50],
    ["C5", 2005, 2013, G, 60],
    ["Xsara Picasso", 2001, 2012, G, 60],
    ["Aircross", 2010, 2021, FLEX, 50],
    ["Basalt", 2024, null, FLEX, 47],
  ]),

  ...marca("Mitsubishi", "carro", [
    ["L200", 1998, null, D, 75],
    ["Pajero", 1998, 2021, GD, 88],
    ["Pajero TR4", 2002, 2015, FLEX, 60],
    ["Pajero Sport", 2020, null, D, 68],
    ["Lancer", 1994, 2017, G, 59],
    ["ASX", 2010, null, G, 60],
    ["Outlander", 2007, null, G, 60],
    ["Eclipse Cross", 2018, null, G, 60],
  ]),

  ...marca("Kia", "carro", [
    ["Picanto", 2005, 2017, G, 35],
    ["Cerato", 2009, 2018, G, 52],
    ["Sportage", 2005, null, G, 58],
    ["Sorento", 2003, null, GD, 71],
    ["Soul", 2010, 2019, G, 48],
    ["Bongo", 2005, null, D, 60],
    ["Stonic", 2023, null, G, 45],
  ]),

  ...marca("Caoa Chery", "carro", [
    ["QQ", 2011, 2017, FLEX, 35],
    ["Celer", 2012, 2016, FLEX, 45],
    ["Tiggo 2", 2018, null, FLEX, 45],
    ["Tiggo 3x", 2022, null, FLEX, 45],
    ["Tiggo 5x", 2019, null, FLEX, 51],
    ["Tiggo 7", 2019, null, FLEX, 57],
    ["Tiggo 8", 2020, null, FLEX, 57],
    ["Arrizo 5", 2018, 2022, FLEX, 50],
    ["Arrizo 6", 2021, null, FLEX, 50],
  ]),

  ...marca("BYD", "carro", [
    ["Dolphin", 2023, null, G, 0],
    ["Dolphin Mini", 2024, null, G, 0],
    ["Yuan Plus / Yuan Pro", 2023, null, G, 0],
    ["Song Plus", 2023, null, G, 18],
    ["Seal", 2023, null, G, 0],
    ["King", 2024, null, G, 48],
    ["Han", 2022, null, G, 0],
    ["Tan", 2022, null, G, 0],
  ]),

  ...marca("GWM", "carro", [
    ["Haval H6", 2022, null, G, 55],
    ["Ora 03", 2023, null, G, 0],
    ["Poer", 2024, null, D, 78],
  ]),

  ...marca("JAC", "carro", [
    ["J3", 2011, 2015, FLEX, 51],
    ["J5", 2012, 2016, FLEX, 55],
    ["J6", 2012, 2015, G, 63],
    ["T40", 2017, 2020, FLEX, 45],
    ["T60", 2023, null, G, 55],
    ["e-JS1", 2021, null, G, 0],
    ["iEV20", 2020, null, G, 0],
  ]),

  ...marca("Suzuki", "carro", [
    ["Vitara", 1994, null, G, 47],
    ["Grand Vitara", 1999, 2017, G, 66],
    ["Jimny", 2012, null, G, 40],
    ["SX4", 2007, 2014, G, 50],
    ["Swift", 2010, 2015, G, 42],
    ["S-Cross", 2014, 2018, G, 47],
  ]),

  ...marca("BMW", "carro", [
    ["Série 1", 2005, null, G, 52],
    ["Série 3", 1990, null, G, 59],
    ["Série 5", 1990, null, G, 68],
    ["X1", 2010, null, G, 61],
    ["X3", 2004, null, G, 65],
    ["X5", 2000, null, GD, 83],
    ["X6", 2008, null, G, 83],
  ]),

  ...marca("Mercedes-Benz", "carro", [
    ["Classe A", 1999, null, G, 50],
    ["Classe C", 1994, null, G, 66],
    ["Classe E", 1996, null, G, 66],
    ["GLA", 2014, null, G, 56],
    ["GLC", 2016, null, G, 66],
    ["GLE", 2015, null, GD, 85],
  ]),

  ...marca("Audi", "carro", [
    ["A3", 1997, null, G, 50],
    ["A4", 1995, null, G, 54],
    ["A5", 2008, null, G, 54],
    ["Q3", 2012, null, G, 60],
    ["Q5", 2009, null, G, 65],
    ["Q7", 2007, null, GD, 85],
  ]),

  ...marca("Volvo", "carro", [
    ["XC40", 2018, null, G, 54],
    ["XC60", 2009, null, GD, 71],
    ["XC90", 2003, null, GD, 71],
    ["S60", 2001, null, G, 60],
  ]),

  ...marca("Land Rover", "carro", [
    ["Defender", 1990, null, D, 80],
    ["Discovery", 1994, null, D, 85],
    ["Freelander", 1998, 2015, GD, 68],
    ["Range Rover Evoque", 2011, null, GD, 68],
  ]),

  ...marca("RAM", "carro", [
    ["2500", 2001, null, D, 117],
    ["3500", 2013, null, D, 117],
    ["Rampage", 2023, null, D, 60],
    ["Classic (1500)", 2022, null, G, 98],
  ]),

  ...marca("Dodge", "carro", [
    ["Dakota", 1998, 2001, GD, 76],
    ["Journey", 2009, 2015, G, 78],
    ["Ram (antiga)", 1998, 2010, D, 117],
  ]),

  ...marca("Troller", "carro", [
    ["T4", 1998, 2021, D, 78],
    ["Pantanal", 2004, 2008, D, 78],
  ]),

  ...marca("Gurgel", "carro", [
    ["X12", 1975, 1990, G, 40],
    ["BR-800", 1988, 1991, G, 40],
    ["Supermini", 1992, 1994, G, 40],
  ]),

  ...marca("Puma", "carro", [
    ["GT", 1970, 1985, G, 50],
    ["GTB", 1973, 1981, G, 60],
  ]),
];

// ═══════════════════════════════════════════════════════════════════════════
//  MOTOS
// ═══════════════════════════════════════════════════════════════════════════

const MOTOS: VehicleModel[] = [
  ...marca("Honda", "moto", [
    ["CG 125", 1976, 2009, G, 12],
    ["CG 150 Titan", 2004, 2015, FLEX, 16],
    ["CG 160 Titan", 2016, null, FLEX, 16],
    ["CG 160 Fan", 2016, null, FLEX, 16],
    ["CG 160 Start", 2016, null, G, 16],
    ["CG 160 Cargo", 2016, null, FLEX, 16],
    ["Biz 100", 1998, 2015, G, 5],
    ["Biz 110i", 2016, null, G, 5],
    ["Biz 125", 2005, null, FLEX, 5],
    ["Pop 100", 2007, 2015, G, 5],
    ["Pop 110i", 2016, null, G, 4],
    ["CB 300", 2009, 2015, FLEX, 13],
    ["CB 300F Twister", 2016, null, FLEX, 12],
    ["CB 500", 2013, null, G, 17],
    ["CB 500X", 2013, null, G, 17],
    ["CB 650F / CB 650R", 2014, null, G, 15],
    ["CB 1000R", 2011, null, G, 16],
    ["CBR 250R", 2011, 2016, G, 13],
    ["CBR 500R", 2013, null, G, 17],
    ["CBR 600RR", 2003, 2016, G, 18],
    ["CBR 650R", 2019, null, G, 15],
    ["CBR 1000RR", 2004, null, G, 16],
    ["XRE 190", 2016, null, FLEX, 13],
    ["XRE 300", 2009, null, FLEX, 13],
    ["XRE 300 Sahara", 2021, null, FLEX, 13],
    ["Bros 150", 2003, 2015, FLEX, 13],
    ["Bros 160", 2015, null, FLEX, 13],
    ["NXR 125 Bros", 2003, 2008, G, 12],
    ["Falcon NX4", 2000, 2011, G, 17],
    ["Tornado XR250", 2001, 2008, G, 12],
    ["PCX 150", 2013, null, G, 8],
    ["PCX 160", 2021, null, G, 8],
    ["Elite 125", 2019, null, G, 5],
    ["ADV 150", 2021, null, G, 8],
    ["Sh 300i", 2016, 2020, G, 9],
    ["Lead 110", 2009, 2015, G, 6],
    ["NC 750X", 2015, null, G, 14],
    ["Africa Twin", 2016, null, G, 24],
    ["XRE 190 / Sahara 300", 2016, null, FLEX, 13],
    ["Hornet CB 600F", 2005, 2014, G, 19],
    ["Shadow 750", 2003, 2018, G, 14],
    ["Gold Wing", 2001, null, G, 21],
  ]),

  ...marca("Yamaha", "moto", [
    ["YBR 125 Factor", 2000, 2016, G, 19],
    ["Factor 125", 2016, null, FLEX, 19],
    ["Factor 150", 2016, null, FLEX, 14],
    ["Fazer 150", 2014, null, FLEX, 14],
    ["Fazer 250", 2005, null, FLEX, 19],
    ["YS 250 Fazer", 2005, 2017, FLEX, 19],
    ["Lander 250", 2007, null, FLEX, 12],
    ["XTZ 125", 2003, null, FLEX, 12],
    ["XTZ 150 Crosser", 2014, null, FLEX, 12],
    ["XTZ 250 Ténéré", 2011, null, FLEX, 19],
    ["Neo 125", 2016, null, G, 5],
    ["NMax 160", 2017, null, G, 7],
    ["Fluo 125", 2023, null, G, 5],
    ["MT-03", 2016, null, G, 14],
    ["MT-07", 2015, null, G, 14],
    ["MT-09", 2014, null, G, 14],
    ["R3 (YZF-R3)", 2015, null, G, 14],
    ["R15", 2018, null, G, 11],
    ["R1 (YZF-R1)", 2004, null, G, 17],
    ["XJ6", 2010, 2018, G, 17],
    ["Tenere 700", 2021, null, G, 16],
    ["MT-10", 2017, null, G, 17],
    ["Crypton 115", 2010, 2015, G, 4],
    ["Jog", 1996, 2005, G, 5],
    ["Virago 250", 1997, 2005, G, 10],
  ]),

  ...marca("Suzuki", "moto", [
    ["Intruder 125", 2003, 2017, G, 11],
    ["Yes 125", 2005, 2016, G, 15],
    ["EN 125", 2001, 2011, G, 13],
    ["GSR 150i", 2018, null, G, 12],
    ["GSX-S750", 2015, null, G, 16],
    ["GSX-S1000", 2015, null, G, 19],
    ["GSX-R750", 2000, 2018, G, 17],
    ["GSX-R1000", 2001, null, G, 17],
    ["Bandit 600", 1996, 2004, G, 20],
    ["Bandit 650", 2005, 2015, G, 19],
    ["Bandit 1250", 2007, 2016, G, 19],
    ["V-Strom 650", 2004, null, G, 20],
    ["V-Strom 1000 / 1050", 2014, null, G, 20],
    ["Hayabusa", 2000, null, G, 20],
    ["Burgman 125", 2006, null, G, 6],
    ["DR 650", 1996, 2010, G, 13],
  ]),

  ...marca("Kawasaki", "moto", [
    ["Ninja 300", 2013, 2018, G, 17],
    ["Ninja 400", 2018, null, G, 14],
    ["Ninja 650", 2007, null, G, 15],
    ["Ninja ZX-6R", 2005, null, G, 17],
    ["Ninja ZX-10R", 2004, null, G, 17],
    ["Ninja 1000 / Z1000", 2010, null, G, 17],
    ["Z400", 2019, null, G, 14],
    ["Z650", 2017, null, G, 15],
    ["Z900", 2017, null, G, 17],
    ["Versys 300", 2018, null, G, 17],
    ["Versys 650", 2007, null, G, 21],
    ["Versys 1000", 2012, null, G, 21],
    ["Vulcan S", 2015, null, G, 14],
  ]),

  ...marca("Dafra", "moto", [
    ["Speed 150", 2008, 2015, G, 15],
    ["Riva 150", 2013, null, G, 6],
    ["Citycom 300i", 2010, null, G, 12],
    ["NH 190", 2018, null, G, 12],
    ["Next 250 / 300", 2012, null, G, 12],
    ["Horizon 150", 2016, null, G, 16],
    ["Apache 150 / 200", 2018, null, G, 12],
    ["Cruisym 150", 2019, null, G, 8],
  ]),

  ...marca("Haojue", "moto", [
    ["DK 150", 2018, null, G, 12],
    ["DK 160", 2021, null, G, 12],
    ["Chopper Road 150", 2019, null, G, 13],
    ["Master Ride 150", 2020, null, G, 12],
    ["NK 150", 2019, null, G, 12],
    ["Lindy 125", 2019, null, G, 5],
  ]),

  ...marca("Shineray", "moto", [
    ["Jet 50", 2010, null, G, 4],
    ["Phoenix 50", 2012, null, G, 4],
    ["XY 50Q", 2011, null, G, 4],
    ["Worker 125", 2010, null, G, 14],
    ["SHI 175", 2019, null, G, 14],
    ["Discover 150", 2018, null, G, 12],
  ]),

  ...marca("Royal Enfield", "moto", [
    ["Bullet 350", 2020, null, G, 13],
    ["Classic 350", 2021, null, G, 13],
    ["Meteor 350", 2021, null, G, 15],
    ["Hunter 350", 2023, null, G, 13],
    ["Himalayan", 2018, null, G, 15],
    ["Interceptor 650", 2019, null, G, 13],
    ["Continental GT 650", 2019, null, G, 12],
  ]),

  ...marca("Harley-Davidson", "moto", [
    ["Iron 883", 2009, 2022, G, 12],
    ["Forty-Eight", 2010, 2022, G, 7],
    ["Fat Boy", 1990, null, G, 19],
    ["Street 750", 2014, 2020, G, 13],
    ["Sportster S", 2021, null, G, 11],
    ["Road King", 1994, null, G, 22],
    ["Street Glide", 2006, null, G, 22],
    ["Pan America", 2021, null, G, 21],
  ]),

  ...marca("BMW Motorrad", "moto", [
    ["G 310 R", 2016, null, G, 11],
    ["G 310 GS", 2017, null, G, 11],
    ["F 750 GS", 2018, null, G, 15],
    ["F 850 GS", 2018, null, G, 15],
    ["F 900 R", 2020, null, G, 13],
    ["R 1250 GS", 2019, null, G, 20],
    ["R 1300 GS", 2024, null, G, 19],
    ["S 1000 RR", 2010, null, G, 16],
    ["S 1000 XR", 2015, null, G, 20],
  ]),

  ...marca("Triumph", "moto", [
    ["Street Triple", 2008, null, G, 15],
    ["Speed Triple", 2005, null, G, 15],
    ["Trident 660", 2021, null, G, 14],
    ["Tiger 900", 2020, null, G, 20],
    ["Tiger 1200", 2012, null, G, 20],
    ["Bonneville T100", 2002, null, G, 14],
    ["Speed 400", 2024, null, G, 13],
    ["Rocket 3", 2019, null, G, 18],
  ]),

  ...marca("Ducati", "moto", [
    ["Monster", 1993, null, G, 14],
    ["Panigale V2", 2020, null, G, 17],
    ["Panigale V4", 2018, null, G, 16],
    ["Multistrada V4", 2021, null, G, 22],
    ["Diavel", 2011, null, G, 17],
    ["Scrambler", 2015, null, G, 14],
    ["Hypermotard", 2007, null, G, 14],
  ]),

  ...marca("KTM", "moto", [
    ["Duke 200", 2013, null, G, 14],
    ["Duke 250", 2017, null, G, 14],
    ["Duke 390", 2013, null, G, 15],
    ["Adventure 390", 2020, null, G, 15],
    ["Adventure 890", 2021, null, G, 20],
    ["Adventure 1290", 2015, null, G, 23],
    ["RC 390", 2015, null, G, 14],
  ]),

  ...marca("Kymco", "moto", [
    ["Agility 125", 2010, null, G, 6],
    ["Like 125", 2018, null, G, 6],
    ["People 150", 2015, null, G, 8],
    ["Downtown 300", 2016, null, G, 12],
    ["AK 550", 2018, null, G, 15],
  ]),

  ...marca("Avelloz", "moto", [
    ["AZ1", 2021, null, G, 12],
    ["AZ2", 2022, null, G, 12],
    ["AZ4", 2023, null, G, 12],
  ]),

  ...marca("Sundown", "moto", [
    ["Web 100", 2001, 2009, G, 5],
    ["Hunter 90 / 100", 2003, 2010, G, 5],
    ["STX 200", 2004, 2009, G, 13],
    ["Max 125", 2005, 2010, G, 12],
  ]),

  ...marca("Kasinski", "moto", [
    ["Mirage 150", 2007, 2013, G, 15],
    ["Comet 150 / 250", 2007, 2014, G, 15],
    ["Prima 150", 2009, 2013, G, 6],
    ["Win 110", 2003, 2010, G, 4],
  ]),

  ...marca("Agrale", "moto", [
    ["Elefant 30.0", 1985, 1995, G, 12],
    ["Dakar 30.0", 1990, 1998, G, 12],
  ]),
];

// ═══════════════════════════════════════════════════════════════════════════
//  API pública
// ═══════════════════════════════════════════════════════════════════════════

/** Todos os modelos (carros + motos), ordenados por marca e modelo. */
export const vehicleDatabase: VehicleModel[] = [...CARROS, ...MOTOS].sort(
  (a, b) => a.marca.localeCompare(b.marca, "pt-BR") || a.modelo.localeCompare(b.modelo, "pt-BR"),
);

// ── Tipo de carroceria (para a ilustração) ─────────────────────────────────
/** Tipo visual do veículo, usado para escolher a silhueta/ilustração. */
export type VehicleTipo = "carro" | "suv" | "picape" | "moto";

const RE_PICAPE =
  /strada|toro|saveiro|amarok|montana|s10|hilux|ranger|frontier|l200|oroch|picape|dakota|f-1000|f-250|rampage|poer|courier|2500|3500|classic \(1500\)|chevy 500/i;
const RE_SUV =
  /cross|tiggo|haval|duster|captur|creta|kicks|renegade|compass|commander|cherokee|wrangler|tucson|sportage|sorento|pajero|outlander|eclipse|asx|rav4|sw4|hr-v|cr-v|zr-v|wr-v|ecosport|territory|bronco|edge|tiguan|taos|nivus|2008|3008|cactus|aircross|basalt|vitara|jimny|s-cross|stepway|stonic|\bsoul\b|song|yuan|\btan\b|freelander|discovery|defender|evoque|pantanal|pulse|fastback|tr4|q[357]|x[1356]|gl[ace]|xc[469]0|ix35/i;
const MARCAS_SEMPRE_SUV = new Set(["Jeep", "Land Rover", "Troller"]);

/** Deduz o tipo de carroceria de um modelo do catálogo. */
export function getTipo(m: VehicleModel): VehicleTipo {
  if (m.categoria === "moto") return "moto";
  if (MARCAS_SEMPRE_SUV.has(m.marca)) return "suv";
  const nome = m.modelo.toLowerCase();
  if (RE_PICAPE.test(nome)) return "picape";
  if (RE_SUV.test(nome)) return "suv";
  return "carro";
}

/** Localiza um modelo pelo texto "Marca Modelo" (como salvo no veículo do usuário). */
export function findByModeloCompleto(modeloCompleto: string): VehicleModel | undefined {
  return vehicleDatabase.find((v) => `${v.marca} ${v.modelo}` === modeloCompleto);
}

/**
 * Deduz o tipo a partir do texto "Marca Modelo" salvo no veículo.
 * Tenta casar com o catálogo; se não achar, usa heurística por palavra-chave.
 */
export function getTipoByModeloCompleto(modeloCompleto: string): VehicleTipo {
  const achado = findByModeloCompleto(modeloCompleto);
  if (achado) return getTipo(achado);
  const s = modeloCompleto.toLowerCase();
  if (RE_PICAPE.test(s)) return "picape";
  if (RE_SUV.test(s)) return "suv";
  return "carro";
}

// ── Consumo estimado (km/l) ────────────────────────────────────────────────
/**
 * Consumo de referência em km/l — cidade e rodovia, base GASOLINA.
 * São estimativas típicas do mercado brasileiro (padrão INMETRO/PBE), não
 * medições oficiais por versão. Para flex no etanol, reduza ~30%.
 * O `misto` é uma ponderação simples (55% cidade / 45% rodovia).
 */
export type ConsumoEstimado = { cidade: number; rodovia: number; misto: number };

// Chave: "Marca|Modelo" (igual ao catálogo). Valor: [cidade, rodovia].
// Modelos ausentes caem no fallback por tipo/combustível — nada quebra.
const CONSUMO: Record<string, [number, number]> = {
  // Volkswagen
  "Volkswagen|Fusca": [8, 11],
  "Volkswagen|Brasília": [8, 11],
  "Volkswagen|Gol": [10, 14],
  "Volkswagen|Voyage": [10, 14],
  "Volkswagen|Parati": [9, 13],
  "Volkswagen|Saveiro": [9, 12],
  "Volkswagen|Santana": [8, 12],
  "Volkswagen|Polo": [11, 15],
  "Volkswagen|Polo Sedan / Virtus": [11, 15],
  "Volkswagen|Virtus": [11, 15],
  "Volkswagen|Golf": [9, 13],
  "Volkswagen|Fox": [11, 14],
  "Volkswagen|CrossFox": [10, 13],
  "Volkswagen|SpaceFox": [10, 13],
  "Volkswagen|Jetta": [8, 12],
  "Volkswagen|up!": [12, 15],
  "Volkswagen|Amarok": [8, 11],
  "Volkswagen|Tiguan": [8, 11],
  "Volkswagen|T-Cross": [10, 13],
  "Volkswagen|Nivus": [11, 14],
  "Volkswagen|Taos": [9, 12],
  // Fiat
  "Fiat|147": [9, 12],
  "Fiat|Uno": [11, 14],
  "Fiat|Uno (novo)": [12, 15],
  "Fiat|Palio": [11, 14],
  "Fiat|Palio Weekend": [10, 13],
  "Fiat|Siena": [11, 14],
  "Fiat|Grand Siena": [11, 15],
  "Fiat|Punto": [10, 13],
  "Fiat|Idea": [10, 13],
  "Fiat|Linea": [9, 13],
  "Fiat|Bravo": [9, 12],
  "Fiat|Stilo": [8, 12],
  "Fiat|Doblò": [8, 11],
  "Fiat|Strada": [10, 13],
  "Fiat|Toro": [8, 11],
  "Fiat|Mobi": [12, 15],
  "Fiat|Argo": [11, 14],
  "Fiat|Cronos": [11, 15],
  "Fiat|Fastback": [10, 13],
  "Fiat|Pulse": [10, 13],
  "Fiat|Fiorino": [9, 12],
  "Fiat|500": [11, 14],
  // Chevrolet
  "Chevrolet|Opala": [6, 9],
  "Chevrolet|Chevette": [9, 12],
  "Chevrolet|Monza": [8, 11],
  "Chevrolet|Kadett": [9, 12],
  "Chevrolet|Vectra": [8, 12],
  "Chevrolet|Corsa": [10, 13],
  "Chevrolet|Astra": [8, 12],
  "Chevrolet|Celta": [11, 14],
  "Chevrolet|Meriva": [9, 12],
  "Chevrolet|Montana": [10, 13],
  "Chevrolet|Prisma": [11, 14],
  "Chevrolet|Agile": [9, 12],
  "Chevrolet|Cobalt": [10, 13],
  "Chevrolet|Onix": [11, 15],
  "Chevrolet|Onix Plus": [11, 15],
  "Chevrolet|Spin": [9, 12],
  "Chevrolet|Tracker": [9, 12],
  "Chevrolet|Cruze": [9, 13],
  "Chevrolet|S10": [8, 11],
  "Chevrolet|Blazer": [7, 10],
  "Chevrolet|Trailblazer": [7, 10],
  "Chevrolet|Equinox": [8, 11],
  "Chevrolet|Camaro": [6, 9],
  "Chevrolet|Zafira": [8, 11],
  // Ford
  "Ford|Corcel": [8, 11],
  "Ford|Belina": [8, 11],
  "Ford|Del Rey": [8, 11],
  "Ford|Escort": [8, 12],
  "Ford|Verona": [8, 12],
  "Ford|Ka": [11, 15],
  "Ford|Fiesta": [11, 14],
  "Ford|EcoSport": [9, 12],
  "Ford|Focus": [9, 13],
  "Ford|Fusion": [8, 12],
  "Ford|Ranger": [8, 11],
  "Ford|Territory": [9, 12],
  "Ford|Bronco Sport": [7, 10],
  "Ford|Maverick (picape)": [8, 11],
  "Ford|Mustang": [6, 9],
  "Ford|Edge": [7, 10],
  "Ford|Courier": [9, 12],
  // Renault
  "Renault|Clio": [11, 14],
  "Renault|Scénic": [8, 12],
  "Renault|Mégane": [8, 12],
  "Renault|Kangoo": [9, 12],
  "Renault|Symbol": [10, 13],
  "Renault|Logan": [10, 14],
  "Renault|Sandero": [10, 14],
  "Renault|Stepway": [10, 13],
  "Renault|Duster": [9, 12],
  "Renault|Oroch": [9, 12],
  "Renault|Captur": [9, 12],
  "Renault|Kwid": [13, 16],
  "Renault|Fluence": [8, 12],
  "Renault|Master": [8, 10],
  // Toyota
  "Toyota|Bandeirante": [6, 9],
  "Toyota|Corolla": [11, 14],
  "Toyota|Corolla Cross": [10, 14],
  "Toyota|Camry": [8, 12],
  "Toyota|Etios": [11, 15],
  "Toyota|Yaris": [11, 15],
  "Toyota|Hilux": [8, 12],
  "Toyota|SW4": [7, 10],
  "Toyota|RAV4": [10, 13],
  "Toyota|Prius": [18, 20],
  // Honda
  "Honda|Civic": [10, 14],
  "Honda|Accord": [8, 12],
  "Honda|Fit": [11, 15],
  "Honda|City": [11, 15],
  "Honda|HR-V": [10, 13],
  "Honda|WR-V": [10, 13],
  "Honda|CR-V": [8, 11],
  "Honda|ZR-V": [9, 12],
  // Hyundai
  "Hyundai|HB20": [11, 15],
  "Hyundai|HB20S": [11, 15],
  "Hyundai|HB20X": [10, 13],
  "Hyundai|i30": [9, 12],
  "Hyundai|Elantra": [9, 13],
  "Hyundai|Azera": [7, 11],
  "Hyundai|Tucson": [8, 11],
  "Hyundai|Creta": [9, 12],
  "Hyundai|Santa Fé": [7, 10],
  "Hyundai|ix35": [8, 11],
  "Hyundai|Veloster": [9, 12],
  // Nissan
  "Nissan|March": [11, 14],
  "Nissan|Versa": [11, 15],
  "Nissan|Sentra": [10, 14],
  "Nissan|Tiida": [9, 12],
  "Nissan|Livina": [9, 12],
  "Nissan|Kicks": [11, 14],
  "Nissan|Frontier": [8, 11],
  // Jeep
  "Jeep|Cherokee": [6, 9],
  "Jeep|Grand Cherokee": [6, 9],
  "Jeep|Wrangler": [6, 9],
  "Jeep|Renegade": [9, 12],
  "Jeep|Compass": [8, 12],
  "Jeep|Commander": [8, 11],
  // Peugeot
  "Peugeot|205": [10, 13],
  "Peugeot|206": [10, 13],
  "Peugeot|207": [10, 13],
  "Peugeot|208": [10, 14],
  "Peugeot|307": [9, 12],
  "Peugeot|308": [9, 12],
  "Peugeot|408": [8, 12],
  "Peugeot|2008": [9, 12],
  "Peugeot|3008": [8, 11],
  "Peugeot|Partner": [9, 12],
  // Citroën
  "Citroën|C3": [10, 14],
  "Citroën|C4": [8, 12],
  "Citroën|C4 Lounge": [9, 13],
  "Citroën|C4 Cactus": [9, 12],
  "Citroën|C5": [8, 12],
  "Citroën|Xsara Picasso": [8, 12],
  "Citroën|Aircross": [9, 12],
  "Citroën|Basalt": [10, 13],
  // Mitsubishi
  "Mitsubishi|L200": [8, 11],
  "Mitsubishi|Pajero": [7, 10],
  "Mitsubishi|Pajero TR4": [8, 11],
  "Mitsubishi|Pajero Sport": [7, 10],
  "Mitsubishi|Lancer": [9, 12],
  "Mitsubishi|ASX": [8, 11],
  "Mitsubishi|Outlander": [8, 11],
  "Mitsubishi|Eclipse Cross": [8, 11],
  // Kia
  "Kia|Picanto": [11, 14],
  "Kia|Cerato": [9, 13],
  "Kia|Sportage": [8, 11],
  "Kia|Sorento": [8, 11],
  "Kia|Soul": [9, 12],
  "Kia|Bongo": [9, 12],
  "Kia|Stonic": [10, 13],
  // Caoa Chery
  "Caoa Chery|QQ": [12, 15],
  "Caoa Chery|Celer": [10, 13],
  "Caoa Chery|Tiggo 2": [9, 12],
  "Caoa Chery|Tiggo 3x": [9, 12],
  "Caoa Chery|Tiggo 5x": [9, 12],
  "Caoa Chery|Tiggo 7": [8, 11],
  "Caoa Chery|Tiggo 8": [8, 11],
  "Caoa Chery|Arrizo 5": [10, 13],
  "Caoa Chery|Arrizo 6": [10, 13],
  // GWM (híbrido)
  "GWM|Haval H6": [11, 13],
  // Suzuki
  "Suzuki|Vitara": [9, 12],
  "Suzuki|Grand Vitara": [7, 10],
  "Suzuki|Jimny": [9, 12],
  "Suzuki|SX4": [9, 12],
  "Suzuki|Swift": [11, 14],
  "Suzuki|S-Cross": [9, 13],
  // Premium (gasolina)
  "BMW|Série 1": [8, 12],
  "BMW|Série 3": [8, 13],
  "BMW|Série 5": [7, 12],
  "BMW|X1": [8, 12],
  "BMW|X3": [7, 11],
  "BMW|X5": [6, 10],
  "BMW|X6": [6, 10],
  "Mercedes-Benz|Classe A": [9, 13],
  "Mercedes-Benz|Classe C": [8, 13],
  "Mercedes-Benz|Classe E": [7, 12],
  "Mercedes-Benz|GLA": [8, 12],
  "Mercedes-Benz|GLC": [7, 11],
  "Mercedes-Benz|GLE": [6, 10],
  "Audi|A3": [9, 13],
  "Audi|A4": [8, 12],
  "Audi|A5": [8, 12],
  "Audi|Q3": [8, 11],
  "Audi|Q5": [7, 11],
  "Audi|Q7": [6, 9],
  "Volvo|XC40": [8, 11],
  "Volvo|XC60": [7, 11],
  "Volvo|XC90": [7, 10],
  "Volvo|S60": [8, 12],
  // Picapes grandes / off-road (diesel)
  "RAM|2500": [6, 9],
  "RAM|3500": [6, 9],
  "RAM|Rampage": [9, 12],
  "RAM|Classic (1500)": [6, 9],
  "Troller|T4": [7, 10],
  "Troller|Pantanal": [7, 10],
  // Motos — Honda
  "Honda|CG 125": [45, 55],
  "Honda|CG 150 Titan": [40, 48],
  "Honda|CG 160 Titan": [45, 52],
  "Honda|CG 160 Fan": [45, 52],
  "Honda|CG 160 Start": [45, 52],
  "Honda|Biz 125": [45, 55],
  "Honda|Pop 110i": [55, 62],
  "Honda|CB 300": [30, 35],
  "Honda|CB 300F Twister": [30, 35],
  "Honda|CB 500": [25, 30],
  "Honda|CB 500X": [25, 30],
  "Honda|XRE 190": [40, 45],
  "Honda|XRE 300": [30, 35],
  "Honda|Bros 160": [40, 45],
  "Honda|PCX 150": [38, 44],
  "Honda|PCX 160": [40, 45],
  "Honda|CBR 1000RR": [14, 18],
  "Honda|Africa Twin": [18, 22],
  // Motos — Yamaha
  "Yamaha|Factor 125": [40, 48],
  "Yamaha|Factor 150": [40, 46],
  "Yamaha|Fazer 150": [40, 46],
  "Yamaha|Fazer 250": [30, 35],
  "Yamaha|Lander 250": [30, 35],
  "Yamaha|XTZ 125": [38, 45],
  "Yamaha|XTZ 150 Crosser": [38, 44],
  "Yamaha|XTZ 250 Ténéré": [28, 33],
  "Yamaha|NMax 160": [35, 42],
  "Yamaha|MT-03": [25, 30],
  "Yamaha|MT-07": [18, 22],
  "Yamaha|MT-09": [16, 20],
  "Yamaha|R3 (YZF-R3)": [25, 30],
  "Yamaha|R15": [35, 42],
  // Motos — Suzuki / Kawasaki
  "Suzuki|Yes 125": [40, 48],
  "Suzuki|Intruder 125": [40, 48],
  "Suzuki|GSX-S750": [16, 20],
  "Suzuki|Hayabusa": [12, 17],
  "Suzuki|V-Strom 650": [20, 25],
  "Kawasaki|Ninja 300": [25, 30],
  "Kawasaki|Ninja 400": [25, 30],
  "Kawasaki|Z400": [25, 30],
  "Kawasaki|Z900": [15, 19],
  "Kawasaki|Versys 650": [20, 25],
};

const FALLBACK_TIPO: Record<VehicleTipo, [number, number]> = {
  carro: [10, 13],
  suv: [8, 11],
  picape: [9, 12],
  moto: [35, 40],
};

function mkConsumo(cidade: number, rodovia: number): ConsumoEstimado {
  return { cidade, rodovia, misto: Math.round((cidade * 0.55 + rodovia * 0.45) * 10) / 10 };
}

/**
 * Consumo estimado (cidade/rodovia/misto, km/l) de um modelo do catálogo.
 * Retorna null para elétricos (tanque 0). Usa fallback por tipo se o modelo
 * específico não estiver na tabela.
 */
export function getConsumo(m: VehicleModel): ConsumoEstimado | null {
  if (m.tanque === 0) return null; // elétrico — km/l não se aplica
  const hit = CONSUMO[`${m.marca}|${m.modelo}`];
  if (hit) return mkConsumo(hit[0], hit[1]);
  const base = FALLBACK_TIPO[getTipo(m)];
  return mkConsumo(base[0], base[1]);
}

/** Consumo estimado a partir do texto "Marca Modelo" salvo no veículo. */
export function getConsumoByModeloCompleto(modeloCompleto: string): ConsumoEstimado | null {
  const m = findByModeloCompleto(modeloCompleto);
  if (m) return getConsumo(m);
  return null;
}

/** Retorna as marcas, opcionalmente filtradas por categoria (carro/moto). */
export function getMarcas(categoria?: VehicleCategory): string[] {
  const set = new Set<string>();
  for (const v of vehicleDatabase) {
    if (!categoria || v.categoria === categoria) set.add(v.marca);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

/** Retorna os modelos de uma marca, opcionalmente filtrados por categoria. */
export function getModelos(marcaNome: string, categoria?: VehicleCategory): VehicleModel[] {
  return vehicleDatabase
    .filter((v) => v.marca === marcaNome && (!categoria || v.categoria === categoria))
    .sort((a, b) => a.modelo.localeCompare(b.modelo, "pt-BR"));
}

/**
 * Anos-modelo disponíveis para um modelo (mais recente primeiro).
 * Expande a faixa [anoInicio, anoFim ?? ANO_ATUAL].
 */
export function getAnos(marcaNome: string, modeloNome: string): number[] {
  const m = findModelo(marcaNome, modeloNome);
  if (!m) return [];
  const fim = m.anoFim ?? ANO_ATUAL;
  const anos: number[] = [];
  for (let a = fim; a >= m.anoInicio; a--) anos.push(a);
  return anos;
}

/** Localiza o metadado de um modelo específico. */
export function findModelo(marcaNome: string, modeloNome: string): VehicleModel | undefined {
  return vehicleDatabase.find((v) => v.marca === marcaNome && v.modelo === modeloNome);
}

/** Verdadeiro se o ano informado está dentro da faixa de produção do modelo. */
export function anoValido(marcaNome: string, modeloNome: string, ano: number): boolean {
  const m = findModelo(marcaNome, modeloNome);
  if (!m) return false;
  return ano >= m.anoInicio && ano <= (m.anoFim ?? ANO_ATUAL);
}

/** Busca livre por marca/modelo (útil para autocomplete). */
export function searchModelos(query: string, limit = 20): VehicleModel[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return vehicleDatabase
    .filter((v) => `${v.marca} ${v.modelo}`.toLowerCase().includes(q))
    .slice(0, limit);
}

/** Estatísticas do banco (marcas, modelos, cobertura de anos). */
export const dbStats = {
  totalModelos: vehicleDatabase.length,
  totalCarros: CARROS.length,
  totalMotos: MOTOS.length,
  marcasCarro: getMarcas("carro").length,
  marcasMoto: getMarcas("moto").length,
  anoMin: Math.min(...vehicleDatabase.map((v) => v.anoInicio)),
  anoMax: ANO_ATUAL,
};
