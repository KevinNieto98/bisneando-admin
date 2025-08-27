"use client";

import React from "react";
import {  FileSpreadsheet, Tags } from "lucide-react"; // 👈 añadí XCircle para el ícono
import {  Title} from "@/components";

export default function ProductosPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Title
        title="Categorias"
        subtitle="Catálogo de Categorías"
        showBackButton
        backHref="/"
        icon={<Tags className="h-6 w-6 text-neutral-700" />}
      />

    </div>
  );
}
