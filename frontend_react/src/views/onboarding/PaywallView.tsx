import React from 'react';
import { CreditCard, Rocket, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PaywallView: React.FC = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-4">
            <div className="max-w-xl w-full">

                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                        Tu prueba gratuita <span className="text-blue-500">ha finalizado</span>
                    </h1>
                    <p className="text-gray-400 text-lg">
                        Fueron 14 días acelerando tus ventas. Actualiza al Plan Growth para seguir utilizando la Inteligencia Artificial y crecer sin techo.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 p-8 rounded-2xl backdrop-blur-xl mb-6 relative overflow-hidden">
                    {/* Glow background */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-blue-500/20 blur-[100px] rounded-full point-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Rocket className="w-5 h-5 text-blue-500" />
                                    Plan Growth
                                </h3>
                                <p className="text-sm text-gray-400">Todo lo necesario para equipos imparables</p>
                            </div>
                            <div className="text-right">
                                <span className="text-3xl font-bold">$99</span>
                                <span className="text-gray-400 text-sm">/mes</span>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {[
                                "Leads y Contactos ilimitados",
                                "AI Setter Omni-canal (WhatsApp & Meta)",
                                "Integración completa con Meta Ads",
                                "Soporte Prioritario"
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3 text-gray-300">
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] flex items-center justify-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Añadir Tarjeta y Actualizar
                        </button>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={logout}
                        className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaywallView;
