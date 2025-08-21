import React, { ReactNode } from "react";

interface Props {
  title: string;
  subtitle?: string;
  className?: string;
  /** Ícono opcional. Ej: <FaCart size={18}/> */
  icon?: ReactNode;
  /** Muestra una línea delicada debajo del componente */
  showDivider?: boolean; // default: true
  /** Muestra un botón de regresar a la derecha del título */
  showBackButton?: boolean; // default: false
  /** Callback al hacer clic en el botón de regresar */
  onBack?: () => void;
  /** Texto opcional del botón de regresar */
  backLabel?: string; // default: "Regresar"
  /** Activa/desactiva el marco circular del contenedor */
  withFrame?: boolean; // default: true
  /** Clases para personalizar el fondo. Si no se provee, usa un azul suave */
  bgClassName?: string;
}

// Ícono por defecto (no requiere librerías externas)
const DefaultIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-5 w-5"
    aria-hidden
  >
    <path d="M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5zm0 4.5a.75.75 0 01.75.75v4.19l3.03 1.75a.75.75 0 11-.75 1.3l-3.41-1.98a.75.75 0 01-.37-.65V7.5A.75.75 0 0112 6.75z" />
  </svg>
);

// Ícono flecha para el botón de regresar
const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-4 w-4"
    aria-hidden
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

export const Title = ({
  title,
  subtitle,
  className = "",
  icon,
  showDivider = true,
  showBackButton = false,
  onBack,
  backLabel = "Regresar",
  withFrame = true,
  bgClassName,
}: Props) => {
  const IconNode = icon ?? <DefaultIcon />;

  // Fondo azul super suave por defecto si no se especifica
  const softBlueBg =
    bgClassName ??
    "bg-blue-50";

  return (
    <div
      className={[
        "mt-3 w-full max-w-full",
        withFrame
          ? [
              softBlueBg,
              "",
              "p-4 sm:p-5",
            ].join(" ")
          : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-start gap-3 w-full">
        {/* Contenedor de ícono con marquito circular */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200 shadow-sm ">
          {IconNode}
        </div>

        {/* Títulos + botón de regresar */}
        <div className="min-w-0 flex-1 w-full">
          <div className="flex items-center gap-2 flex-wrap justify-between w-full">
            <h1 className="antialiased text-2xl font-semibold leading-tight text-gray-700 flex-1">
              {title}
            </h1>

            {showBackButton && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1 rounded-full border border-transparent bg-blue-600 px-3 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 active:bg-blue-800 dark:bg-blue-500 dark:hover:bg-blue-600"
                aria-label={backLabel}
              >
                <ArrowLeftIcon />
                <span className="leading-none">{backLabel}</span>
              </button>
            )}
          </div>

          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      </div>

      {showDivider && (
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-blue-300 to-transparent dark:via-blue-700/60" />
      )}
    </div>
  );
};

export default Title;
