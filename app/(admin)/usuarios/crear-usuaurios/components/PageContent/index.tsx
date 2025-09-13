"use client";

import { useEffect, useState } from "react";
import { Title, Button, Input } from "@/components"; // 👈 usamos tu Input y Button
import { UserPlus, Save, Eraser } from "lucide-react";
import { getPerfilesActivosAction } from "../../actions"; // ajusta la ruta si es necesario

type Perfil = {
  id_perfil: number;
  nombre_perfil: string;
  is_active: boolean;
};

export function PageContent() {
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

  // cargar perfiles activos
  useEffect(() => {
    (async () => {
      try {
        const data: Perfil[] = await getPerfilesActivosAction();
        setPerfiles(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("No se pudieron cargar los perfiles activos", e);
        setPerfiles([]);
      }
    })();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, boolean> = {};
    if (!nombre.trim()) newErrors.nombre = true;
    if (!apellido.trim()) newErrors.apellido = true;
    if (!telefono.trim()) newErrors.telefono = true;
    if (!correo.trim()) newErrors.correo = true;
    if (!password.trim()) newErrors.password = true;
    if (!password2.trim()) newErrors.password2 = true;
    if (password !== password2) newErrors.password2 = true;
    if (!perfilId) newErrors.perfilId = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Por favor llena todos los campos correctamente");
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

    console.log("Crear usuario payload:", payload);
    // TODO: Conecta con tu acción real (Supabase/API)
  };

  const handleClear = () => {
    setNombre("");
    setApellido("");
    setTelefono("");
    setCorreo("");
    setPassword("");
    setPassword2("");
    setPerfilId("");
    setErrors({});
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      {/* Encabezado */}
      <header className="flex items-end justify-between w-full gap-4">
        <Title
          title="Crear Usuarios"
          subtitle="Administra los usuarios de la plataforma"
          showBackButton
          icon={<UserPlus />}
          backHref="/usuarios"
        />
      </header>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Input
            label="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
            isRequired
            hasError={errors.nombre}
          />

          <Input
            label="Apellido"
            value={apellido}
            onChange={(e) => setApellido(e.target.value)}
            placeholder="Tu apellido"
            isRequired
            hasError={errors.apellido}
          />

          <Input
            label="Número de Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+504 9999-9999"
            type="tel"
            isRequired
            hasError={errors.telefono}
          />

          <Input
            label="Correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="ejemplo@correo.com"
            type="email"
            isRequired
            hasError={errors.correo}
          />

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

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Button
            type="button"
            variant="white"
            onClick={handleClear}
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] justify-center"
            icon={<Eraser className="w-5 h-5" />}
          >
            Limpiar
          </Button>

          <Button
            type="submit"
            variant="success"
            className="w-full sm:w-auto px-6 py-3 min-h-[48px] justify-center"
            icon={<Save className="w-5 h-5" />}
          >
            Crear
          </Button>
        </div>
      </form>
    </div>
  );
}
