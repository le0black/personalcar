import { AlertTriangle, Bell, BellRing, CheckCircle2, Fuel } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { brl, num } from "@/lib/fuel-data";

export type ReminderStatus = {
  kmRodados: number;
  kmRestantes: number;
  litrosRestantes: number;
  percentual: number;
  nivel: "ok" | "atencao" | "critico";
  custoEstimado: number;
};

export function computeReminder(
  odometroAtual: number,
  ultimoOdometro: number,
  autonomia: number,
  consumoMedio: number,
  precoMedio: number,
  limiteKm: number,
): ReminderStatus {
  const kmRodados = Math.max(0, odometroAtual - ultimoOdometro);
  const kmRestantes = Math.max(0, autonomia - kmRodados);
  const percentual = autonomia > 0 ? Math.min(100, (kmRestantes / autonomia) * 100) : 0;
  const litrosRestantes = consumoMedio > 0 ? kmRestantes / consumoMedio : 0;
  const nivel =
    kmRestantes <= limiteKm / 2 ? "critico" : kmRestantes <= limiteKm ? "atencao" : "ok";
  return {
    kmRodados,
    kmRestantes,
    litrosRestantes,
    percentual,
    nivel,
    custoEstimado: (autonomia / consumoMedio - litrosRestantes) * precoMedio,
  };
}

const nivelInfo = {
  ok: {
    icon: CheckCircle2,
    titulo: "Tanque tranquilo",
    classe: "bg-success/10 text-success",
    barra: "[&>div]:bg-success",
  },
  atencao: {
    icon: BellRing,
    titulo: "Já vale procurar um posto",
    classe: "bg-warning/10 text-warning",
    barra: "[&>div]:bg-warning",
  },
  critico: {
    icon: AlertTriangle,
    titulo: "Abasteça agora",
    classe: "bg-destructive/10 text-destructive",
    barra: "[&>div]:bg-destructive",
  },
} as const;

type Props = {
  odometroAtual: number;
  onOdometroChange: (v: number) => void;
  ultimoOdometro: number;
  limiteKm: number;
  onLimiteChange: (v: number) => void;
  ativo: boolean;
  onAtivoChange: (v: boolean) => void;
  status: ReminderStatus;
  autonomia: number;
  precoMedio: number;
  tanque: number;
};

export function ReminderPanel({
  odometroAtual,
  onOdometroChange,
  ultimoOdometro,
  limiteKm,
  onLimiteChange,
  ativo,
  onAtivoChange,
  status,
  autonomia,
  precoMedio,
  tanque,
}: Props) {
  const info = nivelInfo[status.nivel];
  const Icon = info.icon;
  const litrosParaEncher = Math.max(0, tanque - status.litrosRestantes);

  return (
    <div className="panel p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Bell className="size-4 shrink-0 text-primary" />
          <h3 className="truncate font-display text-lg font-semibold">Lembrete de abastecimento</h3>
        </div>
        <Switch checked={ativo} onCheckedChange={onAtivoChange} aria-label="Ativar lembrete" />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Baseado no consumo médio e na autonomia estimada de {num(autonomia, 0)} km por tanque.
      </p>

      {ativo ? (
        <>
          <div className={`mt-5 flex items-start gap-3 rounded-xl p-4 ${info.classe}`}>
            <Icon className="mt-0.5 size-5 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold">{info.titulo}</p>
              <p className="numeral mt-0.5 text-sm">
                restam ~{num(status.kmRestantes, 0)} km · {num(status.litrosRestantes, 1)} L no
                tanque
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs text-muted-foreground">
              <span className="truncate">Nível estimado do tanque</span>
              <span className="numeral shrink-0">{num(status.percentual, 0)}%</span>
            </div>
            <Progress value={status.percentual} className={`mt-2 h-2 ${info.barra}`} />
            <p className="numeral mt-2 text-xs text-muted-foreground">
              {num(status.kmRodados, 0)} km rodados desde o último abastecimento · encher custa ~
              {brl(litrosParaEncher * precoMedio)}
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="odoAtual">Odômetro atual (km)</Label>
              <Input
                id="odoAtual"
                inputMode="numeric"
                className="numeral"
                value={odometroAtual || ""}
                placeholder={String(ultimoOdometro)}
                onChange={(e) => onOdometroChange(Number(e.target.value.replace(/\D/g, "")))}
              />
              <p className="text-xs text-muted-foreground">
                Último registro: {ultimoOdometro.toLocaleString("pt-BR")} km
              </p>
            </div>

            <div className="grid gap-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                <Label htmlFor="limite" className="min-w-0 truncate">
                  Avisar quando faltarem
                </Label>
                <span className="numeral shrink-0 text-sm text-primary">{limiteKm} km</span>
              </div>
              <Slider
                id="limite"
                min={30}
                max={250}
                step={10}
                value={[limiteKm]}
                onValueChange={([v]) => onLimiteChange(v ?? limiteKm)}
              />
              <p className="text-xs text-muted-foreground">
                Alerta crítico com metade dessa distância ({Math.round(limiteKm / 2)} km).
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-5 flex items-center gap-2 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
          <Fuel className="size-4 shrink-0" />
          Lembrete desativado para este veículo.
        </p>
      )}
    </div>
  );
}
