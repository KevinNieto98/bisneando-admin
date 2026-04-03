import type { Metadata } from "next";
import { AdministradoresPageContent } from "./components/AdministradoresPageContent";

export const metadata: Metadata = {
  title: "Administradores",
  description: "Usuarios con perfil de administrador.",
};

export default function AdministradoresPage() {
  return <AdministradoresPageContent />;
}
