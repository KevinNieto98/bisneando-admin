"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { createPortal } from "react-dom";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  preventClose?: boolean;     // bloquear cierre por overlay/Esc
  closeOnOverlay?: boolean;   // desactivar cierre al click en overlay
  initialFocusRef?: React.RefObject<HTMLElement>;
};

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export const Modal = ({
  open,
  onClose,
  title,
  icon,
  content,
  footer,
  size = "md",
  className,
  preventClose = false,
  closeOnOverlay = true,
  initialFocusRef,
}: ModalProps) => {
  const mounted = typeof window !== "undefined";
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleId = "modal-title";

  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open || preventClose) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, preventClose]);

  useEffect(() => {
    if (open && initialFocusRef?.current) {
      initialFocusRef.current.focus();
    }
  }, [open, initialFocusRef]);

  if (!mounted || !open) return null;

  const node = (
    <div
      aria-modal
      role="dialog"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 grid place-items-center p-4"
    >
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
        onClick={() => {
          if (!preventClose && closeOnOverlay) onClose();
        }}
      />
      <div
        className={clsx(
          "relative w-full rounded-2xl border border-neutral-200 bg-white shadow-xl",
          sizeClass[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="grid place-items-center rounded-xl bg-neutral-900/5 p-2">
                {icon}
              </div>
            )}
            <h3 id={titleId} className="text-base md:text-lg font-semibold tracking-tight">
              {title}
            </h3>
          </div>

          <button
            onClick={() => !preventClose && onClose()}
            className="inline-flex items-center rounded-lg p-1.5 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Línea decorativa */}
        <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 via-blue-500 to-fuchsia-500" />

        {/* Content */}
        <div className="px-5 py-4">{content}</div>

        {/* Footer */}
        {footer && <div className="px-5 py-3 border-t border-neutral-200">{footer}</div>}
      </div>
    </div>
  );

  return createPortal(node, document.body);
};
