'use client'

import { useUIStore } from '@/store';
import React, { useState } from 'react'

interface Marca {
  id_marca: number
  nombre_marca: string
  is_active: boolean
}

export const FooterModal = ({
    
}) => {
      const formId = "marca-form";

      const closeModal = useUIStore((s) => s.closeModal);
      const setEditing = useUIStore((s) => s.setEditing) as (v: Marca | null) => void;
    
    return (
        <>
            <div className="flex items-center justify-end gap-2">
                <button
                    onClick={() => {
                        closeModal();
                        setEditing(null);
                    }}
                    className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    form={formId}
                    className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                    Guardar
                </button>
            </div>
        </>
    )
}
