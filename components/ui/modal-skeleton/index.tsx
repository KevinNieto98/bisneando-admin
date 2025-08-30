// ModalSkeleton.tsx (o dentro de la misma página arriba del componente)
import React from "react";
import { Skeleton } from "@/components"; // si tu Skeleton vive en "@/components"

export function ModalSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="line" width="60%" height={20} />
      <div className="space-y-2">
        <Skeleton variant="line" width="30%" height={14} />
        <Skeleton variant="rect" width="100%" height={40} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="line" width="35%" height={14} />
        <Skeleton variant="rect" width="100%" height={40} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Skeleton variant="rect" width={90} height={36} />
        <Skeleton variant="rect" width={120} height={36} />
      </div>
    </div>
  );
}
