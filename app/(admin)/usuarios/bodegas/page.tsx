import type { Metadata } from "next";
import { BodegasPageContent } from "./components";

export const metadata: Metadata = {
  title: "Bodegas",
  description: "Gestión de bodegas y encargados.",
};

export default function BodegasPage() {
  return <BodegasPageContent />;
}
