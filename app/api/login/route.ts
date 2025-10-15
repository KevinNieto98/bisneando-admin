import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { headers: corsHeaders(origin) });
}

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  platform: z.enum(["WEB", "APP"]).default("APP"),
});

type Platform = "WEB" | "APP";

async function getPerfilSeguro(
  supabase: any,
  userId: string,
  userMetadata: Record<string, unknown> | undefined
): Promise<number | null> {
  const { data: perfilRow, error: perfilErr } = await supabase
    .from("tbl_usuarios")
    .select("id_perfil")
    .eq("id", userId)
    .single();

  if (!perfilErr && perfilRow && perfilRow.id_perfil != null) {
    const num = Number(perfilRow.id_perfil);
    return Number.isFinite(num) ? num : null;
  }

  const metaPerfil = (userMetadata as any)?.id_perfil;
  if (metaPerfil != null) {
    const num = Number(metaPerfil);
    return Number.isFinite(num) ? num : null;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");

  try {
    const json = await req.json().catch(() => ({}));
    const { email, password, platform } = LoginSchema.parse(json);

    const supabase = await createClient();

    // 1) Login
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      return NextResponse.json(
        {
          success: false,
          message: signInError.message,
          code: (signInError as any)?.code,
          status: (signInError as any)?.status,
        },
        { status: 401, headers: corsHeaders(origin) }
      );
    }

    // 2) Usuario y sesión
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user || !signInData?.session) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { success: false, message: "No se pudo obtener el usuario autenticado." },
        { status: 500, headers: corsHeaders(origin) }
      );
    }

    const user = userData.user;
    const session = signInData.session;

    // 3) Validación por plataforma
    const perfil = await getPerfilSeguro(supabase, user.id, user.user_metadata);
    const requiredPerfil = (platform as Platform) === "APP" ? 1 : 2;

    if (perfil !== requiredPerfil) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          success: false,
          message:
            platform === "APP"
              ? "Privilegios insuficientes. Se requiere perfil = 1 para APP."
              : "Privilegios insuficientes. Se requiere perfil = 2 para WEB.",
        },
        { status: 403, headers: corsHeaders(origin) }
      );
    }

    // 4) OK: devolvemos tokens para hidratar la sesión en la app
    // ⚠️ Importante: servir SIEMPRE por HTTPS en producción.
    revalidatePath("/", "layout");
    return NextResponse.json(
      {
        success: true,
        message: "Inicio de sesión exitoso",
        tokens: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_in: session.expires_in,
          token_type: session.token_type,
        },
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { status: 200, headers: corsHeaders(origin) }
    );
  } catch (err: any) {
    const isZod = err instanceof z.ZodError;
    return NextResponse.json(
      {
        success: false,
        message: isZod ? "Payload inválido." : "Error inesperado al iniciar sesión.",
        ...(isZod ? { errors: err.flatten() } : {}),
      },
      { status: isZod ? 400 : 500, headers: corsHeaders(null) }
    );
  }
}
