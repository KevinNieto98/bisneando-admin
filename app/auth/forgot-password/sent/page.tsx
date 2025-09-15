// app/auth/forgot-password/sent/page.tsx
import type { Metadata } from "next";
import { PageContent } from "./components";

export const metadata: Metadata = {
  title: "Correo enviado | Bisneando",
  description: "Te enviamos un enlace para restablecer tu contraseña.",
};

export default async function ForgotPasswordSentPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams; // 👈 OBLIGATORIO en Next 15

  return <PageContent email={email} />;
}
