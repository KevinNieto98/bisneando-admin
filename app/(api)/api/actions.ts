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
  returnOtpInResponse?: boolean;    // solo para pruebas (no prod)
  allowAnonymous?: boolean;         // registro/forgot sin sesión
  email?: string;                   // sujeto explícito para anónimo
  replaceActive?: boolean;          // ⚠️ borra activos y crea NUEVO
  debug?: boolean;                  // habilita trazas detalladas
};

type VerifyParamsByEvent = { id_accion: string; otp: string; id_event: string };
type VerifyParamsByEmail = { id_accion: string; otp: string; email: string };
type VerifyParams = VerifyParamsByEvent | VerifyParamsByEmail;

type VerifyOptions = { debug?: boolean };
type VerifyResult =
  | { ok: true }
  | { ok: false; reason: string; message?: string; details?: Record<string, any> };

// ===== Helpers =====
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const shorten = (s?: string | null, head = 6, tail = 6) =>
  s ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

const normalizeOtp = (s: string) => s.normalize("NFKC").replace(/\D+/g, "");
const normalizeEmail = (s: string | undefined | null) =>
  (s ?? "").toString().trim().toLowerCase();

function dbgLog(debug: boolean | undefined, tag: string, obj: any) {
  if (!debug) return;
  if (process.env.NODE_ENV === "production") return;
  console.debug(`[OTP DEBUG:${tag}]`, obj);
}

function fail(
  reason: string,
  message: string | undefined,
  details: Record<string, any> | undefined,
  debug: boolean | undefined
): VerifyResult {
  const base: any = { ok: false, reason };
  if (message) base.message = message;
  if (debug && process.env.NODE_ENV !== "production" && details) base.details = details;
  return base;
}

// ===== Debug helpers (generate) =====
type OpRec = {
  at: string;         // ISO
  phase: string;      // insert/read/delete/final
  target: "anon" | "auth";
  action: string;     // INSERT/SELECT/UPDATE/DELETE
  ok: boolean;
  code?: string | null;
  err?: string | null;
  extra?: Record<string, any>;
};

function rec(
  ops: OpRec[],
  target: "anon" | "auth",
  phase: string,
  action: string,
  ok: boolean,
  code?: any,
  err?: any,
  extra?: Record<string, any>,
) {
  ops.push({
    at: new Date().toISOString(),
    phase,
    target,
    action,
    ok,
    code: code ? String(code) : null,
    err: err ? String(err) : null,
    extra,
  });
}

function throwDetailed(reason: string, ctx: any, ops: OpRec[]) {
  const payload = { reason, ...ctx, ops };
  throw new Error(`[OTP_GEN_FAIL:${reason}] ${JSON.stringify(payload)}`);
}

async function insertOtpRow(supabase: any, row: any) {
  return supabase
    .from("tbl_otp_event_log")
    .insert([row])
    .select("id_event, expires_at")
    .single();
}

// LECTURA de activo por uid/email
async function readActiveByUid(
  supabase: any,
  where: { uid?: string; email?: string },
  id_accion: string,
  nowIso: string
) {
  if (where.uid) {
    const { data, error } = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, expires_at")
      .eq("id_accion", id_accion)
      .eq("used", false)
      .gt("expires_at", nowIso)
      .eq("uid", where.uid)
      .order("event_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return data;
  }

  if (where.email) {
    // 1) match exacto
    let q1 = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, expires_at")
      .eq("id_accion", id_accion)
      .eq("used", false)
      .gt("expires_at", nowIso)
      .eq("email", where.email)
      .order("event_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!q1.error && q1.data) return q1.data;

    // 2) case-insensitive exacto
    let q2 = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, expires_at")
      .eq("id_accion", id_accion)
      .eq("used", false)
      .gt("expires_at", nowIso)
      .ilike("email", where.email)
      .order("event_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!q2.error && q2.data) return q2.data;

    return null;
  }

  return null;
}

// INVALIDACIÓN DURA: DELETE activos (email/uid) — OJO: delete() primero, filtros después
async function hardDeleteAllActive(
  supabase: any,
  where: { uid?: string; email?: string },
  id_accion: string,
  nowIso: string
): Promise<{ error: any; deleted: number; pass: "uid" | "email" | "email_ilike" | "none" }> {
  const runDel = async (
    pass: "uid" | "email" | "email_ilike",
    field: "uid" | "email",
    value: string,
    useILike = false
  ) => {
    let q = supabase
      .from("tbl_otp_event_log")
      .delete()
      .eq("id_accion", id_accion)
      .eq("used", false)
      .gt("expires_at", nowIso);

    q = field === "uid"
      ? q.eq("uid", value)
      : (useILike ? q.ilike("email", value) : q.eq("email", value));

    const { data, error } = await q.select("id_event");
    const deleted = Array.isArray(data) ? data.length : 0;
    return { error, deleted, pass };
  };

  if (where.uid) {
    const res = await runDel("uid", "uid", where.uid);
    return { error: res.error, deleted: res.deleted, pass: res.pass };
  }

  if (where.email) {
    // 1) exacto
    const exact = await runDel("email", "email", where.email, false);
    if (!exact.error && exact.deleted > 0) return exact;

    // 2) case-insensitive exacto
    const ci = await runDel("email_ilike", "email", where.email, true);
    return { error: ci.error, deleted: ci.deleted, pass: ci.pass };
  }

  return { error: null, deleted: 0, pass: "none" };
}

// ============ GENERATE ============
export async function generateOtpAction({
  id_accion,
  ttlSeconds = 300,
  metadata = {},
  ip,
  user_agent,
  returnOtpInResponse = false,
  allowAnonymous = false,
  email,
  replaceActive = false,
  debug,
}: GenerateParams) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const ops: OpRec[] = [];
  let lastErrCode: string | null = null;
  let lastErrMsg: string | null = null;

  // === Rama autenticada ===
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (!userErr && user && !allowAnonymous) {
    const uid = user.id;

    const freshInsert = async () => {
      const expires_iso = new Date(Date.now() + ttlSeconds * 1000).toISOString();
      const otp = generateNumericOtp(6);
      const otp_hash = hashOtp(otp, { uid, id_accion, expires_at_iso: expires_iso });
      const { data, error } = await insertOtpRow(supabase, {
        uid,
        email: user.email ?? null,
        id_accion,
        otp_code_hash: otp_hash,
        expires_at: expires_iso,
        ip,
        user_agent,
        metadata,
        used: false,
      });
      return { data, error, otp, expires_iso };
    };

    // 1) Intento normal
    let ins = await freshInsert();
    if (!ins.error) {
      rec(ops, "auth", "insert1", "INSERT", true, null, null, { expires_at: ins.data!.expires_at });
      const includeOtp = returnOtpInResponse && process.env.NODE_ENV !== "production";
      dbgLog(debug, "AUTH_INSERT_OK", ins.data);
      return { ok: true, id_event: ins.data!.id_event, expires_at: ins.data!.expires_at, ...(includeOtp ? { otp: ins.otp } : {}) };
    } else {
      lastErrCode = (ins.error as any)?.code ?? null;
      lastErrMsg = (ins.error as any)?.message ?? String(ins.error);
      rec(ops, "auth", "insert1", "INSERT", false, lastErrCode, lastErrMsg);
      dbgLog(debug, "AUTH_INSERT_ERR", { code: lastErrCode, msg: lastErrMsg });
    }

    // Si no es conflicto, corta
    if (lastErrCode !== "23505") {
      throwDetailed("INSERT_ERROR_AUTH", { phase: "insert1", lastErrCode, lastErrMsg, replaceActive }, ops);
    }

    // 2) Sin reemplazo → reusar activo
    if (!replaceActive) {
      const existing = await readActiveByUid(supabase, { uid }, id_accion, nowIso);
      rec(ops, "auth", "read_active_reuse", "SELECT", !!existing, null, existing ? null : "not_found");
      if (!existing) throwDetailed("READ_ACTIVE_MISS_AUTH", { phase: "reuse", replaceActive, lastErrCode, lastErrMsg }, ops);
      return { ok: true, id_event: existing.id_event, expires_at: existing.expires_at };
    }

    // 3) Reemplazo DURO: DELETE → INSERT
    const del = await hardDeleteAllActive(supabase, { uid }, id_accion, nowIso);
    rec(ops, "auth", "delete_active", "DELETE", !del.error, (del as any)?.error?.code, (del as any)?.error?.message, { deleted: del.deleted, pass: del.pass });

    await sleep(80);

    ins = await freshInsert();
    if (!ins.error) {
      rec(ops, "auth", "insert_after_delete", "INSERT", true, null, null, { expires_at: ins.data!.expires_at });
      const includeOtp = returnOtpInResponse && process.env.NODE_ENV !== "production";
      return { ok: true, id_event: ins.data!.id_event, expires_at: ins.data!.expires_at, ...(includeOtp ? { otp: ins.otp } : {}) };
    }

    lastErrCode = (ins.error as any)?.code ?? null;
    lastErrMsg = (ins.error as any)?.message ?? String(ins.error);
    rec(ops, "auth", "insert_after_delete", "INSERT", false, lastErrCode, lastErrMsg);
    throwDetailed("UNABLE_TO_REGENERATE_AUTH", { phase: "after_delete", lastErrCode, lastErrMsg }, ops);
  }

  // === Rama anónima (Register / Forgot) ===
  if (!allowAnonymous) throwDetailed("NOT_AUTHENTICATED", { phase: "guard", allowAnonymous }, ops);
  const subjectEmail = normalizeEmail(email || (metadata as any)?.email);
  if (!subjectEmail) throwDetailed("EMAIL_REQUIRED", { phase: "guard", emailParam: email }, ops);

  const freshInsertAnon = async () => {
    const expires_iso = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const otp = generateNumericOtp(6);
    const otp_hash = hashOtp(otp, { uid: subjectEmail, id_accion, expires_at_iso: expires_iso });
    const { data, error } = await insertOtpRow(supabase, {
      uid: null,
      email: subjectEmail,
      id_accion,
      otp_code_hash: otp_hash,
      expires_at: expires_iso,
      ip,
      user_agent,
      metadata,
      used: false,
    });
    return { data, error, otp, expires_iso };
  };

  // 1) Intento normal
  let insAnon = await freshInsertAnon();
  if (!insAnon.error) {
    rec(ops, "anon", "insert1", "INSERT", true, null, null, { expires_at: insAnon.data!.expires_at });
    const includeOtp = returnOtpInResponse && process.env.NODE_ENV !== "production";
    dbgLog(debug, "ANON_INSERT_OK", insAnon.data);
    return { ok: true, id_event: insAnon.data!.id_event, expires_at: insAnon.data!.expires_at, ...(includeOtp ? { otp: insAnon.otp } : {}) };
  } else {
    lastErrCode = (insAnon.error as any)?.code ?? null;
    lastErrMsg = (insAnon.error as any)?.message ?? String(insAnon.error);
    rec(ops, "anon", "insert1", "INSERT", false, lastErrCode, lastErrMsg);
    dbgLog(debug, "ANON_INSERT_ERR", { code: lastErrCode, msg: lastErrMsg });
  }

  // Si no es conflicto, corta
  if (lastErrCode !== "23505") {
    throwDetailed("INSERT_ERROR_ANON", { phase: "insert1", lastErrCode, lastErrMsg, replaceActive, email: subjectEmail }, ops);
  }

  // 2) Sin reemplazo → reusar activo
  if (!replaceActive) {
    const existing = await readActiveByUid(supabase, { email: subjectEmail }, id_accion, nowIso);
    rec(ops, "anon", "read_active_reuse", "SELECT", !!existing, null, existing ? null : "not_found");
    if (!existing) throwDetailed("READ_ACTIVE_MISS_ANON", { phase: "reuse", replaceActive, lastErrCode, lastErrMsg, email: subjectEmail }, ops);
    return { ok: true, id_event: existing.id_event, expires_at: existing.expires_at };
  }

  // 3) Reemplazo DURO: DELETE → INSERT
  const del = await hardDeleteAllActive(supabase, { email: subjectEmail }, id_accion, nowIso);
  rec(ops, "anon", "delete_active", "DELETE", !del.error, (del as any)?.error?.code, (del as any)?.error?.message, { deleted: del.deleted, pass: del.pass });

  await sleep(80);

  insAnon = await freshInsertAnon();
  if (!insAnon.error) {
    rec(ops, "anon", "insert_after_delete", "INSERT", true, null, null, { expires_at: insAnon.data!.expires_at });
    const includeOtp = returnOtpInResponse && process.env.NODE_ENV !== "production";
    return { ok: true, id_event: insAnon.data!.id_event, expires_at: insAnon.data!.expires_at, ...(includeOtp ? { otp: insAnon.otp } : {}) };
  }

  lastErrCode = (insAnon.error as any)?.code ?? null;
  lastErrMsg = (insAnon.error as any)?.message ?? String(insAnon.error);
  rec(ops, "anon", "insert_after_delete", "INSERT", false, lastErrCode, lastErrMsg);
  throwDetailed("UNABLE_TO_REGENERATE_ANON", { phase: "after_delete", lastErrCode, lastErrMsg, deleted: del.deleted }, ops);
}

// ============ VERIFY ============
export async function verifyOtpAction(params: VerifyParams, opts: VerifyOptions = {}): Promise<VerifyResult> {
  const { debug = false } = opts;
  const supabase = await createClient();

  const id_accion = params.id_accion;
  const otpDigits = normalizeOtp((params as any).otp || "");
  const emailParam = "email" in params ? normalizeEmail((params as any).email) : undefined;

  dbgLog(debug, "INPUT", {
    id_accion,
    has_id_event: "id_event" in params && !!(params as any).id_event,
    email: emailParam,
    otpDigits,
  });

  if (!otpDigits || otpDigits.length !== 6) {
    return fail("BAD_FORMAT", "Formato de OTP inválido (deben ser 6 dígitos).", { otpDigits }, debug);
  }

  // --- 1) Verificación por id_event (preferida) ---
  let shouldFallbackToEmail = false;
  if ("id_event" in params && (params as any).id_event) {
    const id_event = (params as any).id_event as string;

    const { data: row, error } = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, email, expires_at, used, otp_code_hash, id_accion")
      .eq("id_event", id_event)
      .single();

    const errorSerialized = error ? JSON.stringify(error, null, 2) : null;
    dbgLog(debug, "FETCH_BY_EVENT", { id_event, error: errorSerialized, rowExists: !!row });

    if (error || !row) {
      if (emailParam) {
        dbgLog(debug, "EVENT_NOT_FOUND_TRY_EMAIL", { id_event, email: emailParam });
        shouldFallbackToEmail = true;
      } else {
        return fail("NOT_FOUND", "OTP no encontrado para el id_event proporcionado.", { id_event, error: errorSerialized }, debug);
      }
    } else {
      if (row.id_accion !== id_accion) {
        return fail("ACTION_MISMATCH", "La acción del OTP no coincide.", { expected_action: row.id_accion, got_action: id_accion, id_event }, debug);
      }
      if (row.used) {
        return fail("USED", "OTP ya utilizado.", { id_event, used: row.used }, debug);
      }
      if (!row.email) {
        return fail("EVENT_NO_EMAIL", "El evento OTP no tiene email asociado.", { id_event }, debug);
      }

      const rowEmail = normalizeEmail(row.email);
      const expires_at_raw = row.expires_at;
      const expires_at_canon = new Date(expires_at_raw).toISOString();
      const nowIso = new Date().toISOString();
      const expired = new Date(expires_at_canon) <= new Date(nowIso);

      dbgLog(debug, "EXPIRY_CHECK", {
        expires_at_raw,
        expires_at_canon,
        now: nowIso,
        expired,
        sameInstant: new Date(expires_at_canon).getTime() === new Date(expires_at_raw).getTime(),
      });

      if (expired) {
        return fail("EXPIRED", "OTP vencido.", { expires_at_raw, expires_at_canon, now: nowIso }, debug);
      }

      const expectedHash = hashOtp(otpDigits, {
        uid: rowEmail,
        id_accion,
        expires_at_iso: expires_at_canon,
      });
      const match = timingSafeEqualHex(expectedHash, row.otp_code_hash);

      dbgLog(debug, "HASH_COMPARE_EVENT", {
        salt_email: rowEmail,
        id_accion,
        expires_at_iso_raw: expires_at_raw,
        expires_at_iso_canon: expires_at_canon,
        expectedHash_short: shorten(expectedHash),
        storedHash_short: shorten(row.otp_code_hash),
        match,
      });

      if (!match) {
        return fail(
          "HASH_MISMATCH",
          "El código OTP no coincide.",
          {
            id_event,
            salt_email: rowEmail,
            expires_at_iso_raw: expires_at_raw,
            expires_at_iso_canon: expires_at_canon,
            expectedHash_short: shorten(expectedHash),
            storedHash_short: shorten(row.otp_code_hash),
          },
          debug
        );
      }

      const { error: upErr } = await supabase
        .from("tbl_otp_event_log")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("id_event", id_event);

      dbgLog(debug, "MARK_USED_EVENT", { id_event, update_error: upErr ? String(upErr) : null });

      if (upErr) {
        return fail("WRITE_ERROR", "No se pudo marcar el OTP como usado.", { id_event, error: String(upErr) }, debug);
      }

      return { ok: true };
    }
  }

  // --- 2) Verificación por email (fallback anónimo) ---
  if (emailParam || shouldFallbackToEmail) {
    const email = emailParam || "";

    if (!email) {
      return fail("BAD_PARAMS", "Debes enviar email para fallback por correo.", {}, debug);
    }

    const { data: rows, error } = await supabase
      .from("tbl_otp_event_log")
      .select("id_event, expires_at, used, otp_code_hash, id_accion")
      .eq("id_accion", id_accion)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .ilike("email", email) // búsqueda case-insensitive exacta
      .order("event_date", { ascending: false })
      .limit(5);

    dbgLog(debug, "FETCH_BY_EMAIL", {
      email,
      error: error ? JSON.stringify(error, null, 2) : null,
      count: rows?.length ?? 0,
    });

    if (error) {
      return fail("READ_ERROR", "No se pudo leer eventos OTP.", { email, error: String(error) }, debug);
    }
    if (!rows || rows.length === 0) {
      return fail("NO_ACTIVE_OTP", "No hay OTP activo o ya venció.", { email, id_accion }, debug);
    }

    let matchId: string | null = null;
    const checked: Array<Record<string, any>> = [];

    for (const row of rows) {
      if (row.id_accion !== id_accion) continue;

      const expires_at_raw = row.expires_at;
      const expires_at_canon = new Date(expires_at_raw).toISOString();

      const expectedHash = hashOtp(otpDigits, {
        uid: email,
        id_accion,
        expires_at_iso: expires_at_canon,
      });
      const match = timingSafeEqualHex(expectedHash, row.otp_code_hash);

      const item = {
        id_event: row.id_event,
        expires_at_raw,
        expires_at_canon,
        expectedHash_short: shorten(expectedHash),
        storedHash_short: shorten(row.otp_code_hash),
        match,
      };
      checked.push(item);

      dbgLog(debug, "HASH_COMPARE_EMAIL_ROW", { ...item });

      if (match) {
        matchId = row.id_event;
        break;
      }
    }

    if (!matchId) {
      return fail("HASH_MISMATCH", "El código OTP no coincide.", { email, checked }, debug);
    }

    const { error: upErr } = await supabase
      .from("tbl_otp_event_log")
      .update({ used: true, used_at: new Date().toISOString() })
      .eq("id_event", matchId);

    dbgLog(debug, "MARK_USED_EMAIL", { id_event: matchId, update_error: upErr ? String(upErr) : null });

    if (upErr) {
      return fail("WRITE_ERROR", "No se pudo marcar el OTP como usado.", { id_event: matchId, error: String(upErr) }, debug);
    }

    return { ok: true };
  }

  return fail("BAD_PARAMS", "Debes enviar id_event o email.", { paramsKeys: Object.keys(params || {}) }, debug);
}
