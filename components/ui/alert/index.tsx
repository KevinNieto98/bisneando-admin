// /components/Alert.tsx
'use client';

import { useEffect, useMemo } from "react";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { MdOutlineCancel, MdErrorOutline } from "react-icons/md";
import { useUIStore } from "@/store";

type AlertType = 'success' | 'danger' | 'warning' | 'info';

export const Alert = () => {
  const esVisibleAlerta = useUIStore((s) => s.esVisibleAlerta);
  const { titulo, mensaje, tipo } = useUIStore((s) => s.alerta);
  const ocultarAlerta = useUIStore((s) => s.ocultarAlerta);

  useEffect(() => {
    if (!esVisibleAlerta) return;
    const t = setTimeout(() => ocultarAlerta(), 5000);
    return () => clearTimeout(t);
  }, [esVisibleAlerta, ocultarAlerta]);

  const { classes, Icon } = useMemo(() => {
    switch (tipo as AlertType) {
      case 'danger':
        return {
          classes: 'bg-red-100 border-t-4 border-red-500 text-red-900',
          Icon: MdErrorOutline,
        };
      case 'warning':
        return {
          classes: 'bg-yellow-100 border-t-4 border-yellow-500 text-yellow-900',
          Icon: MdErrorOutline,
        };
      case 'info':
        return {
          classes: 'bg-blue-100 border-t-4 border-blue-500 text-blue-900',
          Icon: IoCheckmarkCircleOutline,
        };
      case 'success':
      default:
        return {
          classes: 'bg-green-100 border-t-4 border-green-500 text-green-900',
          Icon: IoCheckmarkCircleOutline,
        };
    }
  }, [tipo]);

  if (!esVisibleAlerta) return null;

  return (
    <div className="fixed inset-0 flex items-start justify-end p-4 z-[9999]">
      <div className={`${classes} rounded-b px-4 py-3 shadow-md relative max-w-sm`} role="alert">
        <div className="flex">
          <div className="py-1 px-1">
            <Icon size={'16px'} />
          </div>
          <div className="ml-2 pr-6">
            {titulo ? <p className="font-bold">{titulo}</p> : null}
            {mensaje ? <p className="text-sm">{mensaje}</p> : null}
          </div>
          <button
            type="button"
            className="absolute top-1 right-1 p-1 cursor-pointer"
            onClick={ocultarAlerta}
            aria-label="Cerrar alerta"
          >
            <MdOutlineCancel size={'16px'} />
          </button>
        </div>
      </div>
    </div>
  );
};
