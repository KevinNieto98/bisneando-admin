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
};

export async function generateOtpAction({
  id_accion,
  ttlSeconds = 300,
  metadata = {},
  ip,
  user_agent,
  returnOtpInResponse = false,
}: GenerateParams) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("No autenticado");

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
    // 23505 = unique_violation (por índice único parcial de OTP activo)
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

type VerifyParams = { id_accion: string; otp: string };

export async function verifyOtpAction({ id_accion, otp }: VerifyParams) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) throw new Error("No autenticado");

  const uid = user.id;

  // Buscar OTPs activos (no usados y no vencidos)
  const { data: rows, error } = await supabase
    .from("tbl_otp_event_log")
    .select("id_event, event_date, expires_at, used, otp_code_hash")
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

  // Normalmente será 1 fila por el índice único; iteramos por robustez
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
