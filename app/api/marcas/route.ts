import { getMarcasActivasAction } from "@/app/(admin)/productos/[id]/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  try {
    const marcas = await getMarcasActivasAction();
    return NextResponse.json(marcas, { status: 200 });
  } catch (error) {
    console.error("Error en GET /api/marcas/activas:", error);
    return NextResponse.json(
      { error: "Error al obtener marcas activas" },
      { status: 500 }
    );
  }
}
