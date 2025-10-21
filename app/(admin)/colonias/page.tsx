import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Colonias | Admin",
  description: "Gestión del catálogo de Colonias.",
  openGraph: {
    title: "Colonias | Admin",
    description: "Gestión del catálogo de Colonias.",
    type: "website",
  },
  alternates: {
    canonical: "/Colonias",
  },
};

export default function Page() {
  return <PageContent />;
}
