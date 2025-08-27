"use client";

import { cn, useTabsCtx } from "@/components";
import * as React from "react";

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { value: active, ids } = useTabsCtx();
  const triggerId = ids[value];
  const panelId = triggerId ? `${triggerId}-panel` : undefined;
  const hidden = active !== value;

  return (
    <div
      id={panelId}
      role="tabpanel"
      aria-labelledby={triggerId}
      hidden={hidden}
      className={cn(!hidden && "mt-4", className)}
    >
      {!hidden && children}
    </div>
  );
}
