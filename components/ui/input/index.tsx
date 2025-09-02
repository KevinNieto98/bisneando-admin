"use client";

import React from "react";
import clsx from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  isRequired?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  isRequired = false,
  disabled = false,
  type = "text",
  value,
  placeholder,
  onChange,
  className,
  ...props
}) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label} {isRequired && <span className="text-red-600">*</span>}
        </label>
      )}

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        disabled={disabled}
        required={isRequired}
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
