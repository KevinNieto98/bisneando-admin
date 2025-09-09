// =============================
// /app/menus/page.tsx
// =============================
"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent, Title } from "@/components";
import { LayoutList, PanelsTopLeft } from "lucide-react";
import { MenuContainer, MenuHeadContainer } from "./components";

export default function MenusPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      {/* Header propio de la sección de Menús */}
      <Title
        title="Menús"
        subtitle="Catálogo de Menús del sistema"
        showBackButton
        backHref="/mantenimiento"
        icon={<PanelsTopLeft className="h-6 w-6 text-neutral-700" />}
      />

      <Tabs defaultValue="menus" className="mt-3 w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="menus">
            <span className="inline-flex items-center gap-2">
              <LayoutList className="h-4 w-4" />
              Menús
            </span>
          </TabsTrigger>
          <TabsTrigger value="head">
            <span className="inline-flex items-center gap-2">
              <PanelsTopLeft className="h-4 w-4" />
               Head
            </span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Todo lo que antes era la página completa */}
        <TabsContent value="menus">
          <MenuContainer />
        </TabsContent>

        {/* TAB 2: Página de Menú Head */}
        <TabsContent value="head">
          <MenuHeadContainer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
