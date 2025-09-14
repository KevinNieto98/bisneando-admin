// app/auth/login/page.tsx
import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Bisneando",
  description:
    "Accede a tu cuenta de Bisneando para gestionar tu perfil y oportunidades de negocio.",
  keywords: ["Bisneando", "login", "iniciar sesión", "negocios"],
  openGraph: {
    title: "Iniciar Sesión | Bisneando",
    description:
      "Accede a tu cuenta de Bisneando para gestionar tu perfil y oportunidades de negocio.",
    siteName: "Bisneando",
    type: "website",
  },
};

export default function Page() {
  return <PageContent />;
}
