'use client';

import React from "react";
import clsx from "clsx";

// Tipos de variantes de color
type Variant = "default" | "success" | "warning" | "danger" | "white" | "blue";

interface AppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<AppButtonProps> = ({
  variant = "default",
  icon,
  iconOnly = false,
  children,
  className,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl border text-sm font-medium transition-colors";

  const variants: Record<Variant, string> = {
    default:
      "border-neutral-200 bg-neutral-900 text-white hover:bg-neutral-800",
    success:
      "border-green-200 bg-green-600 text-white hover:bg-green-700",
    warning:
      "border-yellow-200 bg-yellow-500 text-white hover:bg-yellow-600",
    danger:
      "border-red-200 bg-red-600 text-white hover:bg-red-700",
    white:
      "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300",
    blue:
      "border-blue-200 bg-blue-600 text-white hover:bg-blue-700",
  };

  const padding = iconOnly ? "p-2 rounded-lg" : "px-3 py-2 gap-2";

  return (
    <button
      className={clsx(baseStyles, variants[variant], padding, className)}
      {...props}
    >
      {icon}
      {!iconOnly && children}
    </button>
  );
};
