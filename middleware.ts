// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Solo en desarrollo
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.next();
  }

  // Flag para no repetir el borrado en cada request
  const alreadyCleared = req.cookies.get("dev_cleared")?.value === "1";
  const res = NextResponse.next();

  if (!alreadyCleared) {
    // Borra solo cookies de Supabase (empiezan con "sb-")
    for (const c of req.cookies.getAll()) {
      if (c.name.startsWith("sb-")) {
        // En middleware SÍ puedes mutar cookies vía NextResponse
        res.cookies.set(c.name, "", { maxAge: 0, path: "/" });
      }
    }

    // Marca que ya se limpió (dura 1 hora; puedes ajustar)
    res.cookies.set("dev_cleared", "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60, // 1h
    });
  }

  return res;
}

// (Opcional) Limita dónde corre el middleware
export const config = {
  matcher: ["/((?!_next|static|images|favicon.ico).*)"],
};
