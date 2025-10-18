// app/api/otp/generate/route.ts
import { generateOtpAction } from "@/app/(api)/api/actions";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Acciones públicas permitidas sin sesión (registro, recuperación, etc.)
const PUBLIC_ACTIONS = new Set<string>(["verify_account", "forgot_password"]);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      id_accion,
      ttlSeconds,
      metadata = {},
      returnOtpInResponse,
      email,
      channel = "email",
    } = body || {};

    // 🧩 Validaciones mínimas
    if (!id_accion || typeof id_accion !== "string") {
      return NextResponse.json({ ok: false, error: "id_accion es requerido" }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ ok: false, error: "email es requerido" }, { status: 400 });
    }
    if (channel !== "email" && channel !== "sms") {
      return NextResponse.json({ ok: false, error: "channel inválido" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const user_agent = req.headers.get("user-agent") ?? undefined;

    // 🔹 Siempre guardamos el email en metadata para correlacionar
    const enrichedMetadata = { ...metadata, email };

    // 🧯 Generar OTP (anónimo si es acción pública)
    const result = await generateOtpAction({
      id_accion,
      ttlSeconds,
      metadata: enrichedMetadata,
      ip,
      user_agent,
      // En PROD evita exponer el OTP; en dev es útil para pruebas
      returnOtpInResponse:
        typeof returnOtpInResponse === "boolean"
          ? returnOtpInResponse && process.env.NODE_ENV !== "production"
          : process.env.NODE_ENV !== "production",
      allowAnonymous: PUBLIC_ACTIONS.has(id_accion), // 👈 clave para register
      email, // 👈 sujeto explícito cuando es anónimo
    });

    if (!result?.id_event || !result?.expires_at) {
      console.error("generateOtpAction no retornó id_event / expires_at:", result);
      return NextResponse.json(
        { ok: false, error: "Respuesta inválida del generador de OTP" },
        { status: 500 }
      );
    }

    const otp = result.otp ?? enrichedMetadata?.otp; // sólo visible en dev si lo pides

    // 🔹 Envío del mensaje (email/sms). Aquí implementamos email.
    if (channel === "email") {
      const toAddress =
        process.env.NODE_ENV !== "production"
          ? "nieto.kevin98@gmail.com" // ⬅️ override para DEV
          : email;

      const { data, error } = await resend.emails.send({
        from: "nieto.onboarding@resend.dev", // usa tu dominio verificado en prod
        to: toAddress,
        subject: "Tu código OTP 🔐",
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px;">
            <h2 style="color:#333;">Tu código de verificación</h2>
            <p>Usa este código para continuar con tu autenticación:</p>
            <div style="text-align:center;margin:30px 0;">
              <span style="font-size:32px;letter-spacing:6px;font-weight:bold;color:#0070f3;">${otp ?? "******"}</span>
            </div>
            <p>⏳ Este código expirará en <strong>${ttlSeconds ?? 300} segundos</strong>.</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #eee;"/>
            <p style="font-size:12px;color:#666;">Si no solicitaste este código, puedes ignorar este correo.</p>
          </div>
        `,
      });

      if (error) {
        console.error("Error al enviar correo:", error);
        return NextResponse.json({ ok: false, error: "No se pudo enviar el correo" }, { status: 500 });
      }
    } else {
      // TODO: Implementar envío SMS si lo necesitas
    }

    // ✅ Estructura que espera tu cliente (otpGenerate)
    return NextResponse.json({
      ok: true,
      id_event: result.id_event,
      expires_at: result.expires_at,
      ...(otp ? { otp } : {}),
    });
  } catch (error: any) {
    console.error("Error en API /otp/generate:", error);
    // Uniforma el error
    const message = error?.message || "Error al generar OTP";
    // Si te interesa distinguir 401 aquí, puedes parsear el mensaje.
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
