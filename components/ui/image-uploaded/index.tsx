// ImageUploaded.tsx
import { Trash2 } from "lucide-react";

interface ImageUploadedProps {
  url: string;
  fileName?: string;     // ahora opcional
  alt?: string;          // opcional
  onRemove: () => void;
}

export  function ImageUploaded({
  url,
  fileName,
  alt,
  onRemove,
}: ImageUploadedProps) {
  const altText = alt ?? fileName ?? "Imagen";
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
      <img src={url} alt={altText} className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 inline-flex items-center rounded-md bg-white/90 p-1 shadow hover:bg-white"
        title="Quitar"
      >
        <Trash2 className="w-4 h-4 text-red-600" />
      </button>
    </div>
  );
}
