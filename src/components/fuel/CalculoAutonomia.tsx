import { AlertTriangle } from "lucide-react";
import { confiancaLabel, num, type EventoTanque, type TanqueVirtual } from "@/lib/fuel-data";

const dataCurta = (iso?: string) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
    : "";
const km = (n: number) => `${n.toLocaleString("pt-BR")} km`;

/**
 * "Como calculei": a conta da autonomia passo a passo, a partir do último
 * tanque cheio, para o usuário conferir com os próprios números.
 */
export function CalculoAutonomia({ tanque }: { tanque: TanqueVirtual }) {
  const cu = tanque.consumoUtilizado;
  if (tanque.semDados || cu == null) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há consumo para calcular. Registre abastecimentos (de preferência com tanque
        cheio).
      </p>
    );
  }

  const ext = tanque.extrato;
  const ultimaCal = ext.map((e) => e.tipo).lastIndexOf("CALIBRACAO");
  const passos = ultimaCal >= 0 ? ext.slice(ultimaCal) : ext;
  const suspeitos = ext.filter((e) => e.suspeito);

  return (
    <div className="grid gap-4 text-sm">
      {!tanque.calibrado ? (
        <Aviso>
          Não há nenhum <b>tanque cheio</b> registrado. Sem ele não dá para saber quanto havia no
          tanque antes do primeiro registro, então a conta parte de 0 L e a autonomia real tende a
          ser <b>maior</b>. No próximo abastecimento, encha até a bomba desarmar e marque “Tanque
          cheio”.
        </Aviso>
      ) : null}

      {suspeitos.length > 0 ? (
        <Aviso>
          {suspeitos.length === 1 ? "Um abastecimento marcado" : "Abastecimentos marcados"} como
          tanque cheio parece{suspeitos.length === 1 ? "" : "m"} parcial (litros de menos para
          completar):{" "}
          {suspeitos.map((e) => `${dataCurta(e.data)} (${num(e.litros, 1)} L)`).join(", ")}. Isso
          zera o medidor no tanque cheio e distorce a média. Se foi parcial, edite em Detalhes e
          desmarque “Tanque cheio”.
        </Aviso>
      ) : null}

      <ol className="grid gap-1.5">
        {passos.map((e, i) => (
          <Passo key={i} e={e} anterior={i > 0 ? passos[i - 1] : undefined} cu={cu} />
        ))}
      </ol>

      <div className="rounded-xl bg-secondary/60 p-3">
        <p className="numeral text-base font-semibold">
          {num(tanque.litros ?? 0, 1)} L × {num(cu, 1)} km/l = {km(tanque.autonomia ?? 0)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {num(cu, 1)} km/l é a média ponderada dos seus trechos medidos (mais peso aos recentes)
          {tanque.confianca ? ` · ${confiancaLabel[tanque.confianca]}` : ""}.
        </p>
      </div>
    </div>
  );
}

function Passo({
  e,
  anterior,
  cu,
}: {
  e: EventoTanque;
  anterior: EventoTanque | undefined;
  cu: number;
}) {
  if (e.tipo === "CONSUMO") {
    const rodados = anterior ? e.odometro - anterior.odometro : Math.round(-e.litros * cu);
    return (
      <li className="numeral flex justify-between gap-3 text-muted-foreground">
        <span>
          rodou {km(rodados)} ÷ {num(cu, 1)} = −{num(-e.litros, 1)} L
        </span>
        <span className="shrink-0 whitespace-nowrap">{num(e.saldo, 1)} L</span>
      </li>
    );
  }
  return (
    <li className="numeral flex justify-between gap-3 font-medium">
      <span className="min-w-0">
        {dataCurta(e.data)} · {km(e.odometro)} ·{" "}
        {e.tipo === "CALIBRACAO" ? "tanque cheio" : `+${num(e.litros, 1)} L`}
        {e.suspeito ? <AlertTriangle className="ml-1 inline size-3.5 text-warning" /> : null}
      </span>
      <span className="shrink-0 whitespace-nowrap">{num(e.saldo, 1)} L</span>
    </li>
  );
}

function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-foreground">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
      <span>{children}</span>
    </p>
  );
}
