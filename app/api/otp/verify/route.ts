// app/api/otp/verify/route.ts
import { verifyOtpAction } from "@/app/(api)/api/actions";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const debugFromQuery = url.searchParams.get("debug");
    const debugHeader = req.headers.get("x-debug");
    const debug =
      debugFromQuery === "1" ||
      debugFromQuery === "true" ||
      debugHeader === "1" ||
      debugHeader === "true";

    const body = await req.json().catch(() => ({}));
    const { id_accion, otp, id_event, email } = body || {};

    if (!id_accion || typeof id_accion !== "string") {
      return NextResponse.json(
        { ok: false, reason: "BAD_PARAMS", message: "id_accion es requerido" },
        { status: 400 }
      );
    }
    if (!otp || typeof otp !== "string") {
      return NextResponse.json(
        { ok: false, reason: "BAD_PARAMS", message: "otp es requerido" },
        { status: 400 }
      );
    }

    // Pasa lo que venga (id_event y/o email)
    const params: any = { id_accion, otp };
    if (typeof id_event === "string" && id_event) params.id_event = id_event;
    if (typeof email === "string" && email) params.email = email;

    const result = await verifyOtpAction(params, { debug });
    const status = result.ok ? 200 : 400;
    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error("Error en API /otp/verify:", error);
    const message = error?.message || "Error al verificar OTP";
    return NextResponse.json({ ok: false, reason: "SERVER_ERROR", message }, { status: 500 });
  }
}
