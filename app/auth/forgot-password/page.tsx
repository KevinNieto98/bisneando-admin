import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Bisneando",
  description:
    "Ingresa tu correo y recibe un enlace seguro para restablecer tu contraseña en Bisneando.",
};

export default function ForgotPasswordPage() {
  return <PageContent />;
}
