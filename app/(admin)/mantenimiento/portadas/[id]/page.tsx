"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Title,
  Switch,
  Button,
  ConfirmDialog,
  Input,
  TextArea,
  ImageDropzone,
  Alert,
} from "@/components";
import { useUIStore } from "@/store";
import { Save, ImageIcon, AlertCircle } from "lucide-react";
import { postPortadaAction, updatePortadaAction } from "../actions";

type Portada = {
  file: File | null;
  direccion: string;     // -> link en DB
  disponible: boolean;   // -> is_active en DB
  portadaUrl?: string;
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

  // Carga inicial en edición (mock; reemplázalo con fetch real si gustas)
  React.useEffect(() => {
    async function load() {
      if (isNew) return;
      const data = {
        direccion: "/productos/demo",
        disponible: true,
        portadaUrl: `/portadas/${id}.png`,
        descripcion: "Portada de ejemplo (solo UI)",
      };
      setState((s) => ({ ...s, ...data }));
    }
    load();
  }, [id, isNew]);

  // Validaciones
  const direccionValida = state.direccion.trim().length >= 2;
  const imagenValida = isNew ? Boolean(state.file) : true;
  const puedeGuardar = direccionValida && imagenValida && !saving;

  // Guardar usando acciones de Supabase (parámetros POSICIONALES)
  const onSubmit = async () => {
    if (!puedeGuardar) return;
    try {
      setSaving(true);

      if (isNew) {
        await postPortadaAction(
          state.file!,          // File (requerido en /new)
          state.direccion,      // link
          state.disponible,     // is_active
          "ADMIN"               // usuario_crea (opcional)
        );
        mostrarAlerta("Éxito", "La portada fue creada correctamente", "success");
      } else {
        await updatePortadaAction(
          Number(id),           // id_portada
          state.file,           // File | null | undefined (opcional en edición)
          state.direccion,      // link
          state.disponible,     // is_active
          "ADMIN"               // usuario_modificacion (opcional)
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

  // Confirmación antes de guardar
  const handleConfirmSave = () => {
    if (!puedeGuardar) return;
    openConfirm({
      titulo: "Confirmar guardado",
      mensaje: isNew
        ? "¿Deseas crear esta nueva portada?"
        : `¿Deseas guardar los cambios de la portada #${id}?`,
      confirmText: saving ? "Guardando..." : "Guardar",
      rejectText: "Cancelar",
      preventClose: true,
      onConfirm: onSubmit,
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-4">
      {/* Modal de confirmación */}
      <ConfirmDialog />
      {/* Alerta global */}
      <Alert />

      <Title
        showBackButton
        backHref="/mantenimiento/portadas"
        title={isNew ? "Nueva portada" : "Editar portada"}
        icon={<ImageIcon className="w-5 h-5" />}
        subtitle={isNew ? "Crea una nueva portada" : `Modifica la portada #${id}`}
      />

      <div className="space-y-6 mt-2">
        {/* Advertencia cuando no hay imagen en /new */}
        {isNew && !state.file && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-semibold">Agrega una imagen para guardar cambios.</p>
              <p>Selecciona o arrastra una imagen al área de carga.</p>
            </div>
          </div>
        )}

        {/* Dropzone */}
        <ImageDropzone
          file={state.file}
          onFileSelected={(file) => setState((s) => ({ ...s, file }))}
          accept="image/*"
          ratio={16 / 9}
          disabled={saving}
        />

        {/* Portada actual (solo edición y si no hay nueva imagen) */}
        {!isNew && !state.file && state.portadaUrl && (
          <div className="mt-3">
            <p className="text-xs font-medium text-neutral-600 mb-1">Portada actual:</p>
            <img
              src={state.portadaUrl}
              alt="Portada actual"
              className="w-full rounded-lg border object-cover max-h-72"
            />
          </div>
        )}

        {/* Dirección */}
        <Input
          label="Dirección"
          isRequired
          value={state.direccion}
          onChange={(e) => setState((s) => ({ ...s, direccion: e.target.value }))}
          placeholder="/productos/iphone-13-pro"
          autoFocus
          disabled={saving}
        />
        {!direccionValida && (
          <p className="text-xs text-red-600">Debe tener al menos 2 caracteres.</p>
        )}

        {/* Descripción (solo UI) */}
        <TextArea
          label="Descripción (opcional)"
          value={state.descripcion}
          onChange={(e) => setState((s) => ({ ...s, descripcion: e.target.value }))}
          placeholder="Breve descripción para identificar la portada..."
          rows={4}
          disabled={saving}
        />

        {/* Disponible */}
        <div className="flex items-center gap-3">
          <Switch
            checked={state.disponible}
            onChange={(next) => setState((s) => ({ ...s, disponible: next }))}
            ariaLabel="Cambiar disponibilidad"
            disabled={saving}
          />
          <span className="text-sm font-medium text-neutral-700">
            {state.disponible ? "Disponible" : "No disponible"}
          </span>
        </div>

        {/* Botones */}
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
