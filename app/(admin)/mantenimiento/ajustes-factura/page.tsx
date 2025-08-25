import { Title } from "@/components";
import { Percent } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto p-6">
        <Title 
            title="Ajustes Factura" 
            icon={<Percent className="h-5 w-5" />}
            subtitle="Configura descuentos e impuestos." 
            showBackButton
        />
    </div>
  );
}