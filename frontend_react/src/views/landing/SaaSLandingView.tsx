import React from 'react';
import HeroSection from './components/HeroSection';
import SocialProofTicker from './components/SocialProofTicker';
import FeatureZigZag from './components/FeatureZigZag';
import ImpactMetrics from './components/ImpactMetrics';

export default function SaaSLandingView() {
    return (
        <div className="bg-[#050505] min-h-screen text-white font-sans selection:bg-medical-500/30 selection:text-medical-200">

            {/* Top Navigation Bar / Navbar (Simplified) */}
            <nav className="fixed top-0 left-0 right-0 h-20 border-b border-white/5 bg-black/50 backdrop-blur-md z-50 px-4 md:px-8 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-medical-600 to-blue-400 rounded-lg flex items-center justify-center shadow-lg shadow-medical-500/20">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="text-xl font-bold tracking-tight">Nexus CRM</span>
                </div>
                <div className="flex items-center gap-4">
                    {/* We assume login is handled via /login */}
                    <a href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                        Iniciar Sesión
                    </a>
                    <a href="/registro" className="text-sm font-medium bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                        Prueba Gratis
                    </a>
                </div>
            </nav>

            <main className="pt-20">
                <HeroSection />
                <SocialProofTicker />
                <FeatureZigZag />
                <ImpactMetrics />
            </main>

            {/* Footer (Simplified) */}
            <footer className="border-t border-white/10 bg-[#0a0f18] py-12 px-8 text-center mt-20">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-xl font-bold text-gray-500">Nexus CRM</span>
                </div>
                <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Antigravity. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
