"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Alert } from "@/components";
import { useUIStore } from "@/store";
import { updatePassword } from "@/app/auth/actions";

export function PageContent() {
  const [loading, setLoading] = useState(false);
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);

  async function onSubmit(formData: FormData) {
    const password = (formData.get("password") as string)?.trim();
    const confirm  = (formData.get("confirm") as string)?.trim();

    // Validaciones cliente
    if (!password || !confirm) {
      mostrarAlerta("Campos requeridos", "Completa ambos campos.", "warning");
      return;
    }
    if (password.length < 8) {
      mostrarAlerta("Contraseña débil", "Mínimo 8 caracteres.", "warning");
      return;
    }
    if (password !== confirm) {
      mostrarAlerta("No coinciden", "Las contraseñas no coinciden.", "danger");
      return;
    }

    setLoading(true);

    // ⚠️ SIN try/catch para no interceptar el redirect()
    await updatePassword(formData);
    // No pongas más código aquí: redirect corta la ejecución
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-r from-yellow-400 to-yellow-500 overflow-hidden">
      <Alert />

      <div
        className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-45 w-[220%] h-[220%] opacity-10"
        style={{ backgroundImage: "url('/bisneando.svg')", backgroundRepeat: "repeat", backgroundSize: "160px 160px" }}
      />

      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Image src="/bisneando.svg" alt="Bisneando Logo" width={160} height={80} className="rounded-full" />
        </div>

        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Restablecer contraseña</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Ingresa tu nueva contraseña y confírmala para completar el proceso.
        </p>

        <form action={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-gray-700 font-medium">Nueva contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-gray-700 font-medium">Confirmar contraseña</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              placeholder="Repite la contraseña"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-300 disabled:opacity-70"
          >
            {loading ? "Guardando..." : "Guardar contraseña"}
          </button>
        </form>

        <div className="text-sm text-gray-600 text-center mt-6">
          ¿Recordaste tu contraseña?{" "}
          <Link href="/auth/login" className="text-yellow-600 font-semibold hover:underline">Inicia sesión</Link>
        </div>
      </div>
    </div>
  );
}
