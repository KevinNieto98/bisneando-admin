// src/app/(tu-ruta)/components/MarcaForm.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { Switch } from '@/components' // ajusta la ruta si aplica

interface Marca {
  id_marca: number
  nombre_marca: string
  is_active: boolean
}

interface MarcaFormProps {
  value: Marca
  onChange: (next: Marca) => void
  onSubmit: () => void
  formId?: string
  autoFocus?: boolean
  minLenNombre?: number
  /** 🚀 Se llama cuando el formulario terminó de montarse */
  onReady?: () => void
}

export const MarcaForm: React.FC<MarcaFormProps> = ({
  value,
  onChange,
  onSubmit,
  formId = 'marca-form',
  autoFocus = true,
  minLenNombre = 2,
  onReady,
}) => {
  const [touched, setTouched] = useState(false)
  const nombreValido = (value.nombre_marca ?? '').trim().length >= minLenNombre

  // Notifica al padre que el form ya está listo (montado)
  useEffect(() => {
    const t = setTimeout(() => onReady?.(), 0) // microtask para asegurar layout
    return () => clearTimeout(t)
  }, [onReady])

  return (
    <form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault()
        setTouched(true)
        if (!nombreValido) return
        onSubmit()
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <label htmlFor="nombre_marca" className="text-sm font-medium text-neutral-700">
          Nombre de la marca
        </label>
        <input
          id="nombre_marca"
          autoFocus={autoFocus}
          value={value.nombre_marca}
          onChange={(e) => onChange({ ...value, nombre_marca: e.target.value })}
          placeholder="Ej. Acme"
          className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          aria-invalid={touched && !nombreValido}
          aria-describedby="nombre_marca_help"
          autoComplete="off"
        />
        {touched && !nombreValido && (
          <p id="nombre_marca_help" className="text-xs text-red-600">
            Debe tener al menos {minLenNombre} caracteres.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          checked={value.is_active}
          onChange={(next: boolean) => onChange({ ...value, is_active: next })}
          ariaLabel="Cambiar disponibilidad"
        />
        <span className="text-sm font-medium text-neutral-700">
          {value.is_active ? 'Disponible' : 'No disponible'}
        </span>
      </div>
    </form>
  )
}
