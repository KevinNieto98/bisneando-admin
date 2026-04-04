import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { UsuariosTablaByPerfil } from "../components";

export const metadata: Metadata = {
  title: "Deliveries",
  description: "Usuarios con perfil de delivery.",
};

export default function DeliveriesPage() {
  return (
    <UsuariosTablaByPerfil
      perfilId={6}
      title="Deliveries"
      subtitle="Usuarios registrados con perfil de delivery"
      icon={<Truck className="h-6 w-6 text-neutral-700" />}
    />
  );
}
