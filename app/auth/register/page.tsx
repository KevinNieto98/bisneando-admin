import Image from "next/image";
import Link from "next/link";

export default function RegisterPage() {
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
      <div className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/bisneando.svg"
            alt="Bisneando Logo"
            width={160}
            height={80}
            className="rounded-full"
          />
        </div>

        <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
          Crear Cuenta
        </h2>

        <form className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-gray-700 font-medium">Nombre</label>
            <input
              type="text"
              placeholder="Tu nombre"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-gray-700 font-medium">Apellido</label>
            <input
              type="text"
              placeholder="Tu apellido"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-gray-700 font-medium">Número de Teléfono</label>
            <input
              type="tel"
              placeholder="+504 9999-9999"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          {/* Correo */}
          <div>
            <label className="block text-gray-700 font-medium">Correo</label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-gray-700 font-medium">Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          {/* Confirmar Contraseña */}
          <div>
            <label className="block text-gray-700 font-medium">Confirmar Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
            />
          </div>

          {/* Botón de registro */}
          <button
            type="submit"
            className="w-full bg-yellow-500 text-white py-2 rounded-lg font-semibold hover:bg-yellow-600 transition duration-300"
          >
            Registrarse
          </button>
        </form>

        <p className="text-sm text-gray-600 text-center mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-yellow-600 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
