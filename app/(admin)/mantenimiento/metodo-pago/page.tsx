import type { Metadata } from "next";
import { PageContent } from "./components";
export const metadata: Metadata = {
  title: "Métodos de pago",
  description: "Gestiona los medios de cobro disponibles.",
  keywords: ["mantenimiento", "métodos de pago", "cobros", "pagos", "ventas"],
  openGraph: {
    title: "Métodos de pago",
    description: "Gestiona los medios de cobro disponibles.",
  },
};

export default function MetodosPagoPage() {
  return <PageContent />;
}
