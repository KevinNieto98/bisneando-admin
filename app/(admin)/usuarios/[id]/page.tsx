// app/usuarios/[id]/page.tsx
import type { Metadata } from "next";
import { PageContent } from "./components"; // o la ruta donde esté tu PageContent

export const metadata: Metadata = {
  title: "Editar usuario",
  description: "Edita datos del usuario y gestiona su acceso.",
};

export default function Page() {
  return <PageContent />;
}
