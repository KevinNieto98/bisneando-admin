import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // Usa variables NO públicas en server
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; // anon key

  if (!url || !anon) {
    throw new Error("Supabase URL/Key no definidos. Revisa SUPABASE_URL y SUPABASE_ANON_KEY.");
  }

  // Next 15: cookies() es async
  const cookieStore = (await cookies()) as any;

  return createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return cookieStore.get?.(name)?.value;
      },
      set(name: string, value: string, options?: any) {
        // Aquí SÍ tenemos que usar el store resuelto
        cookieStore.set?.(name, value, options);
      },
      remove(name: string, options?: any) {
        cookieStore.set?.(name, "", { ...options, maxAge: 0 });
      },
    },
  });
}
