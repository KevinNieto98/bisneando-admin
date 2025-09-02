"use client";

import React from "react";
import clsx from "clsx";
import { Upload } from "lucide-react";
import { Button } from "@/components";

type ImageDropzoneProps = {
  file: File | null;
  onFileSelected: (file: File) => void;
  accept?: string;
  ratio?: number;
  className?: string;
  placeholderText?: string;
  disabled?: boolean;
};

export const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  file,
  onFileSelected,
  accept = "image/*",
  ratio = 16 / 9,
  className,
  placeholderText = "Arrastra tu imagen aquí o elige un archivo",
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const blobUrl = React.useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  React.useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  };

  const handleChoose: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return;
    const f = e.target.files?.[0] || null;
    if (f) onFileSelected(f);
  };

  const openFileDialog = () => {
    if (!disabled) inputRef.current?.click();
  };

  return (
    <div
      onDragOver={(e) => {
        if (!disabled) {
          e.preventDefault();
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={clsx(
        "relative rounded-2xl border-2 border-dashed p-4 transition",
        disabled
          ? "border-neutral-200 bg-neutral-100 cursor-not-allowed opacity-60"
          : isDragging
          ? "border-neutral-600 bg-neutral-50"
          : "border-neutral-300",
        className
      )}
    >
      <div className="relative w-full overflow-hidden rounded-xl bg-neutral-100">
        <div style={{ paddingTop: `${100 / ratio}%` }} />
        <div className="absolute inset-0 flex items-center justify-center">
          {!file ? (
            <div className="flex flex-col items-center justify-center text-center gap-3 p-6">
              <Upload className="h-6 w-6 text-neutral-500" />
              <p className="text-sm text-neutral-700">{placeholderText}</p>
              <div className="flex items-center gap-2">
                <Button variant="white" onClick={openFileDialog} disabled={disabled}>
                  Elegir archivo
                </Button>
                <span className="text-xs text-neutral-500">o suéltalo aquí</span>
              </div>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleChoose}
                disabled={disabled}
              />
            </div>
          ) : (
            <img
              src={blobUrl!}
              alt="Vista previa"
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
};
