import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { parseNumero, type Vehicle } from "@/lib/fuel-data";
import { VehicleIllustration } from "@/components/fuel/VehicleIllustration";
import {
  findModelo,
  getAnos,
  getMarcas,
  getModelos,
  getTipo,
  type VehicleCategory,
  type VehicleTipo,
} from "@/lib/vehicle-database";

type Props = {
  onAdd: (v: Vehicle) => void;
};

const emptyState = {
  categoria: "carro" as VehicleCategory,
  marca: "",
  modelo: "",
  ano: "",
  nome: "",
  placa: "",
  tanque: "",
};

export function VehicleForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(emptyState);
  const [erro, setErro] = useState<string | null>(null);

  const marcas = useMemo(() => getMarcas(f.categoria), [f.categoria]);
  const modelos = useMemo(
    () => (f.marca ? getModelos(f.marca, f.categoria) : []),
    [f.marca, f.categoria],
  );
  const anos = useMemo(
    () => (f.marca && f.modelo ? getAnos(f.marca, f.modelo) : []),
    [f.marca, f.modelo],
  );
  const tipoPreview: VehicleTipo = useMemo(() => {
    const meta = f.modelo ? findModelo(f.marca, f.modelo) : undefined;
    return meta ? getTipo(meta) : f.categoria;
  }, [f.marca, f.modelo, f.categoria]);

  function reset() {
    setF(emptyState);
    setErro(null);
  }

  // Trocar categoria zera a cascata dependente.
  function setCategoria(categoria: VehicleCategory) {
    setF({ ...emptyState, categoria });
    setErro(null);
  }

  function setMarca(marca: string) {
    setF((p) => ({ ...p, marca, modelo: "", ano: "", tanque: "", nome: p.nome }));
  }

  function setModelo(modelo: string) {
    const meta = findModelo(f.marca, modelo);
    setF((p) => ({
      ...p,
      modelo,
      ano: "",
      // pré-preenche tanque e apelido com base no banco (ambos editáveis)
      tanque: meta?.tanque ? String(meta.tanque) : p.tanque,
      nome: p.nome || modelo,
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.marca || !f.modelo || !f.ano) {
      return setErro("Selecione marca, modelo e ano.");
    }
    const tanque = parseNumero(f.tanque);
    if (!tanque || tanque <= 0) {
      return setErro("Informe a capacidade do tanque (litros).");
    }
    setErro(null);
    onAdd({
      id: `v-${Date.now()}`,
      nome: f.nome.trim() || f.modelo,
      placa: f.placa.trim().toUpperCase() || "Sem placa",
      modelo: `${f.marca} ${f.modelo}`,
      ano: Number(f.ano),
      tanque,
    });
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Adicionar veículo"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Adicionar veículo</DialogTitle>
          <DialogDescription>
            Escolha marca, modelo e ano — a lista cobre carros e motos de 1970 até hoje.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          {/* Categoria */}
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <div className="flex gap-1 rounded-full border border-border bg-card p-1">
              {(["carro", "moto"] as VehicleCategory[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  className={`flex-1 rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    f.categoria === c
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Prévia da ilustração */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card/50 p-3">
            <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <VehicleIllustration tipo={tipoPreview} className="w-10" />
            </div>
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium">
                {f.modelo ? `${f.marca} ${f.modelo}` : "Prévia do veículo"}
              </p>
              <p className="text-xs capitalize text-muted-foreground">{tipoPreview}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Marca */}
            <div className="grid gap-2">
              <Label>Marca</Label>
              <Select value={f.marca} onValueChange={setMarca}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {marcas.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modelo */}
            <div className="grid gap-2">
              <Label>Modelo</Label>
              <Select value={f.modelo} onValueChange={setModelo} disabled={!f.marca}>
                <SelectTrigger>
                  <SelectValue placeholder={f.marca ? "Selecione" : "Escolha a marca"} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {modelos.map((m) => (
                    <SelectItem key={m.modelo} value={m.modelo}>
                      {m.modelo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Ano */}
            <div className="grid gap-2">
              <Label>Ano</Label>
              <Select
                value={f.ano}
                onValueChange={(ano) => setF((p) => ({ ...p, ano }))}
                disabled={!f.modelo}
              >
                <SelectTrigger>
                  <SelectValue placeholder={f.modelo ? "Selecione" : "Escolha o modelo"} />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {anos.map((a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tanque */}
            <div className="grid gap-2">
              <Label htmlFor="tanque">Tanque (L)</Label>
              <Input
                id="tanque"
                inputMode="numeric"
                placeholder="50"
                value={f.tanque}
                onChange={(e) => setF((p) => ({ ...p, tanque: e.target.value }))}
                className="numeral"
              />
            </div>

            {/* Apelido */}
            <div className="grid gap-2">
              <Label htmlFor="nome">Apelido</Label>
              <Input
                id="nome"
                placeholder="Ex.: Meu carro"
                value={f.nome}
                onChange={(e) => setF((p) => ({ ...p, nome: e.target.value }))}
              />
            </div>

            {/* Placa */}
            <div className="grid gap-2">
              <Label htmlFor="placa">Placa</Label>
              <Input
                id="placa"
                placeholder="ABC-1D23"
                value={f.placa}
                onChange={(e) => setF((p) => ({ ...p, placa: e.target.value }))}
                className="uppercase"
              />
            </div>
          </div>

          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

          <Button type="submit" className="w-full font-semibold">
            Adicionar veículo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
