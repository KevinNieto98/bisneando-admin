'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  IoCloseOutline,
  IoLogOutOutline,
  IoPersonOutline,
  IoLocationOutline,
  IoTicketOutline, IoPersonCircleOutline, IoDocumentTextOutline,
} from 'react-icons/io5';

import { useUIStore } from '@/store';

type User = {
  name: string | null;
  avatarUrl?: string | null;
};

export const Sidebar = () => {
  const isSideMenuOpen = useUIStore((state) => state.isSideMenuOpen);
  const closeMenu = useUIStore((state) => state.closeSideMenu);

  const [user, setUser] = useState<User>({ name: null, avatarUrl: null });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const name = localStorage.getItem('userName'); // ej: "ChatGPT"
    const avatarUrl = localStorage.getItem('avatarUrl'); // opcional
    setUser({ name, avatarUrl });
  }, []);

  // Cerrar con tecla ESC
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSideMenuOpen) closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSideMenuOpen, closeMenu]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('userName');
      localStorage.removeItem('avatarUrl');
    }
    closeMenu();
    // Redirige a home (ajústalo si usas next-auth o tienes otra ruta)
    window.location.href = '/';
  };

  

  return (
    <div>
      {/* Background black */}
      {isSideMenuOpen && (
        <div className="fixed left-0 top-0 z-10 h-screen w-screen bg-black/30" />
      )}

      {/* Blur overlay (cierra al click) */}
      {isSideMenuOpen && (
        <button
          onClick={closeMenu}
          aria-label="Cerrar menú"
          className="fade-in fixed left-0 top-0 z-10 h-screen w-screen backdrop-blur-sm"
        />
      )}

      {/* Sidemenu */}
      <nav role="dialog" aria-modal="true" aria-label="Menú de cuenta"
        className={clsx(
          'fixed right-0 top-0 z-20 h-screen w-[90%] max-w-[420px] transform bg-white p-5 shadow-2xl transition-all duration-300',
          { 'translate-x-full': !isSideMenuOpen }
        )}
      >
        {/* Close (elegante) */}
        <button
          onClick={closeMenu}
          aria-label="Cerrar menú"
          className="absolute right-5 top-16 sm:top-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 ring-1 ring-zinc-200 shadow-md backdrop-blur transition hover:bg-zinc-50 active:scale-95"
        >
          <IoCloseOutline className="h-6 w-6" />
        </button>
        {/* Handle decorativo */}
        <div className="absolute left-1/2 top-12 sm:top-16 h-1.5 w-12 -translate-x-1/2 rounded-full bg-zinc-200/80" />

        {/* Header Perfil */}
        <div className="mt-14 mb-6 flex items-center gap-3">
          {user.avatarUrl ? (
            // Foto
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name ?? 'Usuario'}
              className="h-12 w-12 rounded-full object-cover ring-1 ring-zinc-200"
            />
          ) : (
            // Inicial / X
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200">
              <IoPersonCircleOutline className="h-8 w-8 text-blue-900" />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {user.name ?? 'Invitado'}
            </p>
            {user.name ? (
              <Link
                href="/account"
                onClick={closeMenu}
                className="text-sm text-blue-600 hover:underline"
              >
                Editar perfil
              </Link>
            ) : (
              <Link
                href="/auth/login"
                onClick={closeMenu}
                className="text-sm text-blue-600 hover:underline"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>

        <div className="h-px w-full bg-zinc-200" />

        {/* Menú */}
        {user.name ? (
          <div className="mt-4 space-y-2">
            <Link
              href="/address"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl p-3 text-zinc-800 transition hover:bg-zinc-50"
            >
              <IoLocationOutline size={24} />
              <span className="text-base">Mis direcciones</span>
            </Link>

            <Link
              href="/orders"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl p-3 text-zinc-800 transition hover:bg-zinc-50"
            >
              <IoTicketOutline size={24} />
              <span className="text-base">Mis pedidos</span>
            </Link>

            <Link
              href="/legal-menu"
              onClick={closeMenu}
              className="flex items-center gap-3 rounded-xl p-3 text-zinc-800 transition hover:bg-zinc-50"
            >
              <IoDocumentTextOutline size={24} />
              <span className="text-base">Información legal</span>
            </Link>

            <div className="my-4 h-px w-full bg-zinc-200" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl p-3 text-red-600 ring-1 ring-red-100 transition hover:bg-red-50"
            >
              <IoLogOutOutline size={24} />
              <span className="text-base font-semibold">Cerrar sesión</span>
            </button>
          </div>
        ) : (
          // Si no está logueado, solo CTA a login
          <div className="mt-6">
            <Link
              href="/auth/login"
              onClick={closeMenu}
              className="inline-flex w-full items-center justify-center rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-black transition hover:bg-yellow-500"
            >
              Iniciar sesión
            </Link>
          </div>
        )}
      </nav>
    </div>
  );
};
