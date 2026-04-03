import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Perfiles",
  description: "Gestiona los perfiles de acceso de la plataforma.",
};

export default function PerfilesPage() {
  return <PageContent />;
}
