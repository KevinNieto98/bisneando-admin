"use client";

import React from "react";
import clsx from "clsx";

export type SwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export const Switch = ({
  checked,
  onChange,
  disabled = false,
  ariaLabel = "Cambiar estado",
  className,
}: SwitchProps) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={clsx(
        "relative inline-flex h-6 w-11 items-center rounded-full transition",
        checked ? "bg-emerald-500/90" : "bg-neutral-300",
        disabled && "opacity-60 cursor-not-allowed",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/10",
        className
      )}
    >
      <span
        className={clsx(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
};
