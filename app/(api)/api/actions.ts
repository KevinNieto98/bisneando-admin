// app/(api)/otp/actions.ts
"use server";

import { generateNumericOtp, hashOtp, timingSafeEqualHex } from "@/lib/otp";
import { createClient } from "@/utils/supabase/server";

type GenerateParams = {
  id_accion: string;
  ttlSeconds?: number;              // por defecto 300 (5 min)
  metadata?: Record<string, any>;
  ip?: string;
  user_agent?: string;
  returnOtpInResponse?: boolean;    // solo para pruebas
  allowAnonymous?: boolean;         // 👈 NUEVO: permite registro sin sesión
  email?: string;                   // 👈 opcional: sujeto explícito (si no, toma de metadata.email)
};

export async function generateOtpAction({
  id_accion,
  ttlSeconds = 300,
  metadata = {},
  ip,
  user_agent,
  returnOtpInResponse = false,
  allowAnonymous = false,
  email, // sujeto explícito opcional
}: GenerateParams) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  // 👉 Modo autenticado (comportamiento original)
  if (!userErr && user && !allowAnonymous) {
    const uid = user.id;
    const now = new Date();
    const expires = new Date(now.getTime() + ttlSeconds * 1000);
    const expires_iso = expires.toISOString();

    const otp = generateNumericOtp(6);
    const otp_hash = hashOtp(otp, { uid, id_accion, expires_at_iso: expires_iso });

    const { data, error } = await supabase
      .from("tbl_otp_event_log")
      .insert([
        {
          uid,
          email: user.email ?? null, // 👈 si existe la columna
          id_accion,
          otp_code_hash: otp_hash,
          expires_at: expires_iso,
          ip,
          user_agent,
          metadata,
        },
      ])
      .select("id_event, expires_at")
      .single();

    if (error) {
      // 23505 = unique_violation (índice único parcial)
      if ((error as any).code === "23505") {
        throw new Error("Ya existe un OTP activo para esta acción.");
      }
      throw error;
    }

    const includeOtp = returnOtpInResponse && process.env.NODE_ENV !== "production";

    return {
      ok: true,
      id_event: data!.id_event,
      expires_at: data!.expires_at,
      ...(includeOtp ? { otp } : {}),
    };
  }

  // 👉 Modo anónimo (para Register / Forgot Password)
  if (!allowAnonymous) {
    throw new Error("No autenticado");
  }

  // El sujeto del OTP será el email. Primero prioriza parámetro, luego metadata.email
  const subjectEmail = (email || metadata?.email)?.toString().trim();
  if (!subjectEmail) {
    throw new Error("Email requerido para flujo anónimo");
  }

  const now = new Date();
  const expires = new Date(now.getTime() + ttlSeconds * 1000);
  const expires_iso = expires.toISOString();

  const otp = generateNumericOtp(6);

  // ⚠️ Usamos el email como "uid" en el salt del hash para mantener compatibilidad con hashOtp
  const otp_hash = hashOtp(otp, { uid: subjectEmail, id_accion, expires_at_iso: expires_iso });

  const { data, error } = await supabase
    .from("tbl_otp_event_log")
    .insert([
      {
        uid: null,                     // sin usuario
        email: subjectEmail,           // 👈 almacena el email para correlación
        id_accion,
        otp_code_hash: otp_hash,
        expires_at: expires_iso,
        ip,
        user_agent,
        metadata,
      },
    ])
    .select("id_event, expires_at")
    .single();

  if (error) {
    if ((error as any).code === "23505") {
      // Si tienes índice único para (email, id_accion, used=false) en anónimo
      throw new Error("Ya existe un OTP activo para esta acción.");
    }
    throw error;
  }

  const includeOtp = returnOtpInResponse && process.env.NODE_ENV !== "production";

  return {
    ok: true,
    id_event: data!.id_event,
    expires_at: data!.expires_at,
    ...(includeOtp ? { otp } : {}),
  };
}

type VerifyParams =
  | { id_accion: string; otp: string; id_event: string } // ✅ Recomendado para register
  | { id_accion: string; otp: string; email: string }    // anónimo (sin id_event)
  | { id_accion: string; otp: string }                   // autenticado (como antes)

export async function verifyOtpAction(params: VerifyParams) {
  const supabase = await createClient();

  // Intentamos sesión; si no hay, NO fallamos de inmediato (permitimos verificación anónima)
  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } as any }));

  // --- 1) Verificación por id_event (más robusta para registro) ---
  if ("id_event" in params && params.id_event) {
    const { id_accion, otp, id_event } = params;

    const { data: row, error } = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, email, uid, expires_at, used, otp_code_hash, id_accion")
      .eq("id_event", id_event)
      .eq("id_accion", id_accion)
      .single();

    if (error || !row) return { ok: false, reason: "OTP no encontrado." };
    if (row.used) return { ok: false, reason: "OTP ya utilizado." };
    if (new Date(row.expires_at) <= new Date()) return { ok: false, reason: "OTP vencido." };

    // Selecciona el "sujeto" del hash: uid (sesión) o email (anónimo)
    const subject = row.uid ?? row.email;
    const expectedHash = hashOtp(otp, {
      uid: String(subject), // ⚠️ usamos el mismo campo del salt
      id_accion,
      expires_at_iso: row.expires_at,
    });

    if (!timingSafeEqualHex(expectedHash, row.otp_code_hash)) {
      return { ok: false, reason: "OTP inválido." };
    }

    const { error: upErr } = await supabase
      .from("tbl_otp_event_log")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id_event", id_event);

    if (upErr) throw upErr;

    return { ok: true };
  }

  // --- 2) Verificación autenticada (comportamiento original) ---
  if (user && !("email" in params)) {
    const { id_accion, otp } = params as { id_accion: string; otp: string };
    const uid = user.id;

    const { data: rows, error } = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, expires_at, used, otp_code_hash")
      .eq("uid", uid)
      .eq("id_accion", id_accion)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("event_date", { ascending: false })
      .limit(5);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return { ok: false, reason: "No hay OTP activo o ya venció." };
    }

    let matchId: string | null = null;
    for (const row of rows) {
      const expectedHash = hashOtp(otp, {
        uid,
        id_accion,
        expires_at_iso: row.expires_at,
      });
      if (timingSafeEqualHex(expectedHash, row.otp_code_hash)) {
        matchId = row.id_event;
        break;
      }
    }

    if (!matchId) return { ok: false, reason: "OTP inválido." };

    const { error: upErr } = await supabase
      .from("tbl_otp_event_log")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id_event", matchId);

    if (upErr) throw upErr;

    return { ok: true };
  }

  // --- 3) Verificación anónima por email (si no mandas id_event) ---
  if ("email" in params && params.email) {
    const { id_accion, otp, email } = params as { id_accion: string; otp: string; email: string };

    const { data: rows, error } = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, expires_at, used, otp_code_hash")
      .eq("email", email)
      .eq("id_accion", id_accion)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .order("event_date", { ascending: false })
      .limit(5);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return { ok: false, reason: "No hay OTP activo o ya venció." };
    }

    let matchId: string | null = null;
    for (const row of rows) {
      const expectedHash = hashOtp(otp, {
        uid: email, // ⚠️ mismo salt que en generate anónimo
        id_accion,
        expires_at_iso: row.expires_at,
      });
      if (timingSafeEqualHex(expectedHash, row.otp_code_hash)) {
        matchId = row.id_event;
        break;
      }
    }

    if (!matchId) return { ok: false, reason: "OTP inválido." };

    const { error: upErr } = await supabase
      .from("tbl_otp_event_log")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id_event", matchId);

    if (upErr) throw upErr;

    return { ok: true };
  }

  return { ok: false, reason: "Parámetros insuficientes para verificar OTP." };
}
