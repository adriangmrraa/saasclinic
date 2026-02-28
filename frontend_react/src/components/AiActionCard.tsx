import React from 'react';
import { Sparkles, Calendar, UserCheck, MessageSquare, Info } from 'lucide-react';

export type AiActionType = 'status_change' | 'meeting_booked' | 'lead_qualified' | 'lead_updated';

interface AiActionCardProps {
    title: string;
    summary: string;
    type: AiActionType;
    timestamp?: string;
    metadata?: Record<string, any>;
    onClick?: () => void;
}

const AiActionCard: React.FC<AiActionCardProps> = ({
    title,
    summary,
    type,
    timestamp,
    metadata,
    onClick
}) => {
    // Configuración de iconos y colores por tipo
    const typeConfigs = {
        meeting_booked: {
            icon: <Calendar className="w-4 h-4 text-emerald-400" />,
            badge: "Cita Agendada",
            badgeClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        },
        lead_qualified: {
            icon: <Sparkles className="w-4 h-4 text-purple-400" />,
            badge: "Lead Calificado",
            badgeClass: "bg-purple-500/10 text-purple-400 border-purple-500/20"
        },
        status_change: {
            icon: <UserCheck className="w-4 h-4 text-blue-400" />,
            badge: "Handoff Humano",
            badgeClass: "bg-blue-500/10 text-blue-400 border-blue-500/20"
        },
        lead_updated: {
            icon: <MessageSquare className="w-4 h-4 text-slate-400" />,
            badge: "Actualización IA",
            badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }
    };

    const config = typeConfigs[type] || {
        icon: <Info className="w-4 h-4 text-slate-400" />,
        badge: "Acción IA",
        badgeClass: "bg-slate-500/10 text-slate-400 border-slate-500/20"
    };

    return (
        <div
            onClick={onClick}
            className={`
        relative group overflow-hidden
        bg-[#120D1F] border border-purple-500/30 rounded-xl p-4
        hover:border-purple-500/60 transition-all duration-300
        cursor-pointer shadow-lg shadow-purple-900/10
        backdrop-blur-sm
      `}
        >
            {/* Glow Effect */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-600/10 blur-3xl group-hover:bg-purple-600/20 transition-all duration-500"></div>

            <div className="flex items-start gap-4">
                {/* Icon Container */}
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-900/30 border border-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white/90 truncate">
                            {title}
                        </h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.badgeClass} whitespace-nowrap`}>
                            {config.badge}
                        </span>
                    </div>

                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed italic">
                        "{summary}"
                    </p>

                    {/* Metadata / Details */}
                    <div className="mt-3 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 text-[10px] text-white/40">
                            {config.icon}
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                        </div>

                        {timestamp && (
                            <span className="text-[10px] text-white/30 ml-auto font-mono">
                                {timestamp}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiActionCard;
