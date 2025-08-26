"use client";

import React from "react";

interface SubtitleProps {
  text: string;
  className?: string;
}

export function Subtitle({ text, className = "" }: SubtitleProps) {
  return (
    <div className={`w-full ${className}`}>
      <h2 className="text-lg md:text-xl font-semibold text-neutral-800">
        {text}
      </h2>
      {/* Línea degradada opcional */}
      <div className="mt-1 h-0.5 w-24 bg-gradient-to-r from-emerald-500 via-blue-500 to-fuchsia-500 rounded-full" />
    </div>
  );
}
