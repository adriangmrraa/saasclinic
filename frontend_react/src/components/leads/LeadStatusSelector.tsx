import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../context/LanguageContext';
import { useLeadStatus } from '../../hooks/useLeadStatus';
import { LeadStatusBadge } from './LeadStatusBadge';
import { ChevronDown, Loader2 } from 'lucide-react';
import type { LeadStatus, LeadStatusTransition } from '../../api/leadStatus';

interface LeadStatusSelectorProps {
    leadId: string;
    currentStatusCode: string;
    onChangeSuccess?: () => void;
}

/**
 * Componente que renderiza un Dropdown para cambiar el estado.
 * Cumple la regla de Scroll Isolation y valida los comentarios antes del disparo.
 */
export const LeadStatusSelector: React.FC<LeadStatusSelectorProps> = ({
    leadId,
    currentStatusCode,
    onChangeSuccess
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [commentRequired, setCommentRequired] = useState(false);
    const [commentValue, setCommentValue] = useState('');
    const [pendingStatusCode, setPendingStatusCode] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const {
        statuses,
        transitions,
        isLoadingTransitions,
        changeStatusAsync,
        isUpdating
    } = useLeadStatus(leadId);

    // Scroll Isolation (Close on outside click)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setCommentRequired(false);
                setPendingStatusCode(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusSelect = (toStatusCode: string) => {
        const targetStatusDef = statuses?.find((s: LeadStatus) => s.code === toStatusCode);
        if (targetStatusDef?.requires_comment) {
            setPendingStatusCode(toStatusCode);
            setCommentRequired(true);
            return; // Stop here and wait for comment form submission
        }

        // Direct submission
        submitStatusChange(toStatusCode);
    };

    const submitStatusChange = async (targetCode: string) => {
        try {
            await changeStatusAsync({ leadId, status: targetCode, comment: commentValue });
            setIsOpen(false);
            setCommentRequired(false);
            setPendingStatusCode(null);
            setCommentValue('');
            if (onChangeSuccess) onChangeSuccess();
        } catch (e) {
            // Error is handled inside the hook via Toast
        }
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                onMouseEnter={() => !isOpen && !isLoadingTransitions && leadId && setIsOpen(false)} // Prefetch hint if wanted via onMouse, disabled due to enabled=!!leadId
                onClick={() => setIsOpen(!isOpen)}
                disabled={isUpdating}
                className="flex items-center gap-1.5 focus:outline-none transition-transform hover:scale-105"
            >
                <LeadStatusBadge statusCode={currentStatusCode} />
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500 hover:text-gray-800 transition-colors" />}
            </button>

            {/* Menú Flotante */}
            {isOpen && (
                <div
                    className="absolute z-[9999] mt-2 w-64 rounded-2xl shadow-2xl bg-[#151515] border border-white/10 ring-1 ring-white/5 origin-top-right right-0 transform opacity-100 scale-100 transition-all backdrop-blur-xl"
                >
                    {commentRequired ? (
                        <div className="p-4">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">{t('leads.status_selector.comment_required')}</p>
                            <textarea
                                className="w-full text-sm bg-[#0d0d0d] border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 p-3 shadow-inner mb-4 resize-none placeholder-gray-700"
                                rows={3}
                                value={commentValue}
                                onChange={(e) => setCommentValue(e.target.value)}
                                placeholder={t('leads.status_selector.reason_placeholder')}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setCommentRequired(false)}
                                    className="text-xs font-bold text-gray-500 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    disabled={!commentValue.trim() || isUpdating}
                                    onClick={() => pendingStatusCode && submitStatusChange(pendingStatusCode)}
                                    className="text-xs font-bold text-white bg-blue-600 px-5 py-2 rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-all active:scale-95"
                                >
                                    {t('common.confirm') || 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar" role="menu">
                            <div className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] border-b border-white/5 mb-2">
                                {t('leads.status_selector.change_status')}
                            </div>

                            {isLoadingTransitions ? (
                                <div className="px-4 py-6 flex flex-col items-center justify-center text-gray-500 text-xs gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                    <span className="animate-pulse">{t('leads.status_selector.evaluating_workflow')}</span>
                                </div>
                            ) : transitions && transitions.length > 0 ? (
                                <div className="space-y-1 px-2">
                                    {transitions.map((transition: LeadStatusTransition) => (
                                        <button
                                            key={transition.id}
                                            onClick={(e) => { e.stopPropagation(); handleStatusSelect(transition.to_status_code); }}
                                            className="w-full text-left flex items-center px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl group transition-all"
                                            role="menuitem"
                                        >
                                            <div className="flex flex-col w-full">
                                                <div className="flex items-center">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full mr-3 shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                                        style={{ backgroundColor: transition.to_status_color, boxShadow: `0 0 10px ${transition.to_status_color}40` }}
                                                    />
                                                    <span className="font-bold tracking-tight">{transition.to_status_name}</span>
                                                </div>
                                                <span className="text-[10px] text-gray-500 ml-5.5 mt-0.5 font-medium group-hover:text-blue-400 transition-colors opacity-70">
                                                    {transition.label}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-6 text-center text-xs text-gray-500 italic">
                                    {t('leads.status_selector.no_valid_transitions')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
