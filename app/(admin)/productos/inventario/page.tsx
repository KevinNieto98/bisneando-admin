import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Inventario",
  description: "Explora, busca y gestiona el inventario de productos.",
  keywords: ["inventario", "productos", "gestión", "búsqueda", "categorías"],
  openGraph: {
    title: "Inventario",
    description: "Explora, busca y gestiona el inventario de productos.",
  },
};

export default function Page() {
  // Server Component que solo renderiza el Client Component
  return <PageContent />;
}
