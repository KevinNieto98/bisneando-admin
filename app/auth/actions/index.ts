'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/utils/supabase/server'



export type LoginResult = { success: boolean; message: string; code?: string; status?: number };

export async function login(
  _prevState: LoginResult | null,
  formData: FormData
): Promise<LoginResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    // log para debug
    console.error("Supabase login error:", error);
    return { success: false, message: error.message, code: (error as any).code, status: (error as any).status };
  }

  revalidatePath("/", "layout");
  return { success: true, message: "Inicio de sesión exitoso" };
}
export type SignupPayload = {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  password: string;
  id_perfil: number;
};

export type SignupResult =
  | { ok: true; status: "created" | "pending_confirmation" }
  | { ok: false; message: string };

export async function signupAction(payload: SignupPayload): Promise<SignupResult> {
  const supabase = await createClient();

  // 1) Registro en Auth (email/password)
  const { data, error } = await supabase.auth.signUp({
    email: payload.correo,
    password: payload.password,
    options: {
      // metadata opcional; visible como user.user_metadata
      data: {
        first_name: payload.nombre,
        last_name: payload.apellido,
        phone: payload.telefono,
        id_perfil: payload.id_perfil,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  // 2) Si el proyecto requiere confirmación por correo, no habrá sesión activa.
  //    Aun así, suele venir el user con su id (aunque session sea null),
  //    que podemos usar para crear el perfil. Si no viene, devolvemos pending.
  const userId = data.user?.id;

  if (!userId) {
    return { ok: true, status: "pending_confirmation" };
  }

  // 3) Crear/actualizar perfil de la app (opcional pero recomendado)
  //    Asegúrate de tener una tabla `profiles` (o similar) con PK = uuid del auth.user
  const { error: profileError } = await supabase.from("tbl_usuarios").upsert(
    {
      id: userId, // FK a auth.users
      full_name: `${payload.nombre} ${payload.apellido}`.trim(),
      phone: payload.telefono,
      email: payload.correo,
      id_perfil: payload.id_perfil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    // Podrías hacer rollback manual borrando el usuario en auth si lo prefieres.
    return { ok: false, message: profileError.message };
  }

  // 4) Éxito
  //    Si tu proyecto tiene confirmación de email activa, considera devolver "pending_confirmation".
  const pending = data.session == null; // sin sesión => probablemente pendiente de confirmar correo
  return { ok: true, status: pending ? "pending_confirmation" : "created" };
}
