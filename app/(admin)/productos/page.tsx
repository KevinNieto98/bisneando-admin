import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Menú de Productos",
  description: "Accesos para gestionar productos: inventario, importación, pendientes y más.",
  keywords: ["productos", "inventario", "importación", "pendientes", "catálogo"],
  openGraph: {
    title: "Menú de Productos",
    description: "Accesos para gestionar productos: inventario, importación, pendientes y más.",
  },
};

export default function ProductosPage() {
  // Server component que solo delega a la UI cliente
  return <PageContent />;
}
