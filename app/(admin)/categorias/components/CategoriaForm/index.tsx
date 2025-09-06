"use client";

import React, { useState } from "react";
import { IconPicker, Switch } from "@/components";

export interface Categoria {
  id_categoria: number;
  nombre_categoria: string;
  activa: boolean;
  icono?: string | null;
}

export type CategoriaFormProps = {
  value: Categoria;
  onChange: (next: Categoria) => void;
  onSubmit: () => void;
  formId?: string;
};

export function CategoriaForm({
  value,
  onChange,
  onSubmit,
  formId = "categoria-form",
}: CategoriaFormProps) {
  const [touched, setTouched] = useState(false);
  const nombreValido = value.nombre_categoria.trim().length >= 2;

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        setTouched(true);
        if (!nombreValido) return;
        onSubmit();
      }}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Nombre de la categoría</label>
        <input
          autoFocus
          value={value.nombre_categoria}
          onChange={(e) => onChange({ ...value, nombre_categoria: e.target.value })}
          placeholder="Ej. Electrónica"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={value.activa}
          onChange={(next) => onChange({ ...value, activa: next })}
          ariaLabel="Cambiar estado de la categoría"
        />
        <span className="text-sm font-medium text-neutral-700">{value.activa ? "Activa" : "Inactiva"}</span>
      </div>

      {/* Selector de icono */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Icono</label>
        <div className="flex items-center gap-3">
          <IconPicker
            value={value.icono ?? null}
            onChange={(name) => onChange({ ...value, icono: name })}
          />
          {value.icono && (
            <span className="text-xs text-neutral-600">Seleccionado: {value.icono}</span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500">
          Devuelve el nombre del icono de lucide-react (p. ej. "Pencil").
        </p>
      </div>
    </form>
  );
}
