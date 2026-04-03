"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components";
import type { Perfil } from "../../actions";

type PerfilFormProps = {
  value: Perfil;
  onChange: (next: Perfil) => void;
  onSubmit: () => void;
  formId?: string;
  onReady?: () => void;
  disabled?: boolean;
};

export function PerfilForm({
  value,
  onChange,
  onSubmit,
  formId = "perfil-form",
  onReady,
  disabled = false,
}: PerfilFormProps) {
  const [touched, setTouched] = useState(false);
  const nombreValido = (value.nombre_perfil ?? "").trim().length >= 2;

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
      className="space-y-5"
      noValidate
      aria-busy={disabled}
    >
      <div className="space-y-1.5">
        <label htmlFor="nombre_perfil" className="text-sm font-medium text-neutral-700">
          Nombre del perfil <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre_perfil"
          autoFocus
          value={value.nombre_perfil}
          onChange={(e) => onChange({ ...value, nombre_perfil: e.target.value })}
          placeholder="Ej. Administrador"
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
          checked={value.activo}
          onChange={(next: boolean) => !disabled && onChange({ ...value, activo: next })}
          ariaLabel="Cambiar estado del perfil"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.activo ? "Activo" : "Inactivo"}
        </span>
      </div>
    </form>
  );
}
