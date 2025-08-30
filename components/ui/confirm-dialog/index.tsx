// components/ConfirmDialog.tsx
'use client';

import React, { useRef } from 'react';
import { useUIStore } from '@/store';
import { Modal } from '@/components'; // <-- en tu page importas Modal desde "@/components"

export function ConfirmDialog() {
  const isOpen = useUIStore((s) => s.isConfirmOpen);
  const { titulo, mensaje, confirmText, rejectText, preventClose } = useUIStore((s) => s.confirm);
  const closeConfirm = useUIStore((s) => s.closeConfirm);
  const runConfirm = useUIStore((s) => s.runConfirm);

  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      open={isOpen}
      onClose={closeConfirm}
      title={titulo}
      content={<p className="text-sm text-neutral-700">{mensaje}</p>}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex items-center rounded-xl border border-neutral-300 px-3 py-2 text-sm hover:bg-neutral-50"
            onClick={closeConfirm}
          >
            {rejectText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            className="inline-flex items-center rounded-xl bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
            onClick={runConfirm}
          >
            {confirmText}
          </button>
        </div>
      }
      size="sm"
      preventClose={preventClose}
      closeOnOverlay={!preventClose}
   //   initialFocusRef={confirmBtnRef}
    />
  );
}
