'use client';

import Link from 'next/link';
import { HiOutlineUserCircle } from 'react-icons/hi';
import { useUIStore } from '@/store';

type User = {
  display_name: string;
};

export const TopMenu = ({ user }: { user: User }) => {
  const openSideMenu = useUIStore((state) => state.openSideMenu);

  return (
    <nav className="sticky top-0 z-50 w-full border-yellow-600 bg-[#FACC15] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* Logo */}
        <Link href="/" aria-label="Ir al inicio" className="inline-flex items-center">
          <img src="/bisneando.svg" alt="Bisneando Logo" className="h-10 w-auto" />
        </Link>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <button
            onClick={openSideMenu}
            aria-label="Abrir menú de cuenta"
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-black ring-1 ring-zinc-200 transition hover:bg-zinc-100"
          >
            <HiOutlineUserCircle className="h-5 w-5" />
            <span className="hidden sm:inline">Hola {user.display_name}</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
