import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Marcas",
  description: "Gestiona las marcas de productos: crear, editar y activar/desactivar.",
  keywords: ["marcas", "productos", "catálogo", "mantenimiento"],
  openGraph: {
    title: "Marcas",
    description: "Gestiona las marcas de productos: crear, editar y activar/desactivar.",
  },
};

export default function MarcasPage() {
  return <PageContent />;
}
