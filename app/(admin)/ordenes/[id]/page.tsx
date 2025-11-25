import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Detalle de orden",
  description: "Detalle y seguimiento de una orden específica.",
  openGraph: {
    title: "Detalle de orden",
    description: "Visualiza el estado, productos y actividad de una orden.",
  },
};

export default function OrdenReadOnlyPage({
  params,
}: {
  params: { id: string };
}) {
  return <PageContent id={params.id} />;
}
