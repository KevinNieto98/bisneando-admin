// app/api/direcciones/[id]/route.ts
import { getDireccionByIdAction } from "@/app/(admin)/colonias/actions";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  ctx: { params: { id: string } }
) {
  const reqId = `dir_by_id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    const idNum = Number(ctx.params.id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      console.error(`[${reqId}] GET /api/direcciones/${ctx.params.id} -> id inválido`);
      return NextResponse.json({ message: "id_direccion inválido." }, { status: 400 });
    }

    const direccion = await getDireccionByIdAction(idNum);

    if (!direccion) {
      return NextResponse.json({ message: "Dirección no encontrada." }, { status: 404 });
    }

    return NextResponse.json(direccion, { status: 200 });
  } catch (err: any) {
    console.error(`[${reqId}] GET /api/direcciones/${ctx.params.id} error:`, err);
    const message = err?.message || String(err) || "Error al obtener la dirección.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
