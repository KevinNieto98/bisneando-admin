"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, ImagePlus, Trash2, Upload, Minus, Plus } from "lucide-react";
import { Title, Switch, Button, ImageUploaded } from "@/components";
import { initialData } from "@/seed/seed";
import { getCategoriasActivasAction, getMarcasActivasAction } from "../../actions";

type Props = {
  params: Promise<{ id?: string }>;
};

const toSlug = (s: string) =>
  s.normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

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
  categoria: string;      // seguimos guardando el nombre de la categoría
  subcategoria: string;
  descripcion: string;
  precio: number;
  marca: string;          // guardamos el nombre de la marca
  slug: string;
  activo: boolean;
  imagenes: string[];
  nuevasImagenes: File[];
};

// 🔹 Tipo mínimo para categorías activas
type CategoriaActiva = {
  id_categoria: number;
  nombre_categoria: string;
};

// 🔹 Tipo mínimo para marcas activas
type MarcaActiva = {
  id_marca: number;
  nombre_marca: string;
};

export function PageContent({ params }: Props) {
  const { id } = use(params);
  const isCreate = !id || id === "new" || id === "nuevo";

  const [loading, setLoading] = useState(true);
  const [touchedSlug, setTouchedSlug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔹 Categorías activas
  const [cats, setCats] = useState<CategoriaActiva[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);

  // 🔹 Marcas activas
  const [marcas, setMarcas] = useState<MarcaActiva[]>([]);
  const [marcasLoading, setMarcasLoading] = useState(true);
  const [marcasError, setMarcasError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>({
    id: undefined,
    nombre: "",
    qty: 0,
    categoria: "Seleccione...",
    subcategoria: "Seleccione...",
    descripcion: "",
    precio: 0,
    marca: "", // placeholder vacío para que el select muestre "Seleccione..."
    slug: "",
    activo: true,
    imagenes: [],
    nuevasImagenes: [],
  });

  // 🔹 Cargar categorías activas
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setCatsLoading(true);
        setCatsError(null);
        const data = await getCategoriasActivasAction();
        if (!alive) return;
        // Normaliza por si el action trae más/menos campos
        const normalized: CategoriaActiva[] = (Array.isArray(data) ? data : [])
          .map((r: any) => ({
            id_categoria: r.id_categoria ?? r.id ?? 0,
            nombre_categoria: r.nombre_categoria ?? r.nombre ?? "",
          }))
          .filter((c) => c.id_categoria && c.nombre_categoria);
        setCats(normalized);
      } catch (err) {
        if (!alive) return;
        console.error(err);
        setCatsError("No se pudieron cargar las categorías.");
        setCats([]);
      } finally {
        if (alive) setCatsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 🔹 Cargar marcas activas
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setMarcasLoading(true);
        setMarcasError(null);
        const data = await getMarcasActivasAction();
        if (!alive) return;
        // Normalizamos a { id_marca, nombre_marca }
        const normalized: MarcaActiva[] = (Array.isArray(data) ? data : [])
          .map((r: any) => ({
            id_marca: r.id_marca ?? r.id ?? 0,
            nombre_marca: r.nombre_marca ?? r.nombre ?? "",
          }))
          .filter((m) => m.id_marca && m.nombre_marca);
        setMarcas(normalized);
      } catch (err) {
        if (!alive) return;
        console.error(err);
        setMarcasError("No se pudieron cargar las marcas.");
        setMarcas([]);
      } finally {
        if (alive) setMarcasLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Cargar datos si es edición
  useEffect(() => {
    if (isCreate) {
      setLoading(false);
      return;
    }
    const seed = id ? getProductoFromSeed(id) : null;
    if (seed) {
      const mapped: FormState = {
        id: (seed as any).id ?? (seed as any)._id ?? id,
        nombre: (seed as SeedProduct).title ?? "",
        qty: (seed as SeedProduct).inStock ?? 0,
        categoria: (seed as SeedProduct).category ?? "Seleccione...",
        subcategoria: (seed as any).subcategory ?? "Seleccione...",
        descripcion: (seed as any).description ?? "",
        precio: (seed as SeedProduct).price ?? 0,
        marca: (seed as SeedProduct).brand ?? "", // nombre de la marca si existe
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
    () => form.nuevasImagenes.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [form.nuevasImagenes]
  );

  useEffect(() => {
    return () => { previews.forEach((p) => URL.revokeObjectURL(p.url)); };
  }, [previews]);

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

  const removeExistingImage = (idx: number) =>
    setField("imagenes", form.imagenes.filter((_, i) => i !== idx));

  const removeNewImage = (file: File) =>
    setField("nuevasImagenes", form.nuevasImagenes.filter((f) => f !== file));

  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setField("nuevasImagenes", [...form.nuevasImagenes, ...arr]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) return alert("El nombre del producto es requerido.");
    if (form.categoria === "Seleccione...") return alert("Selecciona una categoría.");
    if (!form.slug) return alert("El slug no puede estar vacío.");

    const payload = {
      id: form.id,
      name: form.nombre.trim(),
      quantity: form.qty,
      category: form.categoria !== "Seleccione..." ? form.categoria : undefined,
      subcategory: form.subcategoria !== "Seleccione..." ? form.subcategoria : undefined,
      description: form.descripcion.trim(),
      price: form.precio,
      brand: form.marca.trim() || undefined, // nombre de marca seleccionado
      slug: form.slug,
      active: form.activo,
      images: [
        ...form.imagenes,
        ...form.nuevasImagenes.map((f) => `uploads/${f.name}`),
      ],
    };

    console.log("Guardar producto:", payload);
    alert(isCreate ? "Producto creado." : "Producto actualizado.");
    // router.push("/productos/inventario");
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

  // Para soportar edición cuando la marca del seed no está en la lista de activas,
  // agregamos una opción "actual" si no existe en `marcas`.
  const marcaNoListado =
    !!form.marca &&
    !marcasLoading &&
    !marcasError &&
    !marcas.some((m) => m.nombre_marca === form.marca);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Title
        title={isCreate ? "Nuevo producto" : `Editar producto #${form.id ?? id}`}
        subtitle="Explora, busca y gestiona tus productos"
        backHref="/productos"
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

          {/* Marca (selector con solo activas) */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Marca
            </label>
            <select
              value={form.marca}
              onChange={(e) => setField("marca", e.target.value)}
              disabled={marcasLoading || !!marcasError}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
            >
              {/* placeholder */}
              <option value="">
                {marcasLoading ? "Cargando marcas..." : "Seleccione..."}
              </option>

              {/* opciones de marcas activas */}
              {!marcasLoading && !marcasError && marcas.map((m) => (
                <option key={m.id_marca} value={m.nombre_marca}>
                  {m.nombre_marca}
                </option>
              ))}

              {/* opción para marca actual no listada (edición) */}
              {!marcasLoading && !marcasError && marcaNoListado && (
                <option value={form.marca}>{form.marca} (actual)</option>
              )}
            </select>
            {marcasError && (
              <p className="mt-1 text-xs text-red-600">{marcasError}</p>
            )}
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
              <button type="button" onClick={decQty} className="px-3 py-2 hover:bg-neutral-50" aria-label="Disminuir">
                <Minus className="w-4 h-4" />
              </button>
              <input
                value={form.qty}
                onChange={(e) => onQtyChange(e.target.value)}
                inputMode="numeric"
                className="w-full px-3 py-2 text-sm outline-none text-center"
              />
              <button type="button" onClick={incQty} className="px-3 py-2 hover:bg-neutral-50" aria-label="Aumentar">
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
          {/* Categoría (solo activas) */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Categoría
            </label>
            <select
              value={form.categoria}
              onChange={(e) => setField("categoria", e.target.value)}
              disabled={catsLoading || !!catsError}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
            >
              <option value="Seleccione..." disabled>
                {catsLoading ? "Cargando categorías..." : "Seleccione..."}
              </option>
              {!catsLoading && !catsError && cats.map((c) => (
                <option key={c.id_categoria} value={c.nombre_categoria}>
                  {c.nombre_categoria}
                </option>
              ))}
            </select>
            {catsError && (
              <p className="mt-1 text-xs text-red-600">{catsError}</p>
            )}
          </div>

          {/* (Opcional) Subcategoría */}
          {/* <div>...</div> */}
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

          {(form.imagenes?.length ?? 0) > 0 && (
            <>
              <div className="text-xs text-neutral-500">Existentes</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {form.imagenes.map((src, idx) => {
                  const url = src.startsWith("/") ? src : `/products/${src}`;
                  return (
                    <ImageUploaded
                      key={`old-${idx}-${src}`}
                      url={url}
                      fileName={src} // opcional; puedes quitarlo si no lo quieres en el alt
                      onRemove={() => removeExistingImage(idx)}
                    />
                  );
                })}
              </div>
            </>
          )}

          {previews.length > 0 && (
            <>
              <div className="text-xs text-neutral-500">Por subir</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {previews.map((p) => (
                  <ImageUploaded
                    key={p.url}
                    url={p.url}
                    fileName={p.file.name}
                    onRemove={() => removeNewImage(p.file)}
                  />
                ))}

              </div>
            </>
          )}
        </div>

        {/* Footer acciones */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="white"
            onClick={() => history.back()}
            className="px-4 py-2"            // mismo padding que usabas
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="success"                // negro (tu "default")
            icon={<ImagePlus className="w-4 h-4" />}
            className="px-4 py-2"
          >
            Guardar cambios
          </Button>
        </div>
      </form>
    </div>
  );
}
