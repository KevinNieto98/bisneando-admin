// app/api/direcciones/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDireccionByIdAction } from "@/app/(admin)/colonias/actions";

// Opcional: evita cacheo del handler en Vercel
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const reqId = `dir_by_id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const idNum = Number(id);
    if (!Number.isFinite(idNum) || idNum <= 0) {
      console.error(`[${reqId}] GET /api/direcciones/${id} -> id inválido`);
      return NextResponse.json(
        { message: "id_direccion inválido." },
        { status: 400 }
      );
    }

    const direccion = await getDireccionByIdAction(idNum);

    if (!direccion) {
      return NextResponse.json(
        { message: "Dirección no encontrada." },
        { status: 404 }
      );
    }

    return NextResponse.json(direccion, { status: 200 });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error(
      `[${reqId}] GET /api/direcciones/${id} error:`,
      e?.message ?? err
    );
    const message =
      e?.message ?? String(err) ?? "Error al obtener la dirección.";
    return NextResponse.json({ message, reqId }, { status: 500 });
  }
}
