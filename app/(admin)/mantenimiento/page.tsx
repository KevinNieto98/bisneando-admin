import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Mantenimiento",
  description: "Configuraciones del sistema y accesos de mantenimiento.",
  keywords: ["mantenimiento", "configuración", "sistema", "accesos"],
  openGraph: {
    title: "Mantenimiento",
    description: "Configuraciones del sistema y accesos de mantenimiento.",
  },
};

export default function MantenimientoPage() {
  return <PageContent />;
}
