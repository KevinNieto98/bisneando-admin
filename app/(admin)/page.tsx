import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Menú Principal",
  description: "Tablero principal con accesos rápidos, estadísticas y navegación.",
  keywords: ["menú principal", "dashboard", "accesos rápidos", "estadísticas"],
  openGraph: {
    title: "Menú Principal",
    description: "Tablero principal con accesos rápidos, estadísticas y navegación.",
  },
};

export default function HomePage() {
  // Server: solo renderiza el componente cliente
  return <PageContent />;
}
