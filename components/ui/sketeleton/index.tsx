'use client';

import React from "react";
import clsx from "clsx";

type SkeletonVariant = "line" | "circle" | "rect";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = "line",
  width,
  height,
  className,
  ...props
}) => {
  const baseStyles =
    "animate-pulse bg-neutral-200 rounded-md";

  const shapes: Record<SkeletonVariant, string> = {
    line: "h-4 w-full rounded-md",
    circle: "rounded-full",
    rect: "rounded-lg",
  };

  return (
    <div
      className={clsx(baseStyles, shapes[variant], className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
      {...props}
    />
  );
};
