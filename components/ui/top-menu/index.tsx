'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IoCartOutline } from 'react-icons/io5';
import { HiOutlineUserCircle } from 'react-icons/hi';
import { useUIStore } from '@/store';

type User = { name: string | null };

export const TopMenu = () => {
  const openSideMenu = useUIStore((state) => state.openSideMenu);

  const [user, setUser] = useState<User>({ name: 'Kevin' });
  const [cartCount, setCartCount] = useState<number>(0);

  // Fallback rápido: lee nombre y conteo de carrito desde localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedName = localStorage.getItem('userName'); // p.ej. "ChatGPT"
    const storedCart = parseInt(localStorage.getItem('cart_count') || '0', 10);
    setUser({ name: 'Kevin Nieto' });
    setCartCount(Number.isFinite(storedCart) ? storedCart : 0);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        {/* Logo */}
        <Link href="/" aria-label="Ir al inicio" className="inline-flex items-center">
          <img src="/bisneando.svg" alt="Bisneando Logo" className="h-10 w-auto" />
        </Link>

        {/* Acciones */}
        <div className="flex items-center gap-2">
  

          {/* Menú / Login con tu lógica */}
          {user.name ? (
            // Si está logueado: botón que ABRE el side menu
            <button
              onClick={openSideMenu}
              aria-label="Abrir menú de cuenta"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-200"
            >
              <HiOutlineUserCircle className="h-5 w-5" />
              <span className="hidden sm:inline">Hola {user.name}</span>
            </button>
          ) : (
            // Si NO está logueado: ir al login
            <Link
              href="/auth/login"
              aria-label="Iniciar sesión"
              className="inline-flex items-center gap-2 rounded-full bg-yellow-400 px-3 py-1.5 font-semibold text-black transition hover:bg-yellow-500"
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
