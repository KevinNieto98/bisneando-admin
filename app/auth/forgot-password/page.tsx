"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();

    // Aquí iría tu llamada a la API si la tienes (try/catch).
    // await fetch("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });

    setLoading(true);
    router.push(`/auth/forgot-password/sent${email ? `?email=${encodeURIComponent(email)}` : ""}`);
  }

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
          Recuperar contraseña
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ingresa tu correo y te enviaremos un enlace para cambiar tu contraseña.
          Revisa también tu carpeta de spam si no ves el correo en unos minutos.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="block text-gray-700 font-medium">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-300 disabled:opacity-70"
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div className="text-sm text-gray-600 text-center mt-6">
          ¿Recordaste tu contraseña?{" "}
          <Link href="/auth/login" className="text-yellow-600 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
