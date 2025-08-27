"use client";

import * as React from "react";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
  register: (v: string, id: string) => void;
  ids: Record<string, string>; // value -> trigger id
};

const TabsCtx = React.createContext<TabsContextValue | null>(null);

export function useTabsCtx() {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error("Tabs components must be used within <Tabs>.");
  return ctx;
}

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = React.useState(
    controlledValue ?? defaultValue ?? ""
  );

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? (controlledValue as string) : uncontrolled;

  const setValue = (v: string) => {
    if (!isControlled) setUncontrolled(v);
    onValueChange?.(v);
  };

  const idsRef = React.useRef<Record<string, string>>({});
  const register = (v: string, id: string) => {
    idsRef.current[v] = id;
  };

  return (
    <TabsCtx.Provider
      value={{ value, setValue, register, ids: idsRef.current }}
    >
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}
