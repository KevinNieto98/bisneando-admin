"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { Title, Switch } from "@/components";
import { Upload, Save,  ImageIcon } from "lucide-react";

type Portada = {
  file: File | null;      // archivo nuevo que elija el usuario
  direccion: string;
  disponible: boolean;
  portadaUrl?: string;    // url existente de la portada guardada en DB
};

export default function EditarPortadaPage() {
  const router = useRouter();
  const params = useParams(); // /mantenimiento/portadas/[id]
  const id = params?.id;

  const [state, setState] = React.useState<Portada>({
    file: null,
    direccion: "",
    disponible: true,
    portadaUrl: undefined,
  });
  const [isDragging, setIsDragging] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Simula fetch inicial (reemplaza con tu API)
  React.useEffect(() => {
    async function load() {
      // fetch(`/api/portadas/${id}`)
      // const data = await res.json();
      const data = {
        direccion: "/productos/demo",
        disponible: true,
        portadaUrl: `/portadas/${id}.png`, // suponiendo que ya existe en public
      };
      setState((s) => ({ ...s, ...data }));
    }
    load();
  }, [id]);

  const blobUrl = React.useMemo(() => {
    if (!state.file) return null;
    return URL.createObjectURL(state.file);
  }, [state.file]);

  React.useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // Validaciones
  const direccionValida = state.direccion.trim().length >= 2;
  const puedeGuardar = direccionValida && !saving;

  // Drag & drop
  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setState((s) => ({ ...s, file }));
  };

  const handleChoose: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    if (file) setState((s) => ({ ...s, file }));
  };

  const onSubmit = async () => {
    setErrorMsg(null);
    if (!puedeGuardar) return;

    try {
      setSaving(true);
      const form = new FormData();
      if (state.file) form.append("file", state.file);
      form.append("direccion", state.direccion);
      form.append("disponible", String(state.disponible));

      const res = await fetch(`/api/portadas/${id}`, {
        method: "PUT",
        body: form,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "No se pudo actualizar la portada");
      }

      router.push("/mantenimiento/portadas");
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-4">
      <Title
        showBackButton
        backHref="/mantenimiento/portadas"
        title="Editar portada"
        icon={<ImageIcon className="w-5 h-5" />}
        subtitle={`Modifica la portada #${id}`}
      />

      <div className="space-y-6 mt-2">
        {/* Dropzone + Preview */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Portada (PNG/JPG/WEBP)
          </label>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={[
              "relative rounded-2xl border-2 border-dashed p-4 transition",
              isDragging ? "border-neutral-600 bg-neutral-50" : "border-neutral-300",
            ].join(" ")}
          >
            <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100">
              <div className="pt-[56.25%]" />
              <div className="absolute inset-0 flex items-center justify-center">
                {!state.file ? (
                  <div className="flex flex-col items-center justify-center text-center p-6">
                    <Upload className="h-6 w-6 text-neutral-500 mb-2" />
                    <p className="text-sm text-neutral-700">
                      Arrastra tu imagen aquí o
                      <label className="mx-1 underline cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleChoose}
                          className="hidden"
                        />
                        elige un archivo
                      </label>
                    </p>
                  </div>
                ) : (
                  <img
                    src={blobUrl!}
                    alt="Nueva vista previa"
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Portada actual */}
          {!state.file && state.portadaUrl && (
            <div className="mt-3">
              <p className="text-xs font-medium text-neutral-600 mb-1">Portada actual:</p>
              <img
                src={state.portadaUrl}
                alt="Portada actual"
                className="w-full rounded-lg border object-cover max-h-72"
              />
            </div>
          )}
        </div>

        {/* Dirección */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-neutral-700">Dirección</label>
          <input
            value={state.direccion}
            onChange={(e) => setState((s) => ({ ...s, direccion: e.target.value }))}
            placeholder="/productos/iphone-13-pro"
            className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none border-neutral-300 focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-400"
          />
          {!direccionValida && (
            <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
          )}
        </div>

        {/* Disponible */}
        <div className="flex items-center gap-3">
          <Switch
            checked={state.disponible}
            onChange={(next) => setState((s) => ({ ...s, disponible: next }))}
            ariaLabel="Cambiar disponibilidad"
          />
          <span className="text-sm font-medium text-neutral-700">
            {state.disponible ? "Disponible" : "No disponible"}
          </span>
        </div>

        {/* Errores */}
        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Botones */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            onClick={() => router.push("/mantenimiento/portadas")}
            className="inline-flex items-center rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={!puedeGuardar}
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
