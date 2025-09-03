// app/api/portadas/[id]/route.ts
import { NextResponse } from "next/server";
import { toDataUrlFromUnknownImage } from "@/lib/bytea";
import { getPortadaAction } from "@/app/(admin)/mantenimiento/portadas/actions";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const portada = await getPortadaAction(id);

    const portadaUrl = toDataUrlFromUnknownImage(portada.imagen);

    return NextResponse.json({
      id_portada: portada.id_portada,
      direccion: portada.link ?? "",
      disponible: !!portada.is_active,
      portadaUrl, // null si no hay imagen válida
    });
  } catch (err: any) {
    console.error("API /portadas/[id] error:", err);
    return NextResponse.json({ error: err?.message ?? "Error" }, { status: 500 });
  }
}
