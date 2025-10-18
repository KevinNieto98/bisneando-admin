// app/api/usuarios/actualizar/route.ts
import { NextResponse } from "next/server";
import { updateUsuarioPerfilAction } from "@/app/(admin)/usuarios/actions";

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // Validaciones mínimas
    const { id, nombre, apellido, telefono, dni } = body ?? {};
    if (!id) {
      return NextResponse.json(
        { error: "El campo 'id' es requerido." },
        { status: 400 }
      );
    }

    const updated = await updateUsuarioPerfilAction({
      id,
      nombre,
      apellido,
      telefono,
      dni, // puede venir formateado: "0000-0000-00000" o crudo; se normaliza
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error en API /usuarios/actualizar:", error);
    return NextResponse.json(
      { error: "Error al actualizar el perfil de usuario" },
      { status: 500 }
    );
  }
}
