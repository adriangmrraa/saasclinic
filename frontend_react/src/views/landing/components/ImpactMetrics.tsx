import React from 'react';
import { TimerReset, BrainCircuit, Clock } from 'lucide-react';

const METRICS = [
    {
        id: 1,
        title: 'Cierres más rápidos',
        value: '60%',
        description: 'Reducción en el ciclo medio de ventas desde la captación hasta la conversión final.',
        icon: <TimerReset className="w-8 h-8 text-medical-400" />,
    },
    {
        id: 2,
        title: 'Calificación IA',
        value: '81%',
        description: 'Precisión en el filtrado de leads no calificados, ahorrando horas a tus vendedores.',
        icon: <BrainCircuit className="w-8 h-8 text-purple-400" />,
    },
    {
        id: 3,
        title: 'Seguimiento',
        value: '24/7',
        description: 'Respuesta inmediata a prospectos sin importar zona horaria ni fines de semana.',
        icon: <Clock className="w-8 h-8 text-blue-400" />,
    },
];

export default function ImpactMetrics() {
    return (
        <section className="py-24 px-4 sm:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-5xl font-bold mb-4">Números que Transforman Negocios</h2>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                    No cambiamos solo tu software, optimizamos la rentabilidad de todo tu embudo de adquisición.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Glow backdrop */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[50%] bg-medical-600/5 blur-[120px] pointer-events-none -z-10" />

                {METRICS.map((metric) => (
                    <div
                        key={metric.id}
                        className="bg-white/[0.02] border border-white/10 backdrop-blur-md hover:bg-white/[0.04] transition-colors rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group"
                    >
                        {/* Hover subtle glow inside card */}
                        <div className="absolute -inset-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-white/5 to-transparent blur-md -z-10" />

                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            {metric.icon}
                        </div>

                        <h3 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-4">
                            {metric.value}
                        </h3>

                        <h4 className="text-xl font-semibold text-white mb-2">
                            {metric.title}
                        </h4>

                        <p className="text-gray-400 text-sm leading-relaxed">
                            {metric.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
