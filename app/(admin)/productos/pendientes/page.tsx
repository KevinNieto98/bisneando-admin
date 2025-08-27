"use client";

import React from "react";
import {  FileSpreadsheet } from "lucide-react"; // 👈 añadí XCircle para el ícono
import {  Title} from "@/components";

export default function ProductosPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <Title
        title="Pendientes"
        subtitle="Importa tu excel con productos"
        showBackButton
        backHref="/productos"
        icon={<FileSpreadsheet className="h-6 w-6 text-neutral-700" />}
      />

    </div>
  );
}
