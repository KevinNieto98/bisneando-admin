// app/api/otp/generate/route.ts
import { generateOtpAction } from "@/app/(api)/api/actions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id_accion, ttlSeconds, metadata, returnOtpInResponse } = body || {};

    if (!id_accion || typeof id_accion !== "string") {
      return NextResponse.json({ error: "id_accion es requerido" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? undefined;
    const user_agent = req.headers.get("user-agent") ?? undefined;

    const result = await generateOtpAction({
      id_accion,
      ttlSeconds,
      metadata,
      ip,
      user_agent,
      returnOtpInResponse,
    });

    return NextResponse.json(result);
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
