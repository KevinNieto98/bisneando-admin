'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {
  IoCloseOutline,
  IoLogOutOutline,
  IoPersonCircleOutline,
} from 'react-icons/io5';
import { useUIStore } from '@/store';
import { logout } from '@/app/(auth)/actions';
import { Button } from '../button';

type User = {
  name: string | null;
  avatarUrl?: string | null;
};

type SidebarProps = {
  user?: {
    name?: string | null;
    avatarUrl?: string | null;
  };
};

export const Sidebar = ({ user: userProp }: SidebarProps) => {
  const isSideMenuOpen = useUIStore((state) => state.isSideMenuOpen);
  const closeMenu = useUIStore((state) => state.closeSideMenu);
  const [isPending, startTransition] = useTransition();

  const [user, setUser] = useState<User>({
    name: userProp?.name ?? null,
    avatarUrl: userProp?.avatarUrl ?? null,
  });

  useEffect(() => {
    if (userProp?.name || userProp?.avatarUrl) return;
    if (typeof window === 'undefined') return;
    const name = localStorage.getItem('userName');
    const avatarUrl = localStorage.getItem('avatarUrl');
    setUser({ name, avatarUrl });
  }, [userProp?.name, userProp?.avatarUrl]);

  // ya no llamamos a supabase desde el cliente; usamos el Server Action
  const handlePreLogout = () => {
    // Limpieza opcional del storage propio de tu app
    try {
      localStorage.removeItem('userName');
      localStorage.removeItem('avatarUrl');
    } catch {}
    closeMenu();
  };

  return (
    <div>
      {isSideMenuOpen && (
        <div className="fixed left-0 top-0 z-10 h-screen w-screen bg-black/30" />
      )}

      {isSideMenuOpen && (
        <button
          onClick={closeMenu}
          aria-label="Cerrar menú"
          className="fade-in fixed left-0 top-0 z-10 h-screen w-screen backdrop-blur-sm"
        />
      )}

      <nav
        role="dialog"
        aria-modal="true"
        aria-label="Menú de cuenta"
        className={clsx(
          'fixed right-0 top-0 z-20 h-screen w-[90%] max-w-[420px] transform bg-white p-5 shadow-2xl transition-all duration-300',
          { 'translate-x-full': !isSideMenuOpen }
        )}
      >
        <button
          onClick={closeMenu}
          aria-label="Cerrar menú"
          className="absolute right-5 top-16 sm:top-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-700 ring-1 ring-zinc-200 shadow-md backdrop-blur transition hover:bg-zinc-50 active:scale-95"
        >
          <IoCloseOutline className="h-6 w-6" />
        </button>
        <div className="absolute left-1/2 top-12 sm:top-16 h-1.5 w-12 -translate-x-1/2 rounded-full bg-zinc-200/80" />

        {/* Header Perfil */}
        <div className="mt-14 mb-6 flex items-center gap-3">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name ?? 'Usuario'}
              className="h-12 w-12 rounded-full object-cover ring-1 ring-zinc-200"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 ring-1 ring-zinc-200">
              <IoPersonCircleOutline className="h-8 w-8 text-blue-900" />
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-900">
              {user.name ?? 'Usuario'}
            </p>
            <Link
              href="/account"
              onClick={closeMenu}
              className="text-sm text-blue-600 hover:underline"
            >
              Editar perfil
            </Link>
          </div>
        </div>

        <div className="h-px w-full bg-zinc-200" />

        {/* Menú */}
        <div className="mt-4 space-y-2">
          <div className="my-4 h-px w-full bg-zinc-200" />

          {/* === Logout con Server Action === */}
          <form
            action={async () => {
              handlePreLogout();
              // usa startTransition para feedback mientras ejecuta el action
              startTransition(async () => {
                await logout(); // hará redirect en el server action
              });
            }}
          >
            <Button
              type="submit"
              variant="danger"
              icon={<IoLogOutOutline size={20} />}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Cerrando…' : 'Cerrar sesión'}
            </Button>
          </form>
        </div>
      </nav>
    </div>
  );
};
