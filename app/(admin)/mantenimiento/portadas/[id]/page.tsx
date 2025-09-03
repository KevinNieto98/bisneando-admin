// app/mantenimiento/portadas/[id]/page.tsx
"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Title, Switch, Button, ConfirmDialog, Input, TextArea, ImageDropzone, Alert,
} from "@/components";
import { useUIStore } from "@/store";
import { Save, ImageIcon, AlertCircle } from "lucide-react";
import { postPortadaAction, updatePortadaAction } from "../actions";

type Portada = {
  file: File | null;
  direccion: string;     // link en DB
  disponible: boolean;   // is_active en DB
  portadaUrl?: string;   // data URL generada por el API
  descripcion?: string;  // solo UI
};

export default function EditarPortadaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string | undefined;
  const isNew = !id || id === "new";

  const openConfirm = useUIStore((s) => s.openConfirm);
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);

  const [state, setState] = React.useState<Portada>({
    file: null,
    direccion: "",
    disponible: true,
    portadaUrl: undefined,
    descripcion: "",
  });
  const [saving, setSaving] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Carga inicial real desde la DB
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (isNew) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/portadas/${id}`, { cache: "no-store" });
        const data = await res.json();
        console.log("Portada cargada:", data);
        
        if (!res.ok) throw new Error(data?.error || "No se pudo obtener la portada");

        if (!cancelled) {
          setState((s) => ({
            ...s,
            direccion: data.direccion ?? "",
            disponible: Boolean(data.disponible),
            portadaUrl: data.portadaUrl ?? undefined, // <- data:image/... listo para <img />
            // descripción sigue siendo solo UI
          }));
        }
      } catch (err: any) {
        if (!cancelled) {
          mostrarAlerta("Error", err?.message || "No se pudo cargar la portada", "danger");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, isNew, mostrarAlerta]);

  // Validaciones
  const direccionValida = state.direccion.trim().length >= 2;
  const imagenValida = isNew ? Boolean(state.file) : true;
  const puedeGuardar = direccionValida && imagenValida && !saving;

  // Guardar usando acciones
  const onSubmit = async () => {
    if (!puedeGuardar) return;
    try {
      setSaving(true);

      if (isNew) {
        await postPortadaAction(
          state.file!,        // File requerido en /new
          state.direccion,    // link
          state.disponible,   // is_active
          "ADMIN"             // usuario_crea (opcional)
        );
        mostrarAlerta("Éxito", "La portada fue creada correctamente", "success");
      } else {
        await updatePortadaAction(
          Number(id),
          state.file,         // File | null (opcional en edición)
          state.direccion,
          state.disponible,
          "ADMIN"             // usuario_modificacion (opcional)
        );
        mostrarAlerta("Éxito", "La portada fue actualizada correctamente", "success");
      }
      router.push("/mantenimiento/portadas");
    } catch (err: any) {
      mostrarAlerta("Error", err?.message || "Ocurrió un error al guardar", "danger");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = () => {
    if (!puedeGuardar) return;
    openConfirm({
      titulo: "Confirmar guardado",
      mensaje: isNew ? "¿Deseas crear esta nueva portada?" : `¿Deseas guardar los cambios de la portada #${id}?`,
      confirmText: saving ? "Guardando..." : "Guardar",
      rejectText: "Cancelar",
      preventClose: true,
      onConfirm: onSubmit,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-4">
      <ConfirmDialog />
      <Alert />

      <Title
        showBackButton
        backHref="/mantenimiento/portadas"
        title={isNew ? "Nueva portada" : "Editar portada"}
        icon={<ImageIcon className="w-5 h-5" />}
        subtitle={isNew ? "Crea una nueva portada" : `Modifica la portada #${id}`}
      />

      <div className="space-y-6 mt-2">
        {isNew && !state.file && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-semibold">Agrega una imagen para guardar cambios.</p>
              <p>Selecciona o arrastra una imagen al área de carga.</p>
            </div>
          </div>
        )}

        <ImageDropzone
          file={state.file}
          onFileSelected={(file) => setState((s) => ({ ...s, file }))}
          accept="image/*"
          ratio={16 / 9}
          disabled={saving || loading}
        />

        {/* Portada actual (solo edición y si no hay nueva imagen) */}
{!isNew && !state.file && (
  <div className="mt-3">
    <p className="text-xs font-medium text-neutral-600 mb-1">Portada actual:</p>
    <img
      src={`/api/portadas/${id}/imagen`}   // <- SERVIDA DESDE EL API
      alt="Portada actual"
      className="w-full rounded-lg border object-cover max-h-72"
      onError={() => console.warn("No se pudo cargar la imagen")}
    />
  </div>
)}

        <Input
          label="Dirección"
          isRequired
          value={state.direccion}
          onChange={(e) => setState((s) => ({ ...s, direccion: e.target.value }))}
          placeholder="/productos/iphone-13-pro"
          autoFocus
          disabled={saving || loading}
        />
        {!direccionValida && <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>}

        <TextArea
          label="Descripción (opcional)"
          value={state.descripcion}
          onChange={(e) => setState((s) => ({ ...s, descripcion: e.target.value }))}
          placeholder="Breve descripción para identificar la portada..."
          rows={4}
          disabled={saving || loading}
        />

        <div className="flex items-center gap-3">
          <Switch
            checked={state.disponible}
            onChange={(next) => setState((s) => ({ ...s, disponible: next }))}
            ariaLabel="Cambiar disponibilidad"
            disabled={saving || loading}
          />
          <span className="text-sm font-medium text-neutral-700">
            {state.disponible ? "Disponible" : "No disponible"}
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="white"
            onClick={() => router.push("/mantenimiento/portadas")}
            disabled={saving}
          >
            Cancelar
          </Button>

            <Button
              onClick={handleConfirmSave}
              disabled={!puedeGuardar}
              icon={<Save className="w-4 h-4" />}
              title={!imagenValida ? "Agrega una imagen para continuar" : undefined}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
        </div>
      </div>
    </div>
  );
}
