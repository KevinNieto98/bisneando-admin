import { getMarcasAction } from "@/app/(admin)/mantenimiento/marcas/actions"
import { getProductosConImagenesAction } from "@/app/(admin)/productos/inventario/actions"
import { NextResponse } from "next/server"

type Params = {
  id_bodega: string
}

export async function GET(req: Request, context: { params: Params }) {
  try {
    const { searchParams } = new URL(req.url)
    const { id_bodega: idBodegaRaw } = context.params

    const id_bodega = Number(idBodegaRaw)
    if (!idBodegaRaw || Number.isNaN(id_bodega) || id_bodega <= 0) {
      return NextResponse.json(
        { error: "Parámetro id_bodega inválido." },
        { status: 400 }
      )
    }

    // Ya no nos interesa onlyActive; la bodega ve todo.
    const search = searchParams.get("search") ?? undefined

    const categoriaId = searchParams.get("categoriaId")
      ? Number(searchParams.get("categoriaId"))
      : undefined

    const orderBy =
      (searchParams.get("orderBy") as "id_producto" | "nombre_producto" | "precio") ??
      "id_producto"
    const orderDir = (searchParams.get("orderDir") as "asc" | "desc") ?? "asc"

    // 🔹 Traer productos y marcas en paralelo
    const [productos, marcas] = await Promise.all([
      getProductosConImagenesAction({
        onlyActive: false, // ✅ explícito: siempre todo
        search,
        categoriaId,
        id_bodega,
        orderBy,
        orderDir,
      }),
      getMarcasAction(),
    ])

    // 🔹 Merge de marcas → productos
    const productosConMarca = productos.map((p: any) => {
      const marca = marcas.find((m: any) => m.id_marca === p.id_marca)
      return {
        ...p,
        nombre_marca: marca ? marca.nombre_marca : null,
      }
    })

    return NextResponse.json(productosConMarca)
  } catch (error) {
    console.error("Error en API /api/productosbyBodega/[id_bodega]:", error)
    return NextResponse.json(
      { error: "Error al obtener productos por bodega" },
      { status: 500 }
    )
  }
}
