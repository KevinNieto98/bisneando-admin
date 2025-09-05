// src/app/(tu-ruta)/components/FooterModal.tsx
'use client'

import { useUIStore } from '@/store';
import React from 'react'

interface Metodo {
  id_metodo: number
  nombre_metodo: string
  is_active: boolean
}

export const FooterModal = ({ disabled = false }: { disabled?: boolean }) => {
  const formId = 'metodo-form';
  const closeModal = useUIStore((s) => s.closeModal);
  const setEditing = useUIStore((s) => s.setEditing) as (v: Metodo | null) => void;

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => {
          if (disabled) return;     // ← evita cerrar durante envío
          closeModal();
          setEditing(null);
        }}
        className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
        disabled={disabled}          // ← BLOQUEA
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={formId}
        className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        disabled={disabled}          // ← BLOQUEA
        aria-busy={disabled}
      >
        Guardar
      </button>
    </div>
  )
}
