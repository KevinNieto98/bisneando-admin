import type { Metadata } from "next";
import { PageContent } from "./components";

// 📌 Metadata de la página Usuarios
export const metadata: Metadata = {
  title: "Crear Usuarios",
  description: "Administra los usuarios de la plataforma: búsqueda, bloqueo y gestión de pedidos.",
};

export default function Page() {
  return <PageContent />;
}
