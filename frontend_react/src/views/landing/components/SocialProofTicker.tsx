import React from 'react';

const BRANDS = [
    "Acme Corp", "Ventas Global", "Tech Solutions", "Inmuebles Pro", "Agencia Horizon", "Consultores AI",
    "Acme Corp", "Ventas Global", "Tech Solutions", "Inmuebles Pro", "Agencia Horizon", "Consultores AI",
];

export default function SocialProofTicker() {
    return (
        <section className="py-10 border-y border-white/5 bg-black/50 backdrop-blur-md overflow-hidden flex flex-col items-center">
            <p className="text-sm font-medium text-gray-500 mb-6 tracking-widest uppercase">
                Equipos de ventas de alto rendimiento confían en nosotros
            </p>

            {/* Infinite Ticker Container */}
            <div className="w-full relative flex items-center">
                {/* Left Gradient Fade */}
                <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />

                <div className="flex w-max animate-ticker hover:animation-play-state-paused">
                    {BRANDS.map((brand, idx) => (
                        <div
                            key={idx}
                            className="px-12 flex items-center justify-center min-w-[200px]"
                        >
                            {/* Simulated Logo via text for aesthetics */}
                            <span className="text-xl font-bold text-gray-600 opacity-50 hover:opacity-100 hover:text-white transition-all duration-300 cursor-default">
                                {brand}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Right Gradient Fade */}
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-ticker {
          animation: ticker 25s linear infinite;
        }
      `}} />
        </section>
    );
}
