import { useState } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { brl, num, parseNumero, type FuelType, type Refuel } from "@/lib/fuel-data";

type Props = {
  refuel: Refuel;
  onSave: (patch: Partial<Omit<Refuel, "id" | "vehicleId">>) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

const fmt = (n: number, d: number) =>
  Number.isFinite(n) ? Number(n.toFixed(d)).toString().replace(".", ",") : "";

export function RefuelItem({ refuel, onSave, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState(refuel.data);
  const [odometro, setOdometro] = useState(String(refuel.odometro));
  const [litros, setLitros] = useState(String(refuel.litros));
  const [valor, setValor] = useState(
    String(refuel.valorTotal ?? refuel.litros * refuel.precoLitro),
  );
  const [preco, setPreco] = useState(String(refuel.precoLitro));
  const [combustivel, setCombustivel] = useState<FuelType>(refuel.combustivel);
  const [posto, setPosto] = useState(refuel.posto);
  const [tanqueCheio, setTanqueCheio] = useState(refuel.tanqueCheio);
  const [observacoes, setObservacoes] = useState(refuel.observacoes ?? "");
  const [erro, setErro] = useState<string | null>(null);

  function onOpenChange(o: boolean) {
    if (o) {
      setData(refuel.data);
      setOdometro(String(refuel.odometro));
      setLitros(String(refuel.litros));
      setValor(String(refuel.valorTotal ?? refuel.litros * refuel.precoLitro));
      setPreco(String(refuel.precoLitro));
      setCombustivel(refuel.combustivel);
      setPosto(refuel.posto);
      setTanqueCheio(refuel.tanqueCheio);
      setObservacoes(refuel.observacoes ?? "");
      setErro(null);
    }
    setOpen(o);
  }

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
    const odo = parseNumero(odometro);
    const l = parseNumero(litros);
    let val = parseNumero(valor);
    let pr = parseNumero(preco);
    if (!odo || !l) return setErro("Preencha hodômetro e litros.");
    if ((!val || val <= 0) && (!pr || pr <= 0))
      return setErro("Informe o valor total ou o preço por litro.");
    if (val > 0) pr = val / l;
    else val = l * pr;
    setErro(null);
    await onSave({
      data,
      odometro: odo,
      litros: l,
      precoLitro: Number(pr.toFixed(3)),
      valorTotal: Number(val.toFixed(2)),
      combustivel,
      posto: posto.trim() || "Não informado",
      tanqueCheio,
      observacoes: observacoes.trim() || null,
    });
    setOpen(false);
  }

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="numeral text-sm font-medium">
          {new Date(refuel.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
          {refuel.odometro.toLocaleString("pt-BR")} km
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">
            {refuel.posto} · {refuel.combustivel}
          </span>
          {!refuel.tanqueCheio ? (
            <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-warning">
              parcial
            </span>
          ) : null}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div className="text-right">
          <p className="numeral text-sm font-semibold">
            {brl(refuel.valorTotal ?? refuel.litros * refuel.precoLitro)}
          </p>
          <p className="numeral mt-1 text-xs text-muted-foreground">
            {num(refuel.litros, 1)} L · {brl(refuel.precoLitro)}/l
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Editar */}
          <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
              <button
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Editar abastecimento"
                title="Editar"
              >
                <Pencil className="size-4" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">Editar abastecimento</DialogTitle>
                <DialogDescription>Ajuste os dados e salve.</DialogDescription>
              </DialogHeader>
              <form onSubmit={submit} className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="ed-data">Data</Label>
                    <Input
                      id="ed-data"
                      type="date"
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ed-odo">Odômetro (km)</Label>
                    <Input
                      id="ed-odo"
                      inputMode="numeric"
                      value={odometro}
                      onChange={(e) => setOdometro(e.target.value)}
                      className="numeral"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ed-litros">Litros</Label>
                    <Input
                      id="ed-litros"
                      inputMode="decimal"
                      value={litros}
                      onChange={(e) => onLitros(e.target.value)}
                      className="numeral"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ed-valor">Valor total (R$)</Label>
                    <Input
                      id="ed-valor"
                      inputMode="decimal"
                      value={valor}
                      onChange={(e) => onValor(e.target.value)}
                      className="numeral"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ed-preco">Preço por litro (R$)</Label>
                    <Input
                      id="ed-preco"
                      inputMode="decimal"
                      value={preco}
                      onChange={(e) => onPreco(e.target.value)}
                      className="numeral"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ed-comb">Combustível</Label>
                    <Select
                      value={combustivel}
                      onValueChange={(v) => setCombustivel(v as FuelType)}
                    >
                      <SelectTrigger id="ed-comb">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Gasolina", "Etanol", "Diesel", "GNV"].map((fuel) => (
                          <SelectItem key={fuel} value={fuel}>
                            {fuel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="ed-posto">Posto</Label>
                    <Input
                      id="ed-posto"
                      value={posto}
                      onChange={(e) => setPosto(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label htmlFor="ed-obs">Observações</Label>
                    <Textarea
                      id="ed-obs"
                      rows={2}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
                  <Checkbox
                    checked={tanqueCheio}
                    onCheckedChange={(c) => setTanqueCheio(c === true)}
                    aria-label="Tanque cheio"
                  />
                  <span className="text-sm font-medium">Tanque cheio</span>
                </label>

                {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

                <Button type="submit" className="w-full font-semibold">
                  Salvar alterações
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Excluir */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                aria-label="Excluir abastecimento"
                title="Excluir"
              >
                <Trash2 className="size-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir abastecimento?</AlertDialogTitle>
                <AlertDialogDescription>
                  {new Date(refuel.data + "T00:00:00").toLocaleDateString("pt-BR")} ·{" "}
                  {refuel.odometro.toLocaleString("pt-BR")} km · {num(refuel.litros, 1)} L. Esta
                  ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </li>
  );
}
