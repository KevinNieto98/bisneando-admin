import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";

// Esquema de validación del payload
const SignupSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  telefono: z.string().min(7),
  correo: z.string().email(),
  password: z.string().min(6),
  id_perfil: z.number().int(),
});

type SignupPayload = z.infer<typeof SignupSchema>;

// (Opcional) Orígenes permitidos para CORS si vas a consumir desde una app externa
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null) {
  const allowOrigin =
    origin && (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin))
      ? origin
      : ALLOWED_ORIGINS[0] ?? "*";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Preflight CORS
export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { headers: corsHeaders(origin) });
}

// POST /api/signup
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    // 1) Parse + valida
    const json = await req.json();
    const payload = SignupSchema.parse(json) as SignupPayload;

    const supabase = await createClient();

    // 2) Registro en Auth (email/password)
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: payload.correo,
      password: payload.password,
      options: {
        data: {
          first_name: payload.nombre,
          last_name: payload.apellido,
          phone: payload.telefono,
          id_perfil: payload.id_perfil,
        },
      },
    });

    if (signUpErr) {
      return NextResponse.json(
        { ok: false, message: signUpErr.message },
        { status: 400, headers: corsHeaders(origin) }
      );
    }

    const userId = signUpData.user?.id ?? null;

    // 3) Crear/actualizar perfil en tu tabla (si hay userId)
    if (userId) {
      const { error: profileError } = await supabase.from("tbl_usuarios").upsert(
        {
          id: userId,
          nombre: payload.nombre,
          apellido: payload.apellido,
          phone: payload.telefono,
          email: payload.correo,
          id_perfil: payload.id_perfil,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) {
        // Opcional: podrías borrar el user en auth si quieres "rollback" completo
        return NextResponse.json(
          { ok: false, message: profileError.message },
          { status: 400, headers: corsHeaders(origin) }
        );
      }
    }

    // 4) Si hay sesión => "created" y devolvemos tokens para hidratar en la app
    const session = signUpData.session;
    if (session) {
      return NextResponse.json(
        {
          ok: true,
          status: "created",
          tokens: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_in: session.expires_in,
            token_type: session.token_type,
          },
          user: {
            id: signUpData.user?.id ?? null,
            email: signUpData.user?.email ?? null,
          },
        },
        { status: 201, headers: corsHeaders(origin) }
      );
    }

    // 5) Si no hay sesión => probablemente requiere verificación por correo
    return NextResponse.json(
      { ok: true, status: "pending_confirmation" },
      { status: 202, headers: corsHeaders(origin) }
    );
  } catch (err: unknown) {
    const message =
      err instanceof z.ZodError ? "Payload inválido." : "Error inesperado al crear el usuario.";
    return NextResponse.json(
      { ok: false, message, ...(err instanceof z.ZodError ? { errors: err.flatten() } : {}) },
      { status: err instanceof z.ZodError ? 400 : 500, headers: corsHeaders(null) }
    );
  }
}
