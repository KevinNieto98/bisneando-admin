import { Title } from "@/components";
import { MapPin } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto p-6">
          <Title 
            title="Colonias" 
            icon={<MapPin className="h-5 w-5" />}
            subtitle="Configura zonas de entrega y catálogos." 
            showBackButton
          />
    </div>
  );
}