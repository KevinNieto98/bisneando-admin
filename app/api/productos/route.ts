// app/api/productos/con-imagenes/route.ts
import { getProductosConImagenesAction } from "@/app/(admin)/productos/inventario/actions"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    // 🔹 Leer query params desde la URL
    const { searchParams } = new URL(req.url)

    const onlyActive = searchParams.get("onlyActive") === "true"
    const search = searchParams.get("search") ?? undefined
    const categoriaId = searchParams.get("categoriaId")
      ? Number(searchParams.get("categoriaId"))
      : undefined
    const orderBy = (searchParams.get("orderBy") as "id_producto" | "nombre_producto" | "precio") ?? "id_producto"
    const orderDir = (searchParams.get("orderDir") as "asc" | "desc") ?? "asc"

    // 🔹 Llamar acción con los parámetros
    const productos = await getProductosConImagenesAction({
      onlyActive,
      search,
      categoriaId,
      orderBy,
      orderDir,
    })

    return NextResponse.json(productos)
  } catch (error) {
    console.error("Error en API /productos/con-imagenes:", error)
    return NextResponse.json(
      { error: "Error al obtener productos con imágenes" },
      { status: 500 }
    )
  }
}
