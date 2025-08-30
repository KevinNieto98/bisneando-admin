'use client';

import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { MdOutlineCancel, MdErrorOutline } from "react-icons/md";

import { useEffect } from "react";
import { useUIStore } from "@/store";

interface AlertProps {
    title?: string;
    msg?: string;
    type?: string | 'success';
}

export const Alert = ({ title, msg, type = 'success' }: AlertProps) => {
    const esVisibleAlerta = useUIStore((state) => state.esVisibleAlerta);
    const ocultarAlerta = useUIStore((state) => state.ocultarAlerta);

    useEffect(() => {
        if (esVisibleAlerta) {
            const timer = setTimeout(() => {
                ocultarAlerta();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [esVisibleAlerta, ocultarAlerta]);

    if (!esVisibleAlerta) return null;

    const alertStyles = type === 'danger' 
        ? 'bg-red-100 border-t-4 border-red-500 text-red-900'
        : 'bg-green-100 border-t-4 border-green-500 text-green-900';

    const icon = type === 'danger' 
        ? <MdErrorOutline size={'16px'} />
        : <IoCheckmarkCircleOutline size={'16px'} />;

    


    return (
        <div className="fixed inset-0 flex items-start justify-end p-4 z-[9999]">
            <div className={`${alertStyles} rounded-b px-4 py-3 shadow-md relative max-w-sm`} role="alert">
                <div className="flex">
                    <div className="py-1 px-1">
                        {icon}
                    </div>
                    <div className="ml-2">
                        <p className="font-bold">{title}</p>
                        <p className="text-sm">{msg}</p>
                    </div>
                    <span
                        className="absolute top-1 right-1 p-1 cursor-pointer"
                        onClick={() => ocultarAlerta()}
                    >
                        <MdOutlineCancel size={'16px'} />
                    </span>
                </div>
            </div>
        </div>
    );
};