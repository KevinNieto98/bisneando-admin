"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, ImagePlus, Trash2, Upload, Minus, Plus } from "lucide-react";
import { Title, Switch } from "@/components";
import { initialData } from "@/seed/seed";

type Props = {
  params: Promise<{ id: string }>; // 👈 params es Promise en Client Components (Next 15)
};

/** Util: kebab-case para slug */
const toSlug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Demo: busca un producto en el seed por id/_id/slug */
function getProductoFromSeed(id: string) {
  const byId = initialData.products.find((p: any) => String(p.id ?? p._id) === id);
  if (byId) return byId;
  const bySlug = initialData.products.find((p: any) => p.slug === id);
  if (bySlug) return bySlug;
  const idx = Number(id);
  if (!Number.isNaN(idx) && idx > 0 && idx <= initialData.products.length) {
    return initialData.products[idx - 1];
  }
  return null;
}

type SeedProduct = (typeof initialData)["products"][number];

type FormState = {
  id?: string | number;
  nombre: string;
  qty: number;
  categoria: string;
  subcategoria: string;
  descripcion: string;
  precio: number;
  marca: string;
  slug: string;
  activo: boolean;
  imagenes: string[];     // rutas/urls existentes
  nuevasImagenes: File[]; // archivos nuevos (preview local)
};

const categoriasDemo = ["Seleccione...", "Electrónica", "Hogar", "Ropa", "Accesorios"];
const subcategoriasDemo = ["Seleccione...", "Laptops", "Smartphones", "Audio", "Decoración"];

export default function ProductoDetallePage({ params }: Props) {
  const { id } = use(params); // 👈 desenrollar la promesa
  const isCreate = id === "nuevo";

  const [loading, setLoading] = useState(true);
  const [touchedSlug, setTouchedSlug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<FormState>({
    id: undefined,
    nombre: "",
    qty: 0,
    categoria: "Seleccione...",
    subcategoria: "Seleccione...",
    descripcion: "",
    precio: 0,
    marca: "",
    slug: "",
    activo: true,
    imagenes: [],
    nuevasImagenes: [],
  });

  // Cargar datos si es edición
  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    const seed = getProductoFromSeed(id);
    if (seed) {
      const mapped: FormState = {
        id: (seed as any).id ?? (seed as any)._id ?? id,
        nombre: (seed as SeedProduct).title ?? "",
        qty: (seed as SeedProduct).inStock ?? 0,
        categoria: (seed as SeedProduct).category ?? "Seleccione...",
        subcategoria: (seed as any).subcategory ?? "Seleccione...",
        descripcion: (seed as any).description ?? "",
        precio: (seed as SeedProduct).price ?? 0,
        marca: (seed as SeedProduct).brand ?? "",
        slug: (seed as SeedProduct).slug ?? "",
        activo: Boolean((seed as any).isActive ?? true),
        imagenes: (seed as SeedProduct).images ?? [],
        nuevasImagenes: [],
      };
      setForm(mapped);
    }
    setLoading(false);
  }, [id, isCreate]);

  // Autogenerar slug si no ha sido tocado manualmente
  useEffect(() => {
    if (!touchedSlug) {
      setForm((prev) => ({ ...prev, slug: toSlug(prev.nombre) }));
    }
  }, [form.nombre, touchedSlug]);

  const previews = useMemo(
    () =>
      form.nuevasImagenes.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [form.nuevasImagenes]
  );

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // Helpers
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const incQty = () => setField("qty", Math.max(0, Number(form.qty) + 1));
  const decQty = () => setField("qty", Math.max(0, Number(form.qty) - 1));
  const onQtyChange = (v: string) => {
    const n = Number(v.replace(",", "."));
    if (Number.isNaN(n)) return setField("qty", 0);
    setField("qty", Math.max(0, Math.floor(n)));
  };

  const onPrecioChange = (v: string) => {
    const n = Number(v.replace(",", "."));
    setField("precio", Number.isNaN(n) ? 0 : Math.max(0, n));
  };

  const removeExistingImage = (idx: number) => {
    setField(
      "imagenes",
      form.imagenes.filter((_, i) => i !== idx)
    );
  };

  const removeNewImage = (file: File) => {
    setField(
      "nuevasImagenes",
      form.nuevasImagenes.filter((f) => f !== file)
    );
  };

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setField("nuevasImagenes", [...form.nuevasImagenes, ...arr]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) {
      alert("El nombre del producto es requerido.");
      return;
    }
    if (form.categoria === "Seleccione...") {
      alert("Selecciona una categoría.");
      return;
    }
    if (!form.slug) {
      alert("El slug no puede estar vacío.");
      return;
    }

    const payload = {
      id: form.id,
      name: form.nombre.trim(),
      quantity: form.qty,
      category: form.categoria !== "Seleccione..." ? form.categoria : undefined,
      subcategory:
        form.subcategoria !== "Seleccione..." ? form.subcategoria : undefined,
      description: form.descripcion.trim(),
      price: form.precio,
      brand: form.marca.trim(),
      slug: form.slug,
      active: form.activo,
      images: [
        ...form.imagenes,
        ...form.nuevasImagenes.map((f) => `uploads/${f.name}`),
      ],
    };

    console.log("Guardar producto:", payload);
    alert(isCreate ? "Producto creado." : "Producto actualizado.");
    // router.push("/productos");
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Title
          title="Productos"
          subtitle="Cargando…"
          showBackButton
          icon={<Boxes className="h-6 w-6 text-neutral-700" />}
        />
        <div className="mt-6 rounded-xl border border-dashed border-neutral-300 p-10 text-center text-sm text-neutral-600">
          Cargando información del producto…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Title
        title={isCreate ? "Nuevo producto" : `Editar producto #${form.id ?? id}`}
        subtitle="Explora, busca y gestiona tus productos"
        showBackButton
        icon={<Boxes className="h-6 w-6 text-neutral-700" />}
      />

      <form onSubmit={onSubmit} className="mt-4 grid grid-cols-1 gap-5">
        {/* Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nombre del producto
            </label>
            <input
              value={form.nombre}
              onChange={(e) => setField("nombre", e.target.value)}
              placeholder="Ej. Laptop Pro 14”"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1">
              <span>Slug</span>
              {!touchedSlug && form.nombre && (
                <span className="text-[10px] text-neutral-500">
                  (autogenerado de “{form.nombre}”)
                </span>
              )}
            </label>
            <input
              value={form.slug}
              onChange={(e) => {
                setTouchedSlug(true);
                setField("slug", toSlug(e.target.value));
              }}
              placeholder="ej. laptop-pro-14"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          {/* Marca */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Marca
            </label>
            <input
              value={form.marca}
              onChange={(e) => setField("marca", e.target.value)}
              placeholder="Ej. Acme"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          {/* Precio */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Precio (HNL)
            </label>
            <input
              inputMode="decimal"
              value={form.precio}
              onChange={(e) => onPrecioChange(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            />
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Cantidad (stock)
            </label>
            <div className="flex rounded-xl border border-neutral-300 bg-white overflow-hidden">
              <button
                type="button"
                onClick={decQty}
                className="px-3 py-2 hover:bg-neutral-50"
                aria-label="Disminuir"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                value={form.qty}
                onChange={(e) => onQtyChange(e.target.value)}
                inputMode="numeric"
                className="w-full px-3 py-2 text-sm outline-none text-center"
              />
              <button
                type="button"
                onClick={incQty}
                className="px-3 py-2 hover:bg-neutral-50"
                aria-label="Aumentar"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Activo */}
          <div className="flex items-center gap-3 mt-6 md:mt-0">
            <Switch
              checked={form.activo}
              onChange={(next) => setField("activo", next)}
              ariaLabel="Cambiar estado del producto"
            />
            <span className="text-sm font-medium text-neutral-700">
              {form.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        {/* Categoría / Subcategoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Categoría
            </label>
            <select
              value={form.categoria}
              onChange={(e) => setField("categoria", e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            >
              {categoriasDemo.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Subcategoría
            </label>
            <select
              value={form.subcategoria}
              onChange={(e) => setField("subcategoria", e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
            >
              {subcategoriasDemo.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1">
            Descripción
          </label>
          <textarea
            rows={5}
            value={form.descripcion}
            onChange={(e) => setField("descripcion", e.target.value)}
            placeholder="Describe el producto…"
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10"
          />
        </div>

        {/* Imágenes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-800">
              Imágenes del producto
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              >
                <Upload className="w-4 h-4" />
                Cargar imágenes
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => onFilesSelected(e.target.files)}
              />
            </div>
          </div>

          {/* Grid de imágenes existentes */}
          {(form.imagenes?.length ?? 0) > 0 && (
            <>
              <div className="text-xs text-neutral-500">Existentes</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {form.imagenes.map((src, idx) => (
                  <div
                    key={`old-${idx}-${src}`}
                    className="relative aspect-square overflow-hidden rounded-xl border bg-white"
                  >
                    <img
                      src={src.startsWith("/") ? src : `/products/${src}`}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute right-1.5 top-1.5 inline-flex items-center rounded-md bg-white/90 p-1 shadow hover:bg-white"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Grid de nuevas imágenes (previews) */}
          {previews.length > 0 && (
            <>
              <div className="text-xs text-neutral-500">Por subir</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {previews.map((p) => (
                  <div
                    key={p.url}
                    className="relative aspect-square overflow-hidden rounded-xl border bg-white"
                  >
                    <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(p.file)}
                      className="absolute right-1.5 top-1.5 inline-flex items-center rounded-md bg-white/90 p-1 shadow hover:bg-white"
                      title="Quitar"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer acciones */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            <ImagePlus className="w-4 h-4" />
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
