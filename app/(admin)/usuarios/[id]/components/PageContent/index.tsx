"use client";

import { useEffect, useState, startTransition } from "react";
import { Title, Button, Input, Alert, ConfirmDialog } from "@/components";
import { UserPlus, Save, Eraser, Mail } from "lucide-react";
import {  sendResetLinkAction, signupAction } from "@/app/auth/actions";
import { useUIStore } from "@/store";
import { getPerfilesActivosAction, getUsuarioByIdAction } from "../../../actions";

// Tipos
export type Perfil = {
  id_perfil: number;
  nombre_perfil: string;
  is_active: boolean;
};

export type PageContentProps = {
  mode?: "create" | "edit";
  userId?: string;
};

export function PageContent({
  mode = "create",
  userId,
}: PageContentProps) {
  const isEdit = mode === "edit";

  // estado del formulario
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // validación
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // perfiles
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [perfilId, setPerfilId] = useState<string>("");

  // UX
  const [submitting, setSubmitting] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false); // 👈 NUEVO

  // ALERT & CONFIRM (tu store)
  const mostrarAlerta = useUIStore((s) => s.mostrarAlerta);
  const openConfirm = useUIStore((s) => s.openConfirm);
  const closeConfirm = useUIStore((s) => s.closeConfirm);

  // cargar perfiles activos
  useEffect(() => {
    (async () => {
      try {
        const data: Perfil[] = await getPerfilesActivosAction();
        setPerfiles(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("No se pudieron cargar los perfiles activos", e);
        setPerfiles([]);
        mostrarAlerta("Error", "No se pudieron cargar los perfiles activos.", "danger");
      }
    })();
  }, [mostrarAlerta]);

  // 👇 Precargar datos del usuario en modo edición
  useEffect(() => {
    if (!isEdit || !userId) return;

    setLoadingUser(true);
    (async () => {
      try {
        const user = await getUsuarioByIdAction(userId);
        if (!user) {
          mostrarAlerta("No encontrado", "No se encontró el usuario indicado.", "warning");
          return;
        }
        // Mapear al formulario
        setNombre(user.nombre ?? "");
        setApellido(user.apellido ?? "");
        setTelefono(user.phone ?? "");
        setCorreo(user.email ?? "");
        setPerfilId(String(user.id_perfil ?? ""));
      } catch (err: any) {
        console.error(err);
        mostrarAlerta("Error", err?.message ?? "No se pudo cargar el usuario.", "danger");
      } finally {
        setLoadingUser(false);
      }
    })();
  }, [isEdit, userId, mostrarAlerta]);

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    const emailRegex = /\S+@\S+\.\S+/;

    if (!nombre.trim()) newErrors.nombre = true;
    if (!apellido.trim()) newErrors.apellido = true;
    if (!telefono.trim()) newErrors.telefono = true;
    if (!correo.trim() || !emailRegex.test(correo)) newErrors.correo = true;

    // 👇 Solo validamos contraseñas en modo CREAR
    if (!isEdit) {
      if (!password.trim() || password.length < 8) newErrors.password = true;
      if (!password2.trim() || password !== password2) newErrors.password2 = true;
    }

    if (!perfilId) newErrors.perfilId = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hardClear = () => {
    setNombre("");
    setApellido("");
    setTelefono("");
    setCorreo("");
    setPassword("");
    setPassword2("");
    setPerfilId("");
    setErrors({});
  };

  const handleClear = () => {
    hardClear();
    mostrarAlerta("Formulario limpio", "Se limpiaron todos los campos.", "info");
  };

  // Crear o Editar
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      mostrarAlerta("Campos incompletos", "Por favor completa los campos correctamente.", "warning");
      return;
    }

if (isEdit) {
  openConfirm({
    titulo: "Confirmar actualización",
    mensaje: `¿Deseas guardar los cambios para "${nombre} ${apellido}"?`,
    confirmText: "Sí, guardar",
    rejectText: "Cancelar",
    preventClose: false,
    onConfirm: async () => {
      setSubmitting(true);

      await new Promise<void>((resolve) =>
        startTransition(async () => {
          try {
            // Construimos el FormData que espera la server action
            const fd = new FormData();
            fd.append("email", correo);
            fd.append("nombre", nombre);
            fd.append("apellido", apellido);
            fd.append("phone", telefono);
            fd.append("id_perfil", String(perfilId)); // la action lo castea a número si aplica

            // Llamada a la server action: esta hace update en auth.users y en tbl_usuarios
      //      await updateAccount(fd);

            // Si la action hace redirect, no se ejecutará lo de abajo (navegará).
            // Si no redirige, mostramos feedback local:
            mostrarAlerta("Éxito", "Usuario actualizado correctamente.", "success");
          } catch (err: any) {
            console.error(err);
            // Si la action hace redirect con error, Next corta el flujo; si no, mostramos:
            mostrarAlerta("Error", err?.message ?? "No se pudo actualizar el usuario.", "danger");
          } finally {
            setSubmitting(false);
            closeConfirm();
            resolve();
          }
        })
      );
    },
  });

  return;
}

    const payload = {
      nombre,
      apellido,
      telefono,
      correo,
      password,
      id_perfil: Number(perfilId),
    };

    openConfirm({
      titulo: "Confirmar creación",
      mensaje: `¿Deseas crear el usuario "${nombre} ${apellido}" con el perfil seleccionado?`,
      confirmText: "Sí, crear",
      rejectText: "Cancelar",
      preventClose: false,
      onConfirm: async () => {
        setSubmitting(true);

        await new Promise<void>((resolve) =>
          startTransition(async () => {
            try {
              const res = await signupAction(payload);

              if (!res?.ok) {
                mostrarAlerta(
                  "No se pudo crear",
                  res?.message ?? "No se pudo crear el usuario.",
                  "danger"
                );
                setSubmitting(false);
                return resolve();
              }

              if ((res as any).status === "pending_confirmation") {
                mostrarAlerta(
                  "Registro creado",
                  "Revisa tu correo para confirmar la cuenta antes de iniciar sesión.",
                  "info"
                );
              } else {
                mostrarAlerta("Éxito", "Usuario creado correctamente.", "success");
              }

              hardClear();
            } catch (err: any) {
              console.error(err);
              mostrarAlerta("Error inesperado", err?.message ?? "Ocurrió un error inesperado.", "danger");
            } finally {
              setSubmitting(false);
              closeConfirm();
              resolve();
            }
          })
        );
      },
    });
  };

  // Restablecer contraseña (solo en edición)
  const handleResetPassword = async () => {
    if (!isEdit || !userId) return;

    setSubmitting(true);
    try {
      const res = await sendResetLinkAction(userId);
      if (res.ok) {
        mostrarAlerta(
          "Enlace enviado",
          `Si el correo del usuario existe, se envió un enlace para restablecer la contraseña.`,
          "success"
        );
      } else {
        mostrarAlerta("Error", (res as any).message ?? "No se pudo enviar el enlace.", "danger");
      }
    } catch (e: any) {
      console.error(e);
      mostrarAlerta("Error", e?.message ?? "No se pudo enviar el enlace.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      {/* Encabezado */}
      <header className="flex items-end justify-between w-full gap-4">
        <Title
          title={isEdit ? "Editar Usuario" : "Crear Usuarios"}
          subtitle={isEdit ? "Actualiza los datos del usuario" : "Registra un nuevo usuario"}
          showBackButton
          icon={<UserPlus />}
          backHref="/usuarios"
        />
      </header>

      {/* UI global */}
      <Alert />
      <ConfirmDialog />

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 opacity-100">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            isRequired
            hasError={errors.nombre}
            disabled={loadingUser && isEdit}
          />

          <Input
            label="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Tu apellido"
            isRequired
            hasError={errors.apellido}
            disabled={loadingUser && isEdit}
          />

          <Input
            label="Número de Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+504 9999-9999"
            type="tel"
            isRequired
            hasError={errors.telefono}
            disabled={loadingUser && isEdit}
          />

          <Input
            label="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="ejemplo@correo.com"
            type="email"
            isRequired
            hasError={errors.correo}
            disabled={loadingUser && isEdit}
          />

          {/* Contraseñas SOLO en crear */}
          {!isEdit && (
            <>
              <Input
                label="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                isRequired
                hasError={errors.password}
              />

              <Input
                label="Confirmar Contraseña"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="••••••••"
                type="password"
                isRequired
                hasError={errors.password2}
              />
            </>
          )}

          {/* Perfil */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Perfil <span className="text-red-600">*</span>
            </label>
            <select
              value={perfilId}
              onChange={(e) => setPerfilId(e.target.value)}
              className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 ${
                errors.perfilId ? "border-red-500 focus:ring-red-300" : "border-neutral-300"
              }`}
              required
              disabled={loadingUser && isEdit}
            >
              <option value="">Selecciona un perfil…</option>
              {perfiles.map((p) => (
                <option key={p.id_perfil} value={String(p.id_perfil)}>
                  {p.nombre_perfil}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón de restablecer SOLO en edición */}
        {isEdit && (
          <Button
            type="button"
            variant="warning"
            icon={<Mail className="w-5 h-5" />}
            onClick={handleResetPassword}
            className="w-full sm:w-auto px-6 py-2 min-h-[48px] justify-center"
            disabled={submitting || !userId || loadingUser}
          >
            Restablecer contraseña
          </Button>
        )}

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="white"
            onClick={handleClear}
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] justify-center"
            icon={<Eraser className="w-5 h-5" />}
            disabled={submitting}
          >
            Limpiar
          </Button>

          <Button
            type="submit"
            variant="success"
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] justify-center"
            icon={<Save className="w-5 h-5" />}
            disabled={submitting || (isEdit && loadingUser)}
          >
            {isEdit ? (submitting ? "Guardando..." : "Guardar") : (submitting ? "Creando..." : "Crear")}
          </Button>
        </div>
      </form>
    </div>
  );
}
