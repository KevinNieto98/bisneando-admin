// /componentes/ProductGridItem.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useMemo, useState } from "react";
import { Switch } from "@/components";

export interface UIProduct {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  images: string[];
  brand?: string;
  quantity: number;
  active: boolean;
  category?: string;
}

interface Props {
  product: UIProduct;
  className?: string;
  onToggleActive?: (id: UIProduct["id"], next: boolean) => void;
}

const usePrice = (value: number) =>
  useMemo(
    () =>
      new Intl.NumberFormat("es-HN", {
        style: "currency",
        currency: "HNL",
        maximumFractionDigits: 2,
      }).format(value),
    [value]
  );

// Resuelve la ruta a mostrar: si viene un nombre de archivo => /products/<nombre>
// si ya es absoluta (/algo.png o http...), la respeta tal cual.
const resolveSrc = (nameOrPath: string) => {
  if (!nameOrPath) return "";
  if (nameOrPath.startsWith("/") || nameOrPath.startsWith("http")) {
    return nameOrPath;
  }
  return `/products/${nameOrPath}`;
};

export const ProductGridItem: React.FC<Props> = ({
  product,
  className = "",
  onToggleActive,
}) => {
  // Fallback ABSOLUTO en /public
  const defaultSrc = "/not_available.png";

  const first = product.images?.[0];
  const second = product.images?.[1];

  // Guardamos SIEMPRE la ruta lista para <Image />
  const [displaySrc, setDisplaySrc] = useState<string>(
    first ? resolveSrc(first) : defaultSrc
  );

  const hasSecond = Boolean(second);
  const price = usePrice(product.price);
  const inactive = !product.active;

  return (
    <div
      className={[
        "group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "bg-white shadow-sm transition",
        "hover:shadow-xl hover:-translate-y-0.5",
        inactive ? "grayscale opacity-75" : "",
        className,
      ].join(" ")}
    >
      <Link
        href={`/productos/${product.id}`}
        className="block focus:outline-none flex-1"
        aria-label={`Ver detalles de ${product.title}`}
      >
        <div className="relative aspect-[4/3] w-full h-48 md:h-64">
          <Image
            src={displaySrc}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 ease-out will-change-transform"
            onMouseEnter={() => hasSecond && setDisplaySrc(resolveSrc(second!))}
            onMouseLeave={() =>
              setDisplaySrc(first ? resolveSrc(first) : defaultSrc)
            }
            onError={() => setDisplaySrc(defaultSrc)} // 👈 caída segura a default
          />

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-200/40 via-zinc-100/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            aria-hidden
          />

          {product.active && (
            <div className="absolute inset-x-3 bottom-3 flex justify-end opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 translate-y-2">
              <span className="inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md backdrop-blur">
                Ver detalles
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="mt-auto flex items-start justify-between gap-3 p-3 md:p-4 bg-zinc-50">
        <div className="min-w-0">
          {product.brand && (
            <div className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {product.brand}
            </div>
          )}
          <Link
            href={`/productos/${product.id}`}
            className="line-clamp-2 text-sm font-medium text-zinc-700 transition-colors hover:text-blue-600"
            title={product.title}
          >
            {product.title}
          </Link>
          <div className="mt-1 text-sm font-semibold tracking-tight text-zinc-800">
            {price}
          </div>
          <div className="mt-1 text-xs text-zinc-600">
            Stock: <span className="font-medium text-zinc-800">{product.quantity}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Switch
            checked={product.active}
            onChange={(next) => onToggleActive?.(product.id, next)}
            ariaLabel={product.active ? "Desactivar producto" : "Activar producto"}
          />
          <span className="text-[10px] font-medium text-zinc-600">
            {product.active ? "Activo" : "Inactivo"}
          </span>
        </div>
      </div>

      {inactive && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl bg-white/50"
          aria-hidden
        />
      )}
    </div>
  );
};

export default ProductGridItem;
