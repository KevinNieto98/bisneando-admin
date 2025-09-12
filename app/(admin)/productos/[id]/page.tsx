import type { Metadata } from "next";
import { PageContent } from "./components";

type RouteParams = { id?: string };

// ✅ Tipamos params como Promise y hacemos await en generateMetadata
export async function generateMetadata(
  { params }: { params: Promise<RouteParams> }
): Promise<Metadata> {
  const { id } = await params;
  const isCreate = !id || id === "new" || id === "nuevo";

  const title = isCreate ? "Nuevo producto" : `Editar producto #${id}`;
  const description = isCreate
    ? "Crea un nuevo producto y gestiona sus detalles, imágenes y estado."
    : "Edita los datos, imágenes y estado del producto seleccionado.";

  return {
    title,
    description,
    keywords: ["inventario", "productos", "nuevo", "editar", "gestión"],
    openGraph: { title, description },
  };
}

// ✅ Mantén params como Promise y pásalo tal cual a tu Client Component
export default function Page(
  { params }: { params: Promise<RouteParams> }
) {
  return <PageContent params={params} />;
}
