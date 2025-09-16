// app/(admin)/usuarios/[id]/page.tsx
import type { Metadata } from "next";
import { PageContent } from "./components";

// 👇 params ahora es una Promesa
type PageProps = {
  params: Promise<{ id: string }>;
};

// ✅ generateMetadata ahora es async y espera params
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const isCreate = id?.toLowerCase() === "crear";

  return {
    title: isCreate ? "Crear usuario" : "Editar usuario",
    description: isCreate ? "Crea un nuevo usuario" : "Edita los datos del usuario",
  };
}

// ✅ Page también async y espera params
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const isCreate = id?.toLowerCase() === "crear";

  return (
    <PageContent
      mode={isCreate ? "create" : "edit"}
      userId={isCreate ? undefined : id}
    />
  );
}
