// app/api/cart/validate/route.ts
import { NextResponse } from "next/server";

type IncomingCartItem = {
  id: number;          // id_producto en BD
  title: string;       // opcional para mostrar
  price: number;       // precio que trae el cliente
  quantity: number;    // cantidad solicitada
  images?: string[];   // ignorado en la validación
  inStock?: number;    // ignorado, la fuente de verdad es BD
};

type ProductoBD = {
  id_producto: number;
  nombre_producto: string;
  is_active: boolean;
  qty: number;     // stock disponible en BD
  precio: number;  // precio en BD
};

type ItemValidation =
  | {
      id: number;
      status: "ok";
      requestedQty: number;
      requestedPrice: number;
      nombre_producto: string;
      dbPrice: number;
      availableQty: number;
      message: string;
    }
  | {
      id: number;
      status: "price_mismatch";
      requestedQty: number;
      requestedPrice: number;
      nombre_producto: string;
      dbPrice: number;
      availableQty: number;
      message: string;
    }
  | {
      id: number;
      status: "insufficient_stock";
      requestedQty: number;
      requestedPrice: number;
      nombre_producto: string;
      dbPrice: number;
      availableQty: number;
      suggestedQty: number; // min(qty BD, requested)
      message: string;
    }
  | {
      id: number;
      status: "inactive";
      requestedQty: number;
      requestedPrice: number;
      message: string;
    }
  | {
      id: number;
      status: "not_found";
      requestedQty: number;
      requestedPrice: number;
      message: string;
    };

export async function POST(req: Request) {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!base || !apiKey) {
      console.error(
        "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
      );
      return NextResponse.json(
        { error: "Misconfiguración del servidor" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const items: IncomingCartItem[] | undefined = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Body inválido. Se espera { items: IncomingCartItem[] }" },
        { status: 400 }
      );
    }

    // IDs únicos para consultar
    const ids = [...new Set(items.map((i) => i.id))];
    const urlProductos =
      `${base}/rest/v1/tbl_productos` +
      `?select=id_producto,nombre_producto,is_active,qty,precio` +
      `&id_producto=in.(${ids.join(",")})`;

    const res = await fetch(urlProductos, {
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${apiKey}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Error al consultar productos:", res.status, await res.text());
      return NextResponse.json(
        { error: "Error al consultar productos" },
        { status: 500 }
      );
    }

    const productos: ProductoBD[] = await res.json();
    const byId = new Map<number, ProductoBD>(
      productos.map((p) => [p.id_producto, p])
    );

    const results: ItemValidation[] = [];
    let serverSubtotal = 0;

    for (const it of items) {
      const bd = byId.get(it.id);

      if (!bd) {
        results.push({
          id: it.id,
          status: "not_found",
          requestedQty: it.quantity,
          requestedPrice: it.price,
          message: "No se encontró el producto.",
        });
        continue;
      }

      if (!bd.is_active) {
        results.push({
          id: it.id,
          status: "inactive",
          requestedQty: it.quantity,
          requestedPrice: it.price,
          message: "El producto está inactivo.",
        });
        continue;
      }

      const priceMismatch = Number(bd.precio) !== Number(it.price);
      const availableQty = Math.max(0, bd.qty);
      const requestedQty = Math.max(0, it.quantity);

      if (requestedQty > availableQty) {
        const suggestedQty = Math.max(0, Math.min(requestedQty, availableQty));
        results.push({
          id: it.id,
          status: "insufficient_stock",
          requestedQty,
          requestedPrice: it.price,
          nombre_producto: bd.nombre_producto,
          dbPrice: bd.precio,
          availableQty,
          suggestedQty,
          message:
            availableQty === 0
              ? "Sin stock disponible."
              : `Stock insuficiente. Solo hay ${availableQty} disponibles.`,
        });
        // Para el subtotal del servidor, tomamos la cantidad sugerida (lo que realmente se puede vender)
        serverSubtotal += bd.precio * suggestedQty;
        continue;
      }

      if (priceMismatch) {
        results.push({
          id: it.id,
          status: "price_mismatch",
          requestedQty,
          requestedPrice: it.price,
          nombre_producto: bd.nombre_producto,
          dbPrice: bd.precio,
          availableQty,
          message: `El precio ha cambiado. Precio actual: ${bd.precio}.`,
        });
        // El subtotal autoritativo usa el precio de BD
        serverSubtotal += bd.precio * requestedQty;
        continue;
      }

      // OK
      results.push({
        id: it.id,
        status: "ok",
        requestedQty,
        requestedPrice: it.price,
        nombre_producto: bd.nombre_producto,
        dbPrice: bd.precio,
        availableQty,
        message: "OK",
      });
      serverSubtotal += bd.precio * requestedQty;
    }

    const ok = results.every((r) => r.status === "ok");

    return NextResponse.json({
      ok,
      items: results,
      totals: {
        serverSubtotal,
      },
    });
  } catch (error) {
    console.error("Error en API /api/cart/validate:", error);
    return NextResponse.json(
      { error: "Error al validar carrito" },
      { status: 500 }
    );
  }
}
