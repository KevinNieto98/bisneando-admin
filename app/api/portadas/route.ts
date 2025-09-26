// app/api/portadas/activas/route.ts
import { getActivePortadasAction } from "@/app/(admin)/mantenimiento/portadas/actions";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await getActivePortadasAction({
      orderBy: "fecha_creacion",
      ascending: false,
      limit: 20,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.message,
          details: result.details,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error("Error en API /portadas/activas:", error);
    return NextResponse.json(
      { error: "Error al obtener portadas activas" },
      { status: 500 }
    );
  }
}
