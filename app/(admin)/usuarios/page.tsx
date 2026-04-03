import type { Metadata } from "next";
import { Users } from "lucide-react";
import { UsuariosTablaByPerfil } from "./components";

export const metadata: Metadata = {
  title: "Clientes",
  description: "Usuarios con perfil de cliente.",
};

export default function Page() {
  return (
    <UsuariosTablaByPerfil
      perfilId={1}
      title="Clientes"
      subtitle="Usuarios registrados con perfil de cliente"
      icon={<Users className="h-6 w-6 text-neutral-700" />}
    />
  );
}
