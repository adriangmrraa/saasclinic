import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSection() {
    return (
        <section className="min-h-screen flex flex-col items-center justify-center pt-28 pb-16 px-4 text-center relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60rem] h-[60rem] bg-medical-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                {/* Superior Badge */}
                <div className="inline-flex items-center gap-2 rounded-full border border-medical-500/30 bg-medical-500/10 text-medical-400 px-4 py-1.5 text-sm mb-8 animate-fade-in">
                    <Sparkles className="w-4 h-4" />
                    <span>Nuevo: AI Setter + Integración con Meta Ads</span>
                </div>

                {/* H1 Title */}
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto mb-6">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-500">
                        Los leads preguntan. Llaman. Tú pierdes el seguimiento.
                    </span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-400 to-blue-600">
                        ¿Puedes seguir el ritmo?
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '100ms' }}>
                    CRM Ventas unifica WhatsApp, Meta Ads y tu Pipeline. Deja que nuestro Agente IA califique y agende reuniones por tus vendedores.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
                    <Link
                        to="/registro"
                        className="group inline-flex items-center gap-2 bg-medical-600 hover:bg-medical-500 text-white rounded-xl px-8 py-4 text-lg font-semibold shadow-[0_0_30px_rgba(0,102,204,0.4)] transition-all hover:scale-105"
                    >
                        Comenzar Prueba Gratuita
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <a
                        href="#features"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl backdrop-blur-sm transition-all"
                    >
                        Ver Plataforma en Acción
                    </a>
                </div>

                <p className="mt-6 text-sm text-gray-500">
                    14 días gratis. Sin tarjeta promocional. Configuración en 5 minutos.
                </p>
            </div>
        </section>
    );
}
