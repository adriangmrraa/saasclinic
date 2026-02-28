import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use'; // Optional: if useWindowSize is not installed, we can mock it or install it. We will use a simple fallback.
import { PlayCircle, X } from 'lucide-react';

interface Props {
    isTrial: boolean;
}

export default function WelcomeModal({ isTrial }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    // fallback for window size if react-use is not available
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        // Solo mostramos si es trial y no ha visto el modal antes
        if (isTrial) {
            const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
            if (!hasSeenWelcome) {
                setIsOpen(true);
                setShowConfetti(true);
                // Apagar confeti después de 4 segundos
                const timer = setTimeout(() => {
                    setShowConfetti(false);
                }, 4000);
                return () => clearTimeout(timer);
            }
        }
    }, [isTrial]);

    const handleClose = () => {
        localStorage.setItem('hasSeenWelcome', 'true');
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            {showConfetti && (
                <div className="fixed inset-0 z-50 pointer-events-none">
                    <Confetti
                        width={windowSize.width}
                        height={windowSize.height}
                        recycle={false}
                        numberOfPieces={500}
                        gravity={0.15}
                    />
                </div>
            )}

            <div className="relative w-full max-w-2xl bg-[#0a0f18] border border-gray-800 rounded-2xl shadow-2xl p-6 sm:p-10 animate-slide-up overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-medical-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-2"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-8 relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-tr from-medical-600 to-blue-400 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg shadow-medical-500/30">
                        <span className="text-3xl">🎉</span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-4">
                        Bienvenido a tu prueba de 14 días Growth
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Estás a unos minutos de automatizar tu captación y multiplicar tus cierres.
                    </p>
                </div>

                {/* Video Placeholder */}
                <div className="relative w-full aspect-video bg-[#1a1a1a] rounded-xl border border-gray-800 overflow-hidden group cursor-pointer mb-8 shadow-inner flex items-center justify-center">
                    {/* Si quisieras un iframe real: <iframe src="https://www.youtube.com/embed/XXXX?controls=0" className="w-full h-full" ... /> */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-6 select-none">
                        <p className="text-white font-semibold text-lg flex items-center gap-2">
                            <PlayCircle className="w-5 h-5 text-medical-500" />
                            Demo de 2 minutos: Cómo cerrar tu primer lead hoy
                        </p>
                    </div>
                    {/* Fake Play Button */}
                    <div className="w-16 h-16 rounded-full bg-medical-500/20 border border-medical-500/50 flex items-center justify-center group-hover:scale-110 group-hover:bg-medical-500/40 transition-all duration-300">
                        <PlayCircle className="w-8 h-8 text-medical-200" />
                    </div>
                </div>

                <div className="flex justify-center relative z-10">
                    <button
                        onClick={handleClose}
                        className="bg-medical-600 hover:bg-medical-500 text-white px-8 py-4 rounded-xl font-semibold shadow-[0_0_20px_rgba(0,102,204,0.3)] transition-all hover:scale-105 w-full sm:w-auto"
                    >
                        Configurar mi CRM
                    </button>
                </div>
            </div>
        </div>
    );
}
