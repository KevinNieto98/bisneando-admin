import { Title } from "@/components";
import { ListChecks } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto p-6">
        <Title 
            title="Status Pedidos" 
            icon={<ListChecks className="h-5 w-5" />}
            subtitle="Configura descuentos e impuestos." 
            showBackButton
            />
    </div>
  );
}