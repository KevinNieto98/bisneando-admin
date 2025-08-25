import { Title } from "@/components";
import { Tags } from "lucide-react";

export default function Page() {
  return (
    <div className="max-w-4xl mx-auto p-6">
          <Title 
            title="Marcas" 
            icon={<Tags className="h-5 w-5" />}
            subtitle="Configura descuentos e impuestos." 
            showBackButton  
          />
    </div>
  );
}