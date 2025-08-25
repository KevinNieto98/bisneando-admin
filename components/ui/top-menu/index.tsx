'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiOutlineUserCircle } from 'react-icons/hi';
import { useUIStore } from '@/store';

type User = { name: string | null };

export const TopMenu = () => {
  const openSideMenu = useUIStore((state) => state.openSideMenu);

  const [user, setUser] = useState<User>({ name: 'Kevin' });
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedName = localStorage.getItem('userName');
    const storedCart = parseInt(localStorage.getItem('cart_count') || '0', 10);
    setUser({ name: storedName || 'Kevin Nieto' });
    setCartCount(Number.isFinite(storedCart) ? storedCart : 0);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full  border-yellow-600 bg-[#FACC15] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* Logo */}
        <Link href="/" aria-label="Ir al inicio" className="inline-flex items-center">
          <img src="/bisneando.svg" alt="Bisneando Logo" className="h-10 w-auto" />
        </Link>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {user.name ? (
            <button
              onClick={openSideMenu}
              aria-label="Abrir menú de cuenta"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-black ring-1 ring-zinc-200 transition hover:bg-zinc-100"
            >
              <HiOutlineUserCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Hola {user.name}</span>
            </button>
          ) : (
            <Link
              href="/auth/login"
              aria-label="Iniciar sesión"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 font-semibold text-black ring-1 ring-zinc-200 transition hover:bg-zinc-100"
            >
              <HiOutlineUserCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Iniciar sesión</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
