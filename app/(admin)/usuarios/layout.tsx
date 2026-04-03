import { UsuariosSidebar } from "./components/UsuariosSidebar";

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <UsuariosSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
