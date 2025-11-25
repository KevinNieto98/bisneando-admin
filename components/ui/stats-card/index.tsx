// 👈 Quita esta línea si la tienes:
// "use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import React from "react";

const numberFmt = new Intl.NumberFormat("es-HN");

export interface StatsCardProps {
  title: string;
  value: number;
  Icon: React.ComponentType<{ className?: string }>;
  href: string;
}

export function StatsCard({ title, value, Icon, href }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-1.5">
        <p className="text-sm font-medium text-neutral-700">{title}</p>
        <div className="p-1.5 rounded-2xl bg-neutral-100">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="px-4 pb-3">
        <div className="text-2xl font-bold tracking-tight">
          {numberFmt.format(value)}
        </div>
      </div>
      <div className="px-4 pb-4">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-sm font-medium hover:bg-neutral-100 transition"
        >
          Ir <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
