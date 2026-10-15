import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase (SPEC-TECNICA §5/§26) carregado sob demanda:
 * o pacote @supabase/supabase-js só é baixado quando o ranking é usado,
 * mantendo o bundle inicial do jogo leve (SPEC-TECNICA §24).
 *
 * Usa apenas a publishable/anon key — a segurança fica nas RLS policies.
 * Retorna null sem configuração: o jogo continua funcionando offline (§20).
 */

let cachedClient: Promise<SupabaseClient | null> | null = null;

/** true quando as variáveis de ambiente do Supabase estão presentes. */
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  return Boolean(url && key);
}

export function getSupabaseClient(): Promise<SupabaseClient | null> {
  if (!cachedClient) {
    cachedClient = (async () => {
      if (!isSupabaseConfigured()) {
        return null;
      }
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
      const { createClient } = await import('@supabase/supabase-js');
      return createClient(url, key);
    })();
  }
  return cachedClient;
}
