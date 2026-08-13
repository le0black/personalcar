import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase (browser).
 *
 * As chaves vêm de variáveis de ambiente VITE_* (ver .env.example):
 *   VITE_SUPABASE_URL       -> URL do projeto (Settings → API)
 *   VITE_SUPABASE_ANON_KEY  -> chave pública "anon"
 *
 * A anon key é pública por design; a segurança vem das políticas de RLS
 * (Row Level Security) definidas no banco — ver supabase/schema.sql.
 */

const url = import.meta.env["VITE_SUPABASE_URL"] as string | undefined;
const anonKey = import.meta.env["VITE_SUPABASE_ANON_KEY"] as string | undefined;

/** true quando as duas variáveis estão preenchidas. */
export const isSupabaseConfigured = Boolean(url && anonKey);

/**
 * Instância única do cliente. Fica `null` se as env vars não estiverem
 * configuradas, para o build/SSR não quebrar antes do deploy.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Ajuda quando alguém esquece de configurar as chaves. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      "Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.",
    );
  }
  return supabase;
}
