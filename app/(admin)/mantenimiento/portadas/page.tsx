import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Portadas",
  description: "Gestiona las portadas del carrusel: crear, editar y activar/desactivar.",
  keywords: ["portadas", "carrusel", "banners", "mantenimiento"],
  openGraph: {
    title: "Portadas",
    description: "Gestión de portadas del carrusel.",
  },
};

export default function PortadasPage() {
  return <PageContent />;
}
