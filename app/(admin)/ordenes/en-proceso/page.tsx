import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Órdenes en Proceso",
  description: "Gestión y seguimiento de órdenes por estado.",
  // opcional:
  // openGraph: {
  //   title: "Órdenes | Panel administrativo",
  //   description: "Gestión y seguimiento de órdenes por estado.",
  // },
};

export default function Page() {
  return <PageContent />;
}
