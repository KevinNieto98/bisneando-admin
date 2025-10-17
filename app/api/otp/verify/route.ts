// app/api/otp/verify/route.ts
import { verifyOtpAction } from "@/app/(api)/api/actions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id_accion, otp } = body || {};

    if (!id_accion || typeof id_accion !== "string") {
      return NextResponse.json({ error: "id_accion es requerido" }, { status: 400 });
    }
    if (!otp || typeof otp !== "string") {
      return NextResponse.json({ error: "otp es requerido" }, { status: 400 });
    }

    const result = await verifyOtpAction({ id_accion, otp });
    const status = result.ok ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error("Error en API /otp/verify:", error);
    const message =
      error?.message === "No autenticado"
        ? "No autenticado"
        : error?.message || "Error al verificar OTP";
    const status = message === "No autenticado" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
