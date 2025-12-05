"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Switch } from "@/components";
import { StatusOrder } from "../../actions";

interface StatusFormProps {
  value: StatusOrder;
  onChange: (next: StatusOrder) => void;
  onSubmit: () => void;
  formId?: string;
  autoFocus?: boolean;
  minLenNombre?: number;
  onReady?: () => void;
  disabled?: boolean;
  /** Lista completa de status para poder armar el selector de "Siguiente status" */
  allStatuses: StatusOrder[];
}

export const StatusForm: React.FC<StatusFormProps> = ({
  value,
  onChange,
  onSubmit,
  formId = "status-form",
  autoFocus = true,
  minLenNombre = 2,
  onReady,
  disabled = false,
  allStatuses,
}) => {
  const [touched, setTouched] = useState(false);
  const nombreValido = (value.nombre ?? "").trim().length >= minLenNombre;

  useEffect(() => {
    const t = setTimeout(() => onReady?.(), 0);
    return () => clearTimeout(t);
  }, [onReady]);

  // Opciones para el select de siguiente status
  const nextStatusOptions = useMemo(
    () =>
      allStatuses.filter(
        (s) =>
          // excluir el actual en edición
          s.id_status !== value.id_status
      ),
    [allStatuses, value.id_status]
  );

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
      {/* Nombre del status */}
      <div className="space-y-1.5">
        <label
          htmlFor="nombre_status"
          className="text-sm font-medium text-neutral-700"
        >
          Nombre del status
        </label>
        <input
          id="nombre_status"
          autoFocus={autoFocus}
          value={value.nombre}
          onChange={(e) => onChange({ ...value, nombre: e.target.value })}
          placeholder="Ej. Recibido"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          aria-invalid={touched && !nombreValido}
          aria-describedby="nombre_status_help"
          autoComplete="off"
          disabled={disabled}
        />
        {touched && !nombreValido && (
          <p id="nombre_status_help" className="text-xs text-red-600">
            Debe tener al menos {minLenNombre} caracteres.
          </p>
        )}
      </div>

      {/* Next status (selector) */}
      <div className="space-y-1.5">
        <label
          htmlFor="next_status"
          className="text-sm font-medium text-neutral-700"
        >
          Siguiente status
        </label>

        <select
          id="next_status"
          value={value.next_status ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            const num = val === "" ? null : Number(val);
            onChange({ ...value, next_status: num });
          }}
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          disabled={disabled || nextStatusOptions.length === 0}
        >
          <option value="">
            {nextStatusOptions.length === 0
              ? "No hay otros status disponibles"
              : "Sin siguiente status"}
          </option>
          {nextStatusOptions.map((s) => (
            <option key={s.id_status} value={s.id_status}>
              {s.id_status} - {s.nombre}
            </option>
          ))}
        </select>

        <p className="text-xs text-neutral-500">
          Si seleccionas “Sin siguiente status”, este status no tendrá un paso
          siguiente directo.
        </p>
      </div>

      {/* Last status */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.last_status}
          onChange={(next: boolean) =>
            !disabled && onChange({ ...value, last_status: next })
          }
          ariaLabel="Marcar como último status"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.last_status
            ? "Es el último status del flujo"
            : "No es el último status"}
        </span>
      </div>
    </form>
  );
};
