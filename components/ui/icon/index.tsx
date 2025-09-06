"use client";

import React from "react";
import * as Lucide from "lucide-react";
import { Tags } from "lucide-react";

export type AnyIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const ICONS = Lucide as unknown as Record<string, AnyIcon>;

interface IconoProps extends Omit<React.SVGProps<SVGSVGElement>, "name"> {
  name?: string;       // solo string o undefined
  size?: number;
  className?: string;
}

export  function Icono({
  name,
  size = 16,
  className,
  ...rest
}: IconoProps) {
  // fallback si no hay nombre válido
  const LucideIcon =
    (name ? (ICONS[name as keyof typeof ICONS] as AnyIcon | undefined) : undefined) ?? Tags;

  return <LucideIcon className={className} width={size} height={size} {...rest} />;
}
