import type { Metadata } from "next";
import { PageContent } from "./components";

type PageProps = {
  params: { id?: string };
};

// Metadata dinámica según /new|/nuevo vs /[id]
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const id = params?.id ?? "";
  const isCreate = !id || id === "new" || id === "nuevo";

  const title = isCreate ? "Nuevo producto" : `Editar producto #${id}`;
  const description = isCreate
    ? "Crea un nuevo producto y gestiona sus detalles, imágenes y estado."
    : "Edita los datos, imágenes y estado del producto seleccionado.";

  return {
    title,
    description,
    keywords: ["inventario", "productos", "nuevo", "editar", "gestión"],
    openGraph: {
      title,
      description,
    },
  };
}

// Server Component que solo renderiza el Client Component
export default function Page({ params }: PageProps) {
  // PageContent (cliente) espera params como Promise, así que lo envolvemos.
  return <PageContent params={Promise.resolve(params)} />;
}
