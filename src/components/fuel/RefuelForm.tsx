import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export function RefuelForm({ vehicleId, ultimoOdometro, onAdd }: Props) {
  const [odometro, setOdometro] = useState("");
  const [litros, setLitros] = useState("");
  const [preco, setPreco] = useState("");
  const [posto, setPosto] = useState("");
  const [combustivel, setCombustivel] = useState<FuelType>("Gasolina");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    const odo = parseNumero(odometro);
    const l = parseNumero(litros);
    const p = parseNumero(preco);
    if (!odo || !l || !p) return setErro("Preencha odômetro, litros e preço.");
    if (odo <= ultimoOdometro)
      return setErro(`O odômetro deve ser maior que ${ultimoOdometro.toLocaleString("pt-BR")} km.`);
    setErro(null);
    setEnviando(true);
    try {
      const ok = await onAdd({
        id: `${vehicleId}-${Date.now()}`,
        vehicleId,
        data: dataLocalISO(),
        odometro: odo,
        litros: l,
        precoLitro: p,
        combustivel,
        tanqueCheio: true,
        posto: posto || "Não informado",
      });
      // Só limpa se salvou — assim não se perde o que foi digitado numa falha.
      if (ok) {
        setOdometro("");
        setLitros("");
        setPreco("");
        setPosto("");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel p-5">
      <h3 className="font-display text-lg font-semibold">Registrar abastecimento</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Sempre com tanque cheio para o cálculo de consumo ficar preciso.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="odo">Odômetro (km)</Label>
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
            placeholder="38.5"
            value={litros}
            onChange={(e) => setLitros(e.target.value)}
            className="numeral"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="preco">Preço por litro (R$)</Label>
          <Input
            id="preco"
            inputMode="decimal"
            placeholder="6.09"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
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
      </div>

      {erro ? <p className="mt-3 text-sm text-destructive">{erro}</p> : null}

      <Button type="submit" className="mt-5 w-full font-semibold" disabled={enviando}>
        {enviando ? "Salvando…" : "Salvar abastecimento"}
      </Button>
    </form>
  );
}
