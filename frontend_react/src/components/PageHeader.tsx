import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  /** Optional icon (e.g. Building2, Stethoscope) to show beside title on mobile */
  icon?: ReactNode;
}

/**
 * Encabezado de página unificado: título, subtítulo y acción.
 * En mobile: layout apilado y compacto; en desktop: fila con acción alineada a la derecha.
 * Estética consistente en todas las vistas (Clínicas, Tratamientos, Pacientes, etc.).
 */
export default function PageHeader({ title, subtitle, action, icon }: PageHeaderProps) {
  return (
    <div className="mb-6 sm:mb-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0">
          {icon && (
            <div className="hidden sm:flex shrink-0 w-12 h-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 border-l-4 border-blue-500 pl-4 sm:pl-5">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-400 text-sm sm:text-base mt-1 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && (
          <div className="shrink-0 flex justify-end sm:justify-start">
            <div className="glass-effect p-1 rounded-xl">
              {action}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
