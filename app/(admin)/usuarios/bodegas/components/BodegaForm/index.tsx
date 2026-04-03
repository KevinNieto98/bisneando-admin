"use client";

import { useEffect, useState } from "react";
import { Switch } from "@/components";
import { User } from "lucide-react";
import type { BodegaFormValue, UsuarioBodegaOpcion } from "../../actions";

type BodegaFormProps = {
  value: BodegaFormValue;
  onChange: (next: BodegaFormValue) => void;
  onSubmit: () => void;
  usuarios: UsuarioBodegaOpcion[];
  formId?: string;
  onReady?: () => void;
  disabled?: boolean;
};

const inputCls =
  "w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60";

export function BodegaForm({
  value,
  onChange,
  onSubmit,
  usuarios,
  formId = "bodega-form",
  onReady,
  disabled = false,
}: BodegaFormProps) {
  const [touched, setTouched] = useState(false);
  const nombreValido = (value.nombre_bodega ?? "").trim().length >= 2;

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
    >
      {/* Nombre */}
      <div className="space-y-1.5">
        <label htmlFor="nombre_bodega" className="text-sm font-medium text-neutral-700">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre_bodega"
          autoFocus
          placeholder="Ej. Bodega Central"
          value={value.nombre_bodega}
          onChange={(e) => onChange({ ...value, nombre_bodega: e.target.value })}
          disabled={disabled}
          className={inputCls}
        />
        {touched && !nombreValido && (
          <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
        )}
      </div>

      {/* Encargado */}
      <div className="space-y-1.5">
        <label htmlFor="encargado_id" className="text-sm font-medium text-neutral-700 flex items-center gap-1.5">
          <User className="h-4 w-4 text-neutral-400" />
          Usuario encargado
        </label>
        <select
          id="encargado_id"
          value={value.encargado_id ?? ""}
          onChange={(e) => onChange({ ...value, encargado_id: e.target.value || null })}
          disabled={disabled}
          className={inputCls}
        >
          <option value="">— Sin encargado —</option>
          {usuarios.map((u) => {
            const nombre = `${u.nombre} ${u.apellido}`.trim();
            const tieneOtraBodega = u.id_bodega !== null && u.id_bodega !== undefined;
            return (
              <option key={u.id} value={u.id}>
                {nombre}
                {tieneOtraBodega ? ` (bodega #${u.id_bodega})` : ""}
              </option>
            );
          })}
        </select>
        {usuarios.length === 0 && (
          <p className="text-xs text-amber-600">No hay usuarios activos con perfil de bodega.</p>
        )}
      </div>

      {/* Dirección */}
      <div className="space-y-1.5">
        <label htmlFor="direccion" className="text-sm font-medium text-neutral-700">
          Dirección
        </label>
        <textarea
          id="direccion"
          rows={2}
          placeholder="Colonia, calle, referencia…"
          value={value.direccion ?? ""}
          onChange={(e) => onChange({ ...value, direccion: e.target.value || null })}
          disabled={disabled}
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60 resize-none"
        />
      </div>

      {/* Teléfono */}
      <div className="space-y-1.5">
        <label htmlFor="telefono" className="text-sm font-medium text-neutral-700">
          Teléfono
        </label>
        <input
          id="telefono"
          type="tel"
          placeholder="+504 9999-9999"
          value={value.telefono ?? ""}
          onChange={(e) => onChange({ ...value, telefono: e.target.value || null })}
          disabled={disabled}
          className={inputCls}
        />
      </div>

      {/* Coordenadas */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label htmlFor="latitud" className="text-sm font-medium text-neutral-700">Latitud</label>
          <input
            id="latitud"
            type="number"
            step="any"
            placeholder="14.0839"
            value={value.latitud ?? ""}
            onChange={(e) => onChange({ ...value, latitud: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            className={inputCls}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="longitud" className="text-sm font-medium text-neutral-700">Longitud</label>
          <input
            id="longitud"
            type="number"
            step="any"
            placeholder="-87.2069"
            value={value.longitud ?? ""}
            onChange={(e) => onChange({ ...value, longitud: e.target.value ? Number(e.target.value) : null })}
            disabled={disabled}
            className={inputCls}
          />
        </div>
      </div>

      {/* Estado */}
      <div className="flex items-center gap-3 pt-1">
        <Switch
          checked={value.is_active}
          onChange={(next) => !disabled && onChange({ ...value, is_active: next })}
          ariaLabel="Estado de la bodega"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.is_active ? "Activa" : "Inactiva"}
        </span>
      </div>
    </form>
  );
}
