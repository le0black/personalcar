import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dataLocalISO, parseNumero, type FuelType, type Refuel } from "@/lib/fuel-data";

type Props = {
  vehicleId: string;
  ultimoOdometro: number;
  /** Retorna true se salvou com sucesso (aí o formulário é limpo). */
  onAdd: (r: Refuel) => Promise<boolean> | boolean;
};

// Formata número no padrão pt-BR, sem zeros à direita desnecessários.
const fmt = (n: number, d: number) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace(".", ",") : "";

export function RefuelForm({ vehicleId, ultimoOdometro, onAdd }: Props) {
  const [data, setData] = useState(dataLocalISO());
  const [odometro, setOdometro] = useState("");
  const [litros, setLitros] = useState("");
  const [valor, setValor] = useState("");
  const [preco, setPreco] = useState("");
  const [combustivel, setCombustivel] = useState<FuelType>("Gasolina");
  const [posto, setPosto] = useState("");
  const [tanqueCheio, setTanqueCheio] = useState(true);
  const [observacoes, setObservacoes] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Preenchimento automático do trio litros / valor / preço.
  function onLitros(v: string) {
    setLitros(v);
    const l = parseNumero(v);
    const val = parseNumero(valor);
    const pr = parseNumero(preco);
    if (l > 0 && val > 0) setPreco(fmt(val / l, 3));
    else if (l > 0 && pr > 0) setValor(fmt(l * pr, 2));
  }
  function onValor(v: string) {
    setValor(v);
    const l = parseNumero(litros);
    const val = parseNumero(v);
    if (l > 0 && val > 0) setPreco(fmt(val / l, 3));
  }
  function onPreco(v: string) {
    setPreco(v);
    const l = parseNumero(litros);
    const pr = parseNumero(v);
    if (l > 0 && pr > 0) setValor(fmt(l * pr, 2));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const odo = parseNumero(odometro);
    const l = parseNumero(litros);
    let val = parseNumero(valor);
    let pr = parseNumero(preco);

    if (!odo) return setErro("Informe o hodômetro.");
    if (odo <= ultimoOdometro)
      return setErro(`O hodômetro deve ser maior que ${ultimoOdometro.toLocaleString("pt-BR")} km.`);
    if (!l || l <= 0) return setErro("Informe os litros abastecidos.");
    if ((!val || val <= 0) && (!pr || pr <= 0))
      return setErro("Informe o valor total ou o preço por litro.");

    // Deriva o que faltar (valor total é a âncora).
    if (val > 0) pr = val / l;
    else val = l * pr;

    setErro(null);
    setEnviando(true);
    try {
      const ok = await onAdd({
        id: `${vehicleId}-${Date.now()}`,
        vehicleId,
        data,
        odometro: odo,
        litros: l,
        precoLitro: Number(pr.toFixed(3)),
        valorTotal: Number(val.toFixed(2)),
        combustivel,
        tanqueCheio,
        posto: posto.trim() || "Não informado",
        observacoes: observacoes.trim() || null,
      });
      if (ok) {
        setData(dataLocalISO());
        setOdometro("");
        setLitros("");
        setValor("");
        setPreco("");
        setPosto("");
        setObservacoes("");
        setTanqueCheio(true);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5">
      <h3 className="font-display text-lg font-semibold">Novo abastecimento</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Informe litros e valor (o preço/litro é calculado) e marque se encheu o tanque.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="data">Data</Label>
          <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="odo">Hodômetro (km)</Label>
          <Input
            id="odo"
            inputMode="numeric"
            placeholder={String(ultimoOdometro + 400)}
            value={odometro}
            onChange={(e) => setOdometro(e.target.value)}
            className="numeral"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="litros">Litros</Label>
          <Input
            id="litros"
            inputMode="decimal"
            placeholder="38,5"
            value={litros}
            onChange={(e) => onLitros(e.target.value)}
            className="numeral"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="valor">Valor total (R$)</Label>
          <Input
            id="valor"
            inputMode="decimal"
            placeholder="234,72"
            value={valor}
            onChange={(e) => onValor(e.target.value)}
            className="numeral"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="preco">Preço por litro (R$)</Label>
          <Input
            id="preco"
            inputMode="decimal"
            placeholder="6,09"
            value={preco}
            onChange={(e) => onPreco(e.target.value)}
            className="numeral"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="comb">Combustível</Label>
          <Select value={combustivel} onValueChange={(v) => setCombustivel(v as FuelType)}>
            <SelectTrigger id="comb">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Gasolina", "Etanol", "Diesel", "GNV"].map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="posto">Posto</Label>
          <Input
            id="posto"
            placeholder="Posto Shell — Av. Brasil"
            value={posto}
            onChange={(e) => setPosto(e.target.value)}
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="obs">Observações</Label>
          <Textarea
            id="obs"
            rows={2}
            placeholder="Opcional — ex.: pneu calibrado, ar-condicionado ligado…"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />
        </div>
      </div>

      <label className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
        <Checkbox
          checked={tanqueCheio}
          onCheckedChange={(c) => setTanqueCheio(c === true)}
          aria-label="Tanque cheio"
        />
        <span className="min-w-0 text-sm">
          <span className="font-medium">Tanque cheio</span>
          <span className="block text-xs text-muted-foreground">
            Necessário entre dois abastecimentos para medir consumo com alta confiança.
          </span>
        </span>
      </label>

      {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}

      <Button type="submit" className="mt-5 w-full font-semibold" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar abastecimento"}
      </Button>
    </form>
  );
}
