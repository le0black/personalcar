import { useState } from "react";
import { Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useSession } from "@/lib/useSession";

/**
 * Protege o conteúdo: mostra a tela de login/cadastro enquanto não há sessão,
 * e renderiza os filhos quando o usuário está autenticado.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession();

  if (!isSupabaseConfigured) return <ConfigMissing />;
  if (loading) return <Splash>Carregando…</Splash>;
  if (!session) return <AuthScreen />;
  return <>{children}</>;
}

function Splash({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex items-center gap-3 text-muted-foreground">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Fuel className="size-5" />
        </div>
        <span className="text-sm">{children}</span>
      </div>
    </div>
  );
}

function ConfigMissing() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="panel max-w-md p-6 text-center">
        <h1 className="font-display text-lg font-semibold">Supabase não configurado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Defina <code className="text-foreground">VITE_SUPABASE_URL</code> e{" "}
          <code className="text-foreground">VITE_SUPABASE_ANON_KEY</code> nas variáveis de ambiente
          (ver <code className="text-foreground">SUPABASE_SETUP.md</code>) e recarregue.
        </p>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [modo, setModo] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setErro(null);
    setMsg(null);
    if (!email || senha.length < 6) {
      return setErro("Informe um e-mail e uma senha de pelo menos 6 caracteres.");
    }
    setEnviando(true);
    try {
      if (modo === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;
        // Se a confirmação de e-mail estiver ligada, não há sessão imediata.
        if (!data.session) {
          setMsg("Conta criada. Confirme pelo link enviado ao seu e-mail para entrar.");
        }
      }
    } catch (err) {
      setErro(traduzErro(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <Fuel className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">Abastece</h1>
            <p className="text-xs text-muted-foreground">
              {modo === "login" ? "Entre na sua conta" : "Crie sua conta"}
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="panel grid gap-4 p-5">
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete={modo === "login" ? "current-password" : "new-password"}
              placeholder="mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>

          {erro ? <p className="text-sm text-destructive">{erro}</p> : null}
          {msg ? <p className="text-sm text-success">{msg}</p> : null}

          <Button type="submit" className="w-full font-semibold" disabled={enviando}>
            {enviando ? "Aguarde…" : modo === "login" ? "Entrar" : "Criar conta"}
          </Button>

          <button
            type="button"
            onClick={() => {
              setModo(modo === "login" ? "signup" : "login");
              setErro(null);
              setMsg(null);
            }}
            className="text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {modo === "login"
              ? "Não tem conta? Criar agora"
              : "Já tem conta? Fazer login"}
          </button>
        </form>
      </div>
    </div>
  );
}

function traduzErro(err: unknown): string {
  const m = err instanceof Error ? err.message : String(err);
  if (/invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
  if (/user already registered/i.test(m)) return "Este e-mail já tem conta. Faça login.";
  if (/email not confirmed/i.test(m)) return "Confirme seu e-mail antes de entrar.";
  return m;
}
