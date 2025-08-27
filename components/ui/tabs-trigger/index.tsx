"use client";

import { cn, useTabsCtx } from "@/components";
import * as React from "react";

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: active, setValue, register } = useTabsCtx();
  const id = React.useId();

  React.useEffect(() => {
    register(value, id);
  }, [value, id, register]);

  const selected = active === value;

  return (
    <button
      id={id}
      role="tab"
      type="button"
      aria-selected={selected}
      aria-controls={selected ? `${id}-panel` : undefined}
      onClick={() => setValue(value)}
      className={cn(
        "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
        selected
          ? "bg-white shadow text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100",
        className
      )}
    >
      {children}
    </button>
  );
}
