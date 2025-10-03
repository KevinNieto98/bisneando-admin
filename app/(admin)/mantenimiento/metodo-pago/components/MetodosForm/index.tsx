// src/app/(tu-ruta)/components/MetodoForm.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Switch, IconPicker } from '@/components'

export interface Metodo {
  id_metodo: number
  nombre_metodo: string
  is_active: boolean
  icono?: string 
}

export interface MetodoFormProps {
  value: Metodo
  onChange: (next: Metodo) => void
  onSubmit: () => void
  formId?: string
  autoFocus?: boolean
  minLenNombre?: number
  onReady?: () => void
  disabled?: boolean
}

export const MetodoForm: React.FC<MetodoFormProps> = ({
  value,
  onChange,
  onSubmit,
  formId = 'metodo-form',
  autoFocus = true,
  minLenNombre = 2,
  onReady,
  disabled = false,
}) => {
  const [touched, setTouched] = useState(false)
  const nombreValido = (value.nombre_metodo ?? '').trim().length >= minLenNombre

  useEffect(() => {
    const t = setTimeout(() => onReady?.(), 0)
    return () => clearTimeout(t)
  }, [onReady])

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault()
        if (disabled) return
        setTouched(true)
        if (!nombreValido) return
        onSubmit()
      }}
      className="space-y-4"
      noValidate
      aria-busy={disabled}
    >
      {/* Nombre */}
      <div className="space-y-1.5">
        <label htmlFor="nombre_metodo" className="text-sm font-medium text-neutral-700">
          Nombre del Método
        </label>
        <input
          id="nombre_metodo"
          autoFocus={autoFocus}
          value={value.nombre_metodo}
          onChange={(e) => onChange({ ...value, nombre_metodo: e.target.value })}
          placeholder="Ej. Tarjeta de crédito"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400 disabled:opacity-60"
          aria-invalid={touched && !nombreValido}
          aria-describedby="nombre_metodo_help"
          autoComplete="off"
          disabled={disabled}
        />
        {touched && !nombreValido && (
          <p id="nombre_metodo_help" className="text-xs text-red-600">
            Debe tener al menos {minLenNombre} caracteres.
          </p>
        )}
      </div>

      {/* Estado */}
      <div className="flex items-center gap-3">
        <Switch
          checked={value.is_active}
          onChange={(next: boolean) => !disabled && onChange({ ...value, is_active: next })}
          ariaLabel="Cambiar disponibilidad"
          // disabled={disabled as any}  // si tu Switch acepta disabled
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.is_active ? 'Disponible' : 'No disponible'}
        </span>
      </div>

      {/* Selector de icono */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Icono</label>
        <div className="flex items-center gap-3">
          <IconPicker
            value={value.icono ?? null}
            onChange={(name) => !disabled && onChange({ ...value, icono: name })}
            // disabled={disabled as any} // si tu IconPicker acepta disabled
          />
          {value.icono && (
            <span className="text-xs text-neutral-600">
              Seleccionado: {value.icono}
            </span>
          )}
        </div>
        <p className="text-[11px] text-neutral-500">
          Devuelve el nombre del icono de lucide-react (ej. "CreditCard").
        </p>
      </div>
    </form>
  )
}
