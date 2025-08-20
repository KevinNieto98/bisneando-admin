// app/forgot-password/sent/page.tsx

import Image from "next/image";
import Link from "next/link";

export default function ForgotPasswordSentPage({
  searchParams,
}: {
  searchParams?: { email?: string };
}) {
  const email = searchParams?.email;

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 to-yellow-500 overflow-hidden">
      {/* Fondo centrado, grande y rotado (sin huecos en esquinas) */}
      <div
        className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 w-[220%] h-[220%] opacity-10"
        style={{
          backgroundImage: "url('/bisneando.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "160px 160px",
        }}
      />

      {/* Contenido principal */}
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image
            src="/bisneando.svg"
            alt="Bisneando Logo"
            width={160}
            height={80}
            className="rounded-full"
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">
          ¡Revisa tu correo!
        </h1>

        <p className="text-sm text-gray-600 text-center mb-6">
          {email ? (
            <>
              Hemos enviado un enlace a <span className="font-semibold">{email}</span> para cambiar tu contraseña.
            </>
          ) : (
            <>Hemos enviado un enlace a tu correo para cambiar tu contraseña.</>
          )}{" "}
          Si no lo ves, revisa tu carpeta de spam o correo no deseado.
        </p>

        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full text-center bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-300"
          >
            Volver a iniciar sesión
          </Link>

          <Link
            href="/auth/forgot-password"
            className="block w-full text-center text-yellow-700 font-medium hover:underline"
          >
            ¿Ingresaste mal el correo? Inténtalo de nuevo
          </Link>
        </div>
      </div>
    </div>
  );
}
