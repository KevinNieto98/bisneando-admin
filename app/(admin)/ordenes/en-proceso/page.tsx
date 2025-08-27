"use client";

import { Title } from "@/components";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function MenuPrincipal() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // obtener el estado de la URL
  const estadoParam = searchParams.get("estado"); // "nueva" | "proceso" | "finalizada"
  const [tab, setTab] = useState("proceso"); // valor por defecto

  useEffect(() => {
    if (estadoParam === "nueva") setTab("nuevas");
    else if (estadoParam === "finalizada") setTab("finalizadas");
    else if (estadoParam === "proceso") setTab("proceso");
  }, [estadoParam]);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-8 space-y-8">
      <header className="flex items-end justify-between w-full gap-4">
        <div className="w-full">
          <Title
            title="Órdenes en Proceso"
            subtitle="Menú de órdenes"
            showBackButton
          />
        </div>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nuevas">Órdenes Nuevas</TabsTrigger>
          <TabsTrigger value="proceso">Órdenes en Proceso</TabsTrigger>
          <TabsTrigger value="finalizadas">Órdenes Finalizadas</TabsTrigger>
        </TabsList>

        <TabsContent value="nuevas">
          <div className="p-4 rounded-lg bg-white shadow-sm">
            Aquí van las órdenes nuevas 🚀
          </div>
        </TabsContent>

        <TabsContent value="proceso">
          <div className="p-4 rounded-lg bg-white shadow-sm">
            Aquí van las órdenes en proceso 🔄
          </div>
        </TabsContent>

        <TabsContent value="finalizadas">
          <div className="p-4 rounded-lg bg-white shadow-sm">
            Aquí van las órdenes finalizadas ✅
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
