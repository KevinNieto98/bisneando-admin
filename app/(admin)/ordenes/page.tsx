// app/ordenes/page.tsx (ajusta la ruta según tu estructura)
import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Órdenes",
  description: "Menú principal de órdenes.",
  keywords: ["ordenes", "pedidos", "histórico", "menú"],
  openGraph: {
    title: "Órdenes",
    description: "Menú principal de órdenes.",
  },
};

export default function OrdenesPage() {
  return <PageContent />;
}
