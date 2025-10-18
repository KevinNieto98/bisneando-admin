import { generateOtpAction } from "@/app/(api)/api/actions";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id_accion, ttlSeconds, metadata = {}, returnOtpInResponse, email } = body || {};

    // 🧩 Validaciones
    if (!id_accion || typeof id_accion !== "string") {
      return NextResponse.json({ error: "id_accion es requerido" }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "email es requerido" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const user_agent = req.headers.get("user-agent") ?? undefined;

    // 🔹 Inyectamos el email dentro del metadata (útil para relacionar OTP y correo)
    const result = await generateOtpAction({
      id_accion,
      ttlSeconds,
      metadata: { ...metadata, email },
      ip,
      user_agent,
      returnOtpInResponse,
    });

    const otp = result?.otp || metadata?.otp;

    // 🔹 Enviamos el correo
    const { data, error } = await resend.emails.send({
      from: "nieto.onboarding@resend.dev", // Cambia a tu dominio verificado si ya lo tienes
     // to: [email],
     to: "nieto.kevin98@gmail.com",
      subject: "Tu código OTP 🔐",
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:auto;padding:20px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#333;">Tu código de verificación</h2>
          <p>Usa este código para continuar con tu autenticación:</p>
          <div style="text-align:center;margin:30px 0;">
            <span style="font-size:32px;letter-spacing:6px;font-weight:bold;color:#0070f3;">${otp}</span>
          </div>
          <p>⏳ Este código expirará en <strong>${ttlSeconds ?? 300} segundos</strong>.</p>
          <hr style="margin:20px 0;border:none;border-top:1px solid #eee;"/>
          <p style="font-size:12px;color:#666;">Si no solicitaste este código, puedes ignorar este correo.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error al enviar correo:", error);
      return NextResponse.json({ error: "No se pudo enviar el correo" }, { status: 500 });
    }

    return NextResponse.json({
      message: "OTP generado y enviado por correo ✅",
      id_accion,
      email,
      ...(returnOtpInResponse ? { otp } : {}),
      data,
    });
  } catch (error: any) {
    console.error("Error en API /otp/generate:", error);
    const message =
      error?.message === "No autenticado"
        ? "No autenticado"
        : error?.message || "Error al generar OTP";
    const status = message === "No autenticado" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
