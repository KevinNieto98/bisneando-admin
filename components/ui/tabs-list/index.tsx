"use client";

import { cn } from "@/components";
import * as React from "react";

export function TabsList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-xl bg-neutral-50 p-1",
        className
      )}
    >
      {children}
    </div>
  );
}
