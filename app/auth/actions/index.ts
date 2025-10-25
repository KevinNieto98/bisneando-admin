'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation';

export type Platform = 'WEB' | 'APP';

export type LoginResult = {
  success: boolean;
  message: string;
  code?: string;
  status?: number;
};

/**
 * Inicia sesión y valida el perfil según la plataforma:
 * - platform = 'APP'  => se requiere perfil === 1
 * - platform = 'WEB'  => se requiere perfil === 2
 *
 * Orden de obtención de perfil:
 * 1) tbl_usuarios.id_perfil (preferido)
 * 2) user.user_metadata.id_perfil (fallback)
 */
export async function login(
  _prevState: LoginResult | null,
  formData: FormData,
  platform: Platform = 'WEB'
): Promise<LoginResult> {
  const supabase = await createClient();

  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const password = (formData.get("password") as string | null) ?? "";

  if (!email || !password) {
    return { success: false, message: "Correo y contraseña son requeridos." };
  }

  // 1) Login
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error("Supabase login error:", signInError);
    return {
      success: false,
      message: signInError.message,
      code: (signInError as any)?.code,
      status: (signInError as any)?.status,
    };
  }

  // 2) Obtener usuario autenticado
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    await supabase.auth.signOut();
    return { success: false, message: "No se pudo obtener el usuario autenticado." };
  }

  const user = userData.user;

  // 3) Obtener id_perfil
  const perfil = await getPerfilSeguro(supabase, user.id, user.user_metadata);

  // 4) Validar según plataforma
  const requiredPerfil = platform === 'APP' ? 1 : 2;

  if (perfil !== requiredPerfil) {
    await supabase.auth.signOut();
    return {
      success: false,
      message:
        platform === 'APP'
          ? "Privilegios insuficientes."
          : "Privilegios insuficientes.",
    };
  }

  // 5) OK
  revalidatePath("/", "layout");
  return { success: true, message: "Inicio de sesión exitoso" };
}

/** Helper: intenta leer id_perfil desde tbl_usuarios y, si no, desde user_metadata */
async function getPerfilSeguro(
  supabase: any,
  userId: string,
  userMetadata: Record<string, unknown> | undefined
): Promise<number | null> {
  const { data: perfilRow, error: perfilErr } = await supabase
    .from("tbl_usuarios")
    .select("id_perfil")
    .eq("id", userId) // FK a auth.users.id
    .single();

  if (!perfilErr && perfilRow && perfilRow.id_perfil != null) {
    const num = Number(perfilRow.id_perfil);
    return Number.isFinite(num) ? num : null;
  }

  const metaPerfil = (userMetadata as any)?.id_perfil;
  if (metaPerfil != null) {
    const num = Number(metaPerfil);
    return Number.isFinite(num) ? num : null;
  }

  return null;
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

  // 2) userId (aunque no haya sesión si requiere confirmación)
  const userId = data.user?.id;

  if (!userId) {
    return { ok: true, status: "pending_confirmation" };
  }

  // 3) Crear/actualizar perfil de la app
  const { error: profileError } = await supabase.from("tbl_usuarios").upsert(
    {
      id: userId, // FK a auth.users
      nombre: payload.nombre,
      apellido: payload.apellido,
      phone: payload.telefono,
      email: payload.correo,
      id_perfil: payload.id_perfil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return { ok: false, message: profileError.message };
  }

  // 4) Éxito
  const pending = data.session == null;
  return { ok: true, status: pending ? "pending_confirmation" : "created" };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = (formData.get("password") as string)?.trim();
  const confirm  = (formData.get("confirm") as string)?.trim();

  if (!password || !confirm) redirect("/auth/reset?err=required");
  if (password.length < 8)    redirect("/auth/reset?err=weak");
  if (password !== confirm)   redirect("/auth/reset?err=nomatch");

  // ✅ Debes tener recovery session (via exchangeRecoveryCode) antes de esto
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    redirect("/auth/login?err=recovery-session");
  }

  const { data, error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("updateUser error:", error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/auth/reset/complete");
}

export async function exchangeRecoveryCode(formData: FormData) {
  const code = (formData.get("code") as string | undefined)?.trim();
  if (!code) redirect("/auth/login?err=missing-code");

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[exchangeRecoveryCode] error:", error);
    redirect("/auth/login?err=invalid-code");
  }

  // Cookies listas; vuelve al formulario de reset (sin el code en la URL)
  redirect("/auth/reset");
}

export async function sendResetLinkAction(userId: string): Promise<{ ok: boolean; message?: string }> {
  const supabase = await createClient();

  // 1) Obtener el correo del usuario
  const { data: rec, error: qErr } = await supabase
    .from("tbl_usuarios")
    .select("email")
    .eq("id", userId)
    .single();

  if (qErr || !rec?.email) {
    return { ok: false, message: "No se encontró el correo del usuario." };
  }

  // 2) Enviar link de recuperación
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const redirectTo = `${siteUrl}/auth/reset`; // Configurar en Supabase → Auth → Redirect URLs

  const { error } = await supabase.auth.resetPasswordForEmail(rec.email, { redirectTo });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
