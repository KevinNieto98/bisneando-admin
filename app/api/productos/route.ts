import { getMarcasAction } from "@/app/(admin)/mantenimiento/marcas/actions"
import { getProductosConImagenesAction, } from "@/app/(admin)/productos/inventario/actions"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const onlyActive = searchParams.get("onlyActive") === "true"
    const search = searchParams.get("search") ?? undefined
    const categoriaId = searchParams.get("categoriaId")
      ? Number(searchParams.get("categoriaId"))
      : undefined
    const orderBy = (searchParams.get("orderBy") as "id_producto" | "nombre_producto" | "precio") ?? "id_producto"
    const orderDir = (searchParams.get("orderDir") as "asc" | "desc") ?? "asc"

    // 🔹 Traer productos y marcas en paralelo
    const [productos, marcas] = await Promise.all([
      getProductosConImagenesAction({ onlyActive, search, categoriaId, orderBy, orderDir }),
      getMarcasAction(),
    ])

    // 🔹 Hacer merge de marcas → productos
    const productosConMarca = productos.map((p: any) => {
      const marca = marcas.find((m: any) => m.id_marca === p.id_marca)
      return {
        ...p,
        nombre_marca: marca ? marca.nombre_marca : null, // agrega el campo
      }
    })

    return NextResponse.json(productosConMarca)
  } catch (error) {
    console.error("Error en API /productos/con-imagenes:", error)
    return NextResponse.json(
      { error: "Error al obtener productos con imágenes" },
      { status: 500 }
    )
  }
}
