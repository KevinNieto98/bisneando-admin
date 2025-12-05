"use client";

import React from "react";

interface StatusFooterModalProps {
  disabled?: boolean;
  formId?: string;
  onCancel: () => void;
}

export const FooterModal: React.FC<StatusFooterModalProps> = ({
  disabled = false,
  formId = "status-form",
  onCancel,
}) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => {
          if (disabled) return;
          onCancel();
        }}
        className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60"
        disabled={disabled}
      >
        Cancelar
      </button>
      <button
        type="submit"
        form={formId}
        className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        disabled={disabled}
        aria-busy={disabled}
      >
        Guardar
      </button>
    </div>
  );
};
