// app/auth/login/PageContent.tsx
"use client";

import { login, type LoginResult } from "@/app/auth/actions";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useActionState } from "react";
import { useUIStore } from "@/store";
import { Alert } from "@/components";

export function PageContent() {
  // useActionState invoca el server action con (prevState, formData)
  // El action debe validar que platform === 'WEB' => perfil requerido = 2
  const [state, formAction, pending] = useActionState<LoginResult | null, FormData>(login, null);
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);

  useEffect(() => {
    if (!state) return;

    if (!state.success) {
      if (state.code === "invalid_credentials") {
        mostrarAlerta("Error", "Correo o contraseña incorrectos.", "danger");
      } else {
        mostrarAlerta("Error", state.message ?? "Ocurrió un error.", "danger");
      }
      return;
    }

    // Éxito
    mostrarAlerta("Éxito", state.message, "success");
    window.location.href = "/";
  }, [state, mostrarAlerta]);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 to-yellow-500 overflow-hidden">
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image src="/bisneando.svg" alt="Bisneando Logo" width={160} height={80} className="rounded-full" />
        </div>

        {/* Muestra la alerta */}
        <Alert />

        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">Iniciar Sesión</h2>

        <form className="space-y-4" action={formAction}>
          {/* Campo oculto para que el server action aplique perfil=2 */}
          <input type="hidden" name="platform" value="WEB" />

          <div>
            <label className="block text-gray-700 font-medium">Correo</label>
            <input
              type="email"
              name="email"
              placeholder="ejemplo@correo.com"
              required
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium">Contraseña</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              required
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-300 disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>

          <div className="text-center mt-2">
            <Link href="/auth/forgot-password" className="text-sm text-yellow-600 font-medium hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
