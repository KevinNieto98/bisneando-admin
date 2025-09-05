// src/app/(tu-ruta)/components/MetodoForm.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Switch } from '@/components'

interface Metodo {
  id_metodo: number
  nombre_metodo: string
  is_active: boolean
}

interface MetodoFormProps {
  value: Metodo
  onChange: (next: Metodo) => void
  onSubmit: () => void
  formId?: string
  autoFocus?: boolean
  minLenNombre?: number
  onReady?: () => void
  disabled?: boolean           // ← NUEVO
}

export const MetodoForm: React.FC<MetodoFormProps> = ({
  value,
  onChange,
  onSubmit,
  formId = 'metodo-form',
  autoFocus = true,
  minLenNombre = 2,
  onReady,
  disabled = false,            // ← NUEVO
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
        if (disabled) return          // ← Evita submit doble
        setTouched(true)
        if (!nombreValido) return
        onSubmit()
      }}
      className="space-y-4"
      noValidate
      aria-busy={disabled}            // ← Accesibilidad
    >
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
          disabled={disabled}         // ← BLOQUEA INPUT
        />
        {touched && !nombreValido && (
          <p id="nombre_metodo_help" className="text-xs text-red-600">
            Debe tener al menos {minLenNombre} caracteres.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={value.is_active}
          onChange={(next: boolean) => !disabled && onChange({ ...value, is_active: next })} // ← BLOQUEO
          ariaLabel="Cambiar disponibilidad"
          disabled={disabled as any}   // ← si tu Switch acepta disabled
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.is_active ? 'Disponible' : 'No disponible'}
        </span>
      </div>
    </form>
  )
}
