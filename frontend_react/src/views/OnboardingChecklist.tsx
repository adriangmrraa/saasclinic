import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ONBOARDING_STEPS = [
    {
        id: 'meta',
        title: 'Conectar Marketing Hub',
        description: 'Sincroniza tus campañas de Meta Ads para medir el ROI en tiempo real.',
        actionText: 'Ir a Marketing Hub',
        actionRoute: '/crm/configuracion', // Route assuming Marketing Hub is there or settings
        isCompleted: false, // Default state, ideally driven by backend/context
    },
    {
        id: 'whatsapp',
        title: 'Unificar WhatsApp',
        description: 'Conecta tu número oficial para que el AI Setter comience a trabajar.',
        actionText: 'Ir a Canales',
        actionRoute: '/crm/configuracion',
        isCompleted: false,
    },
    {
        id: 'ai-setter',
        title: 'Entrenar al AI Setter',
        description: 'Define tus precios y servicios para que la IA sepa qué vender.',
        actionText: 'Ir a Servicios',
        actionRoute: '/crm/configuracion',
        isCompleted: false,
    },
    {
        id: 'team',
        title: 'Invitar a tus Closers',
        description: 'Añade a tu equipo de ventas para que reciban las reuniones agendadas.',
        actionText: 'Ir a Usuarios',
        actionRoute: '/crm/configuracion',
        isCompleted: false,
    },
];

export default function OnboardingChecklist() {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    // Simulating completion states for initial UI
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);

    const handleStepClick = (stepId: string) => {
        // In a real scenario, this state reflects the backend config.
        // Here we let the user manually toggle for demo purposes if they click the circle.
        setCompletedSteps(prev =>
            prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
        );
    };

    const progress = Math.round((completedSteps.length / ONBOARDING_STEPS.length) * 100);

    if (!isVisible) return null;

    return (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-md relative z-10 w-full mb-6 max-w-lg lg:max-w-xs float-right lg:ml-6 group hover:border-white/20 transition-all">
            <div className="p-5 border-b border-white/10 bg-white/5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Misión de Despegue</h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-1">Sigue la ruta para activar tu CRM.</p>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Progreso</span>
                        <span className="text-xs font-black text-white">{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div
                            className="h-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.6)] transition-all duration-700 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer scale-x-150"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="divide-y divide-white/5">
                {ONBOARDING_STEPS.map((step) => {
                    const isDone = completedSteps.includes(step.id);
                    return (
                        <div key={step.id} className={`p-4 transition-all duration-300 ${isDone ? 'bg-blue-600/5 opacity-60' : 'hover:bg-white/[0.04]'}`}>
                            <div className="flex items-start gap-3">
                                <button
                                    onClick={() => handleStepClick(step.id)}
                                    className="mt-0.5 flex-shrink-0 focus:outline-none group/check"
                                >
                                    {isDone ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shadow-lg shadow-emerald-500/20" />
                                    ) : (
                                        <Circle className="w-5 h-5 text-gray-600 group-hover/check:text-blue-400 group-hover/check:scale-110 transition-all" />
                                    )}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`text-xs font-bold mb-1 transition-all ${isDone ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                        {step.title}
                                    </h4>
                                    {!isDone && (
                                        <>
                                            <p className="text-[10px] text-gray-500 mb-3 leading-relaxed font-medium">
                                                {step.description}
                                            </p>
                                            <button
                                                onClick={() => navigate(step.actionRoute)}
                                                className="text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-all group/btn"
                                            >
                                                {step.actionText}
                                                <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
