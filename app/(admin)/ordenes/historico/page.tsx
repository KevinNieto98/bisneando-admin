import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Histórico de Órdenes",
  description: "Consulta, filtrado y búsqueda de órdenes históricas.",
  // opcional:
  // openGraph: {
  //   title: "Histórico de Órdenes | Panel administrativo",
  //   description: "Consulta, filtrado y búsqueda de órdenes históricas.",
  // },
};

export default function Page() {
  return <PageContent />;
}
