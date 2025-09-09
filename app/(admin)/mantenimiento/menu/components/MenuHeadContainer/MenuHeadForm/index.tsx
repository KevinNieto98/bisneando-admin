"use client";

import React, { useEffect, useState } from "react";
import { Switch } from "@/components";

export type MenuHead = {
  id_menu_head: number;
  nombre: string;
  is_active: boolean;
};

export const MenuHeadForm: React.FC<{
  value: MenuHead;
  onChange: (v: MenuHead) => void;
  onSubmit: () => void;
  formId?: string;
  onReady?: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onSubmit, formId = "menu-head-form", onReady, disabled }) => {
  const [touched, setTouched] = useState(false);
  const nombreValido = (value.nombre ?? "").trim().length >= 2;

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
      <div className="space-y-1.5">
        <label htmlFor="nombre_head" className="text-sm font-medium text-neutral-700">
          Nombre (se guarda en MAYÚSCULAS)
        </label>
        <input
          id="nombre_head"
          value={value.nombre}
          onChange={(e) =>
            onChange({ ...value, nombre: e.target.value.toUpperCase() }) // fuerza MAYÚSCULAS en UI
          }
          placeholder="EJ. PRINCIPAL"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          aria-invalid={touched && !nombreValido}
          autoComplete="off"
          disabled={disabled}
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={value.is_active}
          onChange={(next: boolean) => !disabled && onChange({ ...value, is_active: next })}
          ariaLabel="Cambiar estado"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.is_active ? "Activo" : "Inactivo"}
        </span>
      </div>
    </form>
  );
};
