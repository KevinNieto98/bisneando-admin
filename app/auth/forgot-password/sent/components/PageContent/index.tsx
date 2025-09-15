// app/auth/forgot-password/sent/page-content.tsx
"use client";

import Link from "next/link";

export function PageContent({ email }: { email?: string }) {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 to-yellow-500 overflow-hidden">
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Revisa tu correo!</h1>
        <p className="text-sm text-gray-600 mb-6">
          Si <span className="font-semibold">{email ?? "tu correo"}</span> existe en nuestro sistema,
          te enviamos un enlace para restablecer la contraseña. Revisa también tu carpeta de spam.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-lg bg-yellow-500 px-4 py-2 font-semibold text-white hover:bg-yellow-600"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
