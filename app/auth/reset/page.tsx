// app/auth/reset/page.tsx
import type { Metadata } from "next";
import { PageContent } from "./components";
import { AutoExchange } from "@/components";

export const metadata: Metadata = {
  title: "Restablecer contraseña | Bisneando",
  description: "Ingresa tu nueva contraseña para completar el proceso.",
};

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;

  // Si llega con ?code=..., dejamos que el client mande un form a la Server Action
  if (code) {
    return <AutoExchange code={code} />;
  }

  // Si no hay code, ya deberías tener la sesión de recovery (tras el redirect de arriba)
  return <PageContent />;
}
