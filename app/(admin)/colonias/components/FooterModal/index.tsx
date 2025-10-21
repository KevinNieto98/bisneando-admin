"use client";

import React from "react";

interface FooterModalProps {
  formId: string;
  onCancel: () => void;
  disabled?: boolean;
  cancelText?: string;
  saveText?: string;

  /** Opcionales para autogenerar labels */
  entityLabel?: string; // Ej: "Colonia"
  mode?: "create" | "update"; // cambia el texto por "Crear/Actualizar ..."
}

export const FooterModal: React.FC<FooterModalProps> = ({
  formId,
  onCancel,
  disabled = false,
  cancelText = "Cancelar",
  saveText,
  entityLabel,
  mode,
}) => {
  // Si pasan entityLabel o mode, generamos un texto por defecto acorde
  const computedSave =
    saveText ??
    (entityLabel && mode
      ? `${mode === "create" ? "Crear" : "Actualizar"} ${entityLabel}`
      : "Guardar");

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
        {cancelText}
      </button>

      <button
        type="submit"
        form={formId}
        className="inline-flex items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
        disabled={disabled}
        aria-busy={disabled}
      >
        {computedSave}
      </button>
    </div>
  );
};
