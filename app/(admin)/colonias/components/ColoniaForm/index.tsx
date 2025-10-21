"use client";

import React, { useEffect, useState } from "react";
import { Switch } from "@/components";

export interface Colonia {
  id_colonia: number;
  nombre_colonia: string;
  activa: boolean;            // mapea a is_active
  tiene_cobertura: boolean;
  referencia: string | null;
}

export type ColoniaFormProps = {
  value: Colonia;
  onChange: (next: Colonia) => void;
  onSubmit: () => void;
  formId?: string;
  /** 🚀 Se llama cuando el formulario terminó de montarse */
  onReady?: () => void;
  /** 🔒 desactiva inputs y bloquea submit */
  disabled?: boolean;
};

export function ColoniaForm({
  value,
  onChange,
  onSubmit,
  formId = "colonia-form",
  onReady,
  disabled = false,
}: ColoniaFormProps) {
  const [touched, setTouched] = useState(false);
  const nombreValido = (value.nombre_colonia ?? "").trim().length >= 2;

  useEffect(() => {
    const t = setTimeout(() => onReady?.(), 0);
    return () => clearTimeout(t);
  }, [onReady]);

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        setTouched(true);
        if (!nombreValido) return;
        onSubmit();
      }}
      className="space-y-4"
      noValidate
      aria-busy={disabled}
    >
      {/* Nombre de la colonia */}
      <div className="space-y-1.5">
        <label htmlFor="nombre_colonia" className="text-sm font-medium text-neutral-700">
          Nombre de la colonia
        </label>
        <input
          id="nombre_colonia"
          autoFocus
          value={value.nombre_colonia}
          onChange={(e) => onChange({ ...value, nombre_colonia: e.target.value })}
          placeholder="Ej. Las Lomas"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          aria-invalid={touched && !nombreValido}
          aria-describedby="nombre_colonia_help"
          autoComplete="off"
          disabled={disabled}
        />
        {touched && !nombreValido && (
          <p id="nombre_colonia_help" className="text-xs text-red-600">
            Debe tener al menos 2 caracteres.
          </p>
        )}
      </div>

      {/* Estado (activa) */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.activa}
          onChange={(next: boolean) => !disabled && onChange({ ...value, activa: next })}
          ariaLabel="Cambiar estado de la colonia"
          // disabled={disabled as any}
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.activa ? "Activa" : "Inactiva"}
        </span>
      </div>

      {/* Cobertura */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.tiene_cobertura}
          onChange={(next: boolean) => !disabled && onChange({ ...value, tiene_cobertura: next })}
          ariaLabel="Marcar si la colonia tiene cobertura"
          // disabled={disabled as any}
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.tiene_cobertura ? "Con cobertura" : "Sin cobertura"}
        </span>
      </div>

      {/* Referencia */}
      <div className="space-y-1.5">
        <label htmlFor="referencia" className="text-sm font-medium text-neutral-700">
          Referencia (opcional)
        </label>
        <textarea
          id="referencia"
          value={value.referencia ?? ""}
          onChange={(e) => onChange({ ...value, referencia: e.target.value })}
          placeholder="Notas o referencia de la zona…"
          className="w-full min-h-[96px] rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          disabled={disabled}
        />
        <p className="text-[11px] text-neutral-500">
          Información adicional útil para repartos o identificación de la colonia.
        </p>
      </div>
    </form>
  );
}
