import React from 'react';
import { Target, MessageSquareCode, ArrowUpRight, Zap } from 'lucide-react';

const FEATURES = [
    {
        id: 'marketing-hub',
        align: 'left' as const,
        title: 'Unifica todo tu tráfico.',
        subtitle: 'Marketing Hub Integrado',
        description: 'Los leads vienen de Facebook, Instagram o referidos. Mide el costo real de adquisición (CAC) y el ROI en tiempo real. Deja de adivinar qué campaña funciona.',
        icon: <Target className="w-6 h-6 text-medical-500" />,
        mockup: (
            <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-2xl border border-gray-800 shadow-2xl shadow-medical-500/10 p-6 flex flex-col justify-between overflow-hidden">
                {/* Mockup Top */}
                <div className="flex justify-between items-start z-10">
                    <div>
                        <p className="text-sm font-medium text-gray-400">Rendimiento Meta Ads</p>
                        <h4 className="text-3xl font-bold text-white mt-1">$4,250<span className="text-lg text-green-400 ml-2">+24%</span></h4>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-medical-500" />
                    </div>
                </div>
                {/* Mockup Middle Graph lines */}
                <div className="absolute inset-0 top-1/2 flex items-end gap-2 px-6 pb-6 opacity-30 select-none z-0">
                    {[40, 70, 45, 90, 65, 100, 80].map((h, i) => (
                        <div key={i} className="flex-1 bg-medical-500 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                </div>
            </div>
        )
    },
    {
        id: 'ai-setter',
        align: 'right' as const,
        title: 'Vende mientras duermes.',
        subtitle: 'AI Setter en Piloto Automático',
        description: 'El AI Setter responde objeciones, califica el presupuesto del lead vía WhatsApp y lo asigna al vendedor correcto. Agendando reuniones 24/7 sin intervención humana.',
        icon: <MessageSquareCode className="w-6 h-6 text-purple-500" />,
        mockup: (
            <div className="relative w-full aspect-video bg-[#0a0f18] rounded-2xl border border-gray-800 shadow-2xl p-6 flex flex-col justify-end space-y-4 overflow-hidden">
                {/* Chat Bubbles */}
                <div className="self-end max-w-[80%] bg-medical-600 text-white p-3 rounded-2xl rounded-br-none text-sm shadow-md">
                    Hola, vi el anuncio en Instagram y quiero saber el precio de la consultoría.
                </div>
                <div className="self-start max-w-[80%] bg-gray-800 text-gray-200 p-3 rounded-2xl rounded-bl-none text-sm shadow-md border border-gray-700 flex flex-col gap-2">
                    <span>¡Hola! Claro que sí 🚀. Para darte el mejor precio, ¿de qué tamaño es tu equipo comercial actualmente?</span>
                    <div className="mt-1 flex gap-2">
                        <div className="bg-medical-500/20 text-medical-400 text-xs px-2 py-1 rounded-full border border-medical-500/30 flex items-center gap-1"><Zap className="w-3 h-3" /> IA Activada</div>
                    </div>
                </div>
                <div className="self-end max-w-[80%] bg-medical-600 text-white p-3 rounded-2xl rounded-br-none text-sm shadow-md">
                    Somos 15 personas.
                </div>
                <div className="self-start max-w-[80%] bg-gray-800 text-gray-200 p-3 rounded-2xl rounded-bl-none text-sm shadow-md border border-gray-700">
                    ¡Perfecto! Te agendo una llamada con nuestro Closer Senior para mañana. ¿A las 15hs te queda bien? 📅
                </div>
            </div>
        )
    }
];

export default function FeatureZigZag() {
    return (
        <section id="features" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto space-y-32">
            {FEATURES.map((feature, idx) => (
                <div
                    key={feature.id}
                    className={`flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-24 ${feature.align === 'right' ? 'lg:flex-row-reverse' : ''
                        }`}
                >
                    {/* Text Content */}
                    <div className="w-full lg:w-1/2 space-y-6">
                        <div className="inline-flex items-center justify-center p-3 bg-white/5 rounded-xl border border-white/10 mb-2">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-medical-500 uppercase tracking-widest">{feature.subtitle}</h3>
                        <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            {feature.title}
                        </h2>
                        <p className="text-lg text-gray-400 leading-relaxed md:pr-10">
                            {feature.description}
                        </p>
                    </div>

                    {/* Graphical Mockup */}
                    <div className="w-full lg:w-1/2 w-full p-4 lg:p-0">
                        <div className="relative">
                            {/* Decorative behind mockup glow */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] \${idx % 2 === 0 ? 'bg-medical-600/10' : 'bg-purple-600/10'} blur-[80px] -z-10 rounded-full`} />

                            {feature.mockup}
                        </div>
                    </div>
                </div>
            ))}
        </section>
    );
}
