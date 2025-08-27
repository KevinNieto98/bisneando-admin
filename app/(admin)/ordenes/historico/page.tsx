"use client";


import {  Title } from "@/components";



export default function MenuPrincipal() {
  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title title="Órdenes en Proceso" subtitle="Menú de órdenes" showBackButton />
        </div>
      </header>


      {/* Variante compacta opcional (por si quieres usarla en un sidebar) */}
      {/*
      <aside className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-3">
        {menuItems.map(({ title, href, Icon }) => (
          <Link key={href} href={href} className="group flex items-center gap-3 rounded-2xl p-3 border border-neutral-200 bg-white">
            <span className="grid place-items-center rounded-xl bg-neutral-100 p-2">
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-medium">{title}</span>
          </Link>
        ))}
      </aside>
      */}
    </div>
  );
}
