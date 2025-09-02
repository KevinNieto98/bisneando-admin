"use client";

import React from "react";
import clsx from "clsx";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  isRequired?: boolean;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  isRequired = false,
  disabled = false,
  value,
  placeholder,
  className,
  rows = 4,
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label} {isRequired && <span className="text-red-600">*</span>}
        </label>
      )}

      <textarea
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={isRequired}
        rows={rows}
        className={clsx(
          "w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none",
          "border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400",
          disabled && "bg-neutral-100 cursor-not-allowed opacity-60",
          className
        )}
        {...props}
      />
    </div>
  );
};
