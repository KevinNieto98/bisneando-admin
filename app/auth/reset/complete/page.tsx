// app/forgot-password/sent/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contraseña modificada | Bisneando",
  description: "Tu contraseña fue cambiada correctamente. Ahora puedes iniciar sesión.",
};

export default async function PasswordChangedPage({
  searchParams,
}: {
  // Next 15: searchParams es Promise
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 to-yellow-500 overflow-hidden">
      {/* Fondo centrado, grande y rotado */}
      <div
        className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 w-[220%] h-[220%] opacity-10"
        style={{
          backgroundImage: "url('/bisneando.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "160px 160px",
        }}
      />

      {/* Contenido principal */}
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <Image
            src="/bisneando.svg"
            alt="Bisneando Logo"
            width={160}
            height={80}
            className="rounded-full"
          />
        </div>

        {/* Check verde grande */}
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-12 w-12 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Contraseña modificada!
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Tu contraseña {email ? <>para <span className="font-semibold">{email}</span></> : null} se actualizó correctamente.
          Ahora puedes iniciar sesión con tus nuevas credenciales.
        </p>

        <Link
          href="/auth/login"
          className="inline-flex w-full items-center justify-center rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600 transition"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
