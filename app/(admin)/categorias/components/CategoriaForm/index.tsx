"use client";

import React, { useEffect, useState } from "react";
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
  /** 🚀 Se llama cuando el formulario terminó de montarse */
  onReady?: () => void;
  /** 🔒 desactiva inputs y bloquea submit */
  disabled?: boolean;
};

export function CategoriaForm({
  value,
  onChange,
  onSubmit,
  formId = "categoria-form",
  onReady,
  disabled = false,
}: CategoriaFormProps) {
  const [touched, setTouched] = useState(false);
  const nombreValido = (value.nombre_categoria ?? "").trim().length >= 2;

  // Notifica al padre que el form ya está listo (montado)
  useEffect(() => {
    const t = setTimeout(() => onReady?.(), 0); // microtask para asegurar layout
    return () => clearTimeout(t);
  }, [onReady]);

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return; // bloquea submit cuando está deshabilitado
        setTouched(true);
        if (!nombreValido) return;
        onSubmit();
      }}
      className="space-y-4"
      noValidate
      aria-busy={disabled}
    >
      <div className="space-y-1.5">
        <label htmlFor="nombre_categoria" className="text-sm font-medium text-neutral-700">
          Nombre de la categoría
        </label>
        <input
          id="nombre_categoria"
          autoFocus
          value={value.nombre_categoria}
          onChange={(e) => onChange({ ...value, nombre_categoria: e.target.value })}
          placeholder="Ej. Electrónica"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          aria-invalid={touched && !nombreValido}
          aria-describedby="nombre_categoria_help"
          autoComplete="off"
          disabled={disabled}
        />
        {touched && !nombreValido && (
          <p id="nombre_categoria_help" className="text-xs text-red-600">
            Debe tener al menos 2 caracteres.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={value.activa}
          onChange={(next: boolean) => !disabled && onChange({ ...value, activa: next })}
          ariaLabel="Cambiar estado de la categoría"
          // Si tu Switch soporta "disabled", descomenta la línea siguiente:
          // disabled={disabled as any}
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.activa ? "Activa" : "Inactiva"}
        </span>
      </div>

      {/* Selector de icono */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Icono</label>
        <div className="flex items-center gap-3">
          <IconPicker
            value={value.icono ?? null}
            onChange={(name) => !disabled && onChange({ ...value, icono: name })}
            // Si tu IconPicker soporta "disabled", descomenta:
            // disabled={disabled as any}
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
