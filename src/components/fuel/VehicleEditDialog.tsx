import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import type { Vehicle } from "@/lib/fuel-data";

type Props = {
  vehicle: Vehicle;
  onSave: (patch: Pick<Vehicle, "nome" | "placa" | "tanque">) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

export function VehicleEditDialog({ vehicle, onSave, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(vehicle.nome);
  const [placa, setPlaca] = useState(vehicle.placa);
  const [tanque, setTanque] = useState(String(vehicle.tanque));
  const [erro, setErro] = useState<string | null>(null);

  // Recarrega os campos ao (re)abrir, caso o veículo tenha mudado.
  function onOpenChange(o: boolean) {
    if (o) {
      setNome(vehicle.nome);
      setPlaca(vehicle.placa);
      setTanque(String(vehicle.tanque));
      setErro(null);
    }
    setOpen(o);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(tanque);
    if (!t || t <= 0) return setErro("Informe a capacidade do tanque (litros).");
    setErro(null);
    await onSave({
      nome: nome.trim() || vehicle.nome,
      placa: placa.trim().toUpperCase() || "Sem placa",
      tanque: t,
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Editar veículo"
          title="Editar veículo"
        >
          <Pencil className="size-4" />
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Editar veículo</DialogTitle>
          <DialogDescription>
            {vehicle.modelo} · {vehicle.ano}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-nome">Apelido</Label>
              <Input
                id="edit-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Meu carro"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-placa">Placa</Label>
              <Input
                id="edit-placa"
                value={placa}
                onChange={(e) => setPlaca(e.target.value)}
                className="uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-tanque">Tanque (L)</Label>
              <Input
                id="edit-tanque"
                inputMode="numeric"
                value={tanque}
                onChange={(e) => setTanque(e.target.value)}
                className="numeral"
              />
            </div>
          </div>

          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}

          <div className="flex items-center justify-between gap-3 pt-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-sm font-medium text-destructive transition-colors hover:text-destructive/80"
                >
                  <Trash2 className="size-4" />
                  Excluir
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir {vehicle.nome}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso remove o veículo e <strong>todos os abastecimentos</strong> ligados a ele.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await onDelete();
                      setOpen(false);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" className="font-semibold">
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
