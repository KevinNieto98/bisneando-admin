"use client";

import React, { use, useEffect, useMemo, useRef, useState } from "react";
import { Boxes, ImagePlus, Upload, Minus, Plus } from "lucide-react";
import { Title, Switch, Button, ImageUploaded, Input, Alert } from "@/components";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useUIStore } from "@/store";
import { useRouter } from "next/navigation";


import { initialData } from "@/seed/seed";
import {
  getCategoriasActivasAction,
  getMarcasActivasAction,
  insertImagenesProductosAction,
  postProductosAction,
} from "../../actions";
import { supabase } from "@/utils/supabase/client";

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
  categoria: string;
  subcategoria: string;
  descripcion: string;
  precio: number;
  marca: string;
  slug: string;
  activo: boolean;
  imagenes: string[];
  nuevasImagenes: File[];
};

type CategoriaActiva = {
  id_categoria: number;
  nombre_categoria: string;
};

type MarcaActiva = {
  id_marca: number;
  nombre_marca: string;
};

export function PageContent({ params }: Props) {
  const router = useRouter();
  const { id } = use(params);
  const isCreate = !id || id === "new" || id === "nuevo";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [touchedSlug, setTouchedSlug] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI store
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);

  const [cats, setCats] = useState<CategoriaActiva[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const [catsError, setCatsError] = useState<string | null>(null);

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
    marca: "",
    slug: "",
    activo: true,
    imagenes: [],
    nuevasImagenes: [],
  });

  const formDisabled = saving || loading;

  // ------- efectos: cargar cats y marcas -------
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setCatsLoading(true);
        setCatsError(null);
        const data = await getCategoriasActivasAction();
        if (!alive) return;
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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setMarcasLoading(true);
        setMarcasError(null);
        const data = await getMarcasActivasAction();
        if (!alive) return;
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

  // ------- edición desde seed -------
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

  // ------- auto-slug -------
  useEffect(() => {
    if (!touchedSlug) setForm((prev) => ({ ...prev, slug: toSlug(prev.nombre) }));
  }, [form.nombre, touchedSlug]);

  const previews = useMemo(
    () => form.nuevasImagenes.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [form.nuevasImagenes]
  );
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  // ------- helpers -------
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
    if (formDisabled) return;
    setField("imagenes", form.imagenes.filter((_, i) => i !== idx));
  };
  const removeNewImage = (file: File) => {
    if (formDisabled) return;
    setField("nuevasImagenes", form.nuevasImagenes.filter((f) => f !== file));
  };
  const onFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0 || formDisabled) return;
    const arr = Array.from(files);
    setField("nuevasImagenes", [...form.nuevasImagenes, ...arr]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ------- submit con confirm -------
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim()) return mostrarAlerta("Validación", "El nombre del producto es requerido.", "warning");
    if (form.categoria === "Seleccione...") return mostrarAlerta("Validación", "Selecciona una categoría.", "warning");
    if (!form.slug) return mostrarAlerta("Validación", "El slug no puede estar vacío.", "warning");

    openConfirm({
      titulo: isCreate ? "Confirmar creación" : "Confirmar actualización",
      mensaje: isCreate
        ? `¿Deseas crear el producto “${form.nombre.trim()}”?`
        : `¿Deseas actualizar el producto “${form.nombre.trim()}”?`,
      confirmText: isCreate ? "Crear" : "Actualizar",
      rejectText: "Cancelar",
      preventClose: true,
      onConfirm: async () => { await doSave(); },
    });
  };

  // ------- SAVE orchestration -------
  const doSave = async () => {
    // Resolver id_categoria
    const cat = cats.find((c) => c.nombre_categoria === form.categoria);
    const idCategoria = cat?.id_categoria;
    if (!idCategoria) {
      return mostrarAlerta("Error", "No se pudo resolver la categoría seleccionada.", "danger");
    }

    try {
      setSaving(true);

      // 1) Crear producto
      const created = await postProductosAction(
        form.nombre.trim(),
        form.activo,
        form.qty,
        form.slug,
        form.precio,
        idCategoria,
        form.descripcion.trim()
      );

      const idProducto = created.id_producto;

      // 2) Subir imágenes nuevas al bucket y recolectar URLs públicas
      const bucket = "imagenes_productos";
      const imagenRows: {
        id_producto: number;
        url_Imagen: string;
        is_principal: boolean;
        orden: number;
      }[] = [];

      for (let i = 0; i < form.nuevasImagenes.length; i++) {
        const file = form.nuevasImagenes[i];
        const cleanName = file.name.replace(/\s+/g, "-").toLowerCase();
        const path = `${idProducto}/${Date.now()}-${i + 1}-${cleanName}`;

        const { error: uploadErr } = await supabase
          .storage
          .from(bucket)
          .upload(path, file, { cacheControl: "3600", upsert: true });

        if (uploadErr) {
          throw new Error(`Error subiendo imagen "${file.name}": ${uploadErr.message}`);
        }

        // Obtener URL pública
        const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
        const publicUrl = pub.publicUrl;

        imagenRows.push({
          id_producto: idProducto,
          url_Imagen: publicUrl,
          is_principal: i === 0, // la primera es principal
          orden: i + 1,
        });
      }

      // 3) Insertar filas en tbl_imagenes_productos
      if (imagenRows.length > 0) {
        await insertImagenesProductosAction(imagenRows);
      }

      mostrarAlerta("¡Guardado!", "El producto se creó correctamente.", "success");
   //   router.push(`/productos/inventario`);
    } catch (err: any) {
      console.error(err);
      mostrarAlerta("Error", err?.message ?? "No se pudo guardar el producto.", "danger");
    } finally {
      setSaving(false);
    }
  };

  // ------- UI -------
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

  const marcaNoListado =
    !!form.marca &&
    !marcasLoading &&
    !marcasError &&
    !marcas.some((m) => m.nombre_marca === form.marca);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <Alert />

      <Title
        title={isCreate ? "Nuevo producto" : `Editar producto #${form.id ?? id}`}
        subtitle="Explora, busca y gestiona tus productos"
        backHref="/productos"
        showBackButton
        icon={<Boxes className="h-6 w-6 text-neutral-700" />}
      />

      <form
        onSubmit={onSubmit}
        className={`mt-4 grid grid-cols-1 gap-5 ${formDisabled ? "pointer-events-none opacity-60" : ""}`}
        aria-busy={formDisabled}
      >
        {/* Básicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre del producto"
            isRequired
            value={form.nombre}
            placeholder="Ej. Laptop Pro 14”"
            onChange={(e) => setField("nombre", e.target.value)}
            disabled={formDisabled}
          />

          <Input
            label={!touchedSlug && form.nombre ? `Slug (autogenerado de “${form.nombre}”)` : "Slug"}
            isRequired
            value={form.slug}
            placeholder="ej. laptop-pro-14"
            onChange={(e) => {
              setTouchedSlug(true);
              setField("slug", toSlug(e.target.value));
            }}
            disabled={formDisabled}
          />

          {/* Marca */}
          <div className={`${formDisabled ? "pointer-events-none opacity-60" : ""}`}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Marca</label>
            <select
              value={form.marca}
              onChange={(e) => setField("marca", e.target.value)}
              disabled={marcasLoading || !!marcasError || formDisabled}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
            >
              <option value="">{marcasLoading ? "Cargando marcas..." : "Seleccione..."}</option>
              {!marcasLoading && !marcasError && marcas.map((m) => (
                <option key={m.id_marca} value={m.nombre_marca}>
                  {m.nombre_marca}
                </option>
              ))}
              {!marcasLoading && !marcasError && marcaNoListado && (
                <option value={form.marca}>{form.marca} (actual)</option>
              )}
            </select>
            {marcasError && <p className="mt-1 text-xs text-red-600">{marcasError}</p>}
          </div>

          <Input
            label="Precio (HNL)"
            inputMode="decimal"
            value={String(form.precio)}
            placeholder="0.00"
            onChange={(e) => onPrecioChange(e.target.value)}
            disabled={formDisabled}
          />

          <div className={`${formDisabled ? "pointer-events-none opacity-60" : ""}`}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Cantidad (stock)</label>
            <div className="flex rounded-xl border border-neutral-300 bg-white overflow-hidden">
              <button type="button" onClick={decQty} className="px-3 py-2 hover:bg-neutral-50" aria-label="Disminuir" disabled={formDisabled}>
                <Minus className="w-4 h-4" />
              </button>
              <Input
                className="border-0 rounded-none text-center"
                value={String(form.qty)}
                inputMode="numeric"
                onChange={(e) => onQtyChange(e.target.value)}
                aria-label="Cantidad"
                disabled={formDisabled}
              />
              <button type="button" onClick={incQty} className="px-3 py-2 hover:bg-neutral-50" aria-label="Aumentar" disabled={formDisabled}>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 md:mt-0">
            <Switch
              checked={form.activo}
              onChange={(next) => !formDisabled && setField("activo", next)}
              ariaLabel="Cambiar estado del producto"
              disabled={formDisabled}
            />
            <span className="text-sm font-medium text-neutral-700">
              {form.activo ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>

        {/* Categoría */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${formDisabled ? "pointer-events-none opacity-60" : ""}`}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Categoría</label>
            <select
              value={form.categoria}
              onChange={(e) => setField("categoria", e.target.value)}
              disabled={catsLoading || !!catsError || formDisabled}
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
            {catsError && <p className="mt-1 text-xs text-red-600">{catsError}</p>}
          </div>
        </div>

        {/* Descripción */}
        <div className={`${formDisabled ? "pointer-events-none opacity-60" : ""}`}>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Descripción</label>
          <textarea
            rows={5}
            value={form.descripcion}
            onChange={(e) => setField("descripcion", e.target.value)}
            placeholder="Describe el producto…"
            disabled={formDisabled}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-60"
          />
        </div>

        {/* Imágenes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-neutral-800">Imágenes del producto</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => !formDisabled && fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50 disabled:opacity-60"
                disabled={formDisabled}
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
                disabled={formDisabled}
              />
            </div>
          </div>

          {(form.imagenes?.length ?? 0) > 0 && (
            <>
              <div className="text-xs text-neutral-500">Existentes</div>
              <div className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 ${formDisabled ? "pointer-events-none opacity-60" : ""}`}>
                {form.imagenes.map((src, idx) => {
                  const url = src.startsWith("/") ? src : `/products/${src}`;
                  return (
                    <ImageUploaded
                      key={`old-${idx}-${src}`}
                      url={url}
                      fileName={src}
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
              <div className={`grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 ${formDisabled ? "pointer-events-none opacity-60" : ""}`}>
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

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="white"
            onClick={() => !formDisabled && history.back()}
            className="px-4 py-2"
            disabled={formDisabled}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="success"
            icon={<ImagePlus className="w-4 h-4" />}
            className="px-4 py-2"
            disabled={formDisabled}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>

      <ConfirmDialog />
    </div>
  );
}
