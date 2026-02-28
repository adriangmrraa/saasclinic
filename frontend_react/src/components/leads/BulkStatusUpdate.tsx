import React, { useState } from 'react';
import { Layers, Loader2, Info } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';
import { useLeadStatus } from '../../hooks/useLeadStatus';
import { LeadStatusBadge } from './LeadStatusBadge';
import type { LeadStatus } from '../../api/leadStatus';

interface BulkStatusUpdateProps {
    selectedLeadIds: string[];
    onSuccess: () => void;
    onCancel: () => void;
}

export const BulkStatusUpdate: React.FC<BulkStatusUpdateProps> = ({
    selectedLeadIds,
    onSuccess,
    onCancel
}) => {
    const [targetStatus, setTargetStatus] = useState<string>('');
    const [comment, setComment] = useState<string>('');
    const { statuses, isLoadingStatuses, bulkChangeStatus, isUpdating } = useLeadStatus();
    const { t } = useTranslation();

    // Obtenemos solo los activos para el Dropdown
    const activeStatuses = statuses?.filter((s: LeadStatus) => s.is_active) || [];
    const selectedStatusDef = activeStatuses.find((s: LeadStatus) => s.code === targetStatus);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetStatus) return;

        try {
            await bulkChangeStatus({
                leadIds: selectedLeadIds,
                status: targetStatus,
                comment: comment || undefined
            });
            onSuccess();
        } catch (e) {
            console.error(e);
            // El hook Toast ya maneja el error genéricamente
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#151515] rounded-3xl border border-white/10 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div className="flex items-center gap-3 text-white font-bold tracking-tight">
                        <Layers className="w-5 h-5 text-blue-400" />
                        {t('leads.bulk_update.title')}
                    </div>
                    <span className="bg-blue-500/10 text-blue-400 py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">
                        {selectedLeadIds.length} {t('leads.bulk_update.selected')}
                    </span>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-6">

                        {/* Disclaimer */}
                        <div className="bg-blue-500/5 text-blue-300 p-4 rounded-2xl flex gap-3 text-sm border border-blue-500/10 items-start italic leading-relaxed">
                            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p>{t('leads.bulk_update.warning')}</p>
                        </div>

                        {/* Selector de Nuevo Estado */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{t('leads.bulk_update.new_status')}</label>
                            {isLoadingStatuses ? (
                                <div className="text-sm text-gray-500 flex items-center gap-2 px-4 py-3 bg-[#121212] border border-gray-800 rounded-xl"><Loader2 className="animate-spin w-4 h-4" />{t('leads.bulk_update.loading_motors')}</div>
                            ) : (
                                <select
                                    className="w-full text-sm border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 p-3 bg-[#121212] text-white transition-all cursor-pointer appearance-none"
                                    value={targetStatus}
                                    onChange={(e) => setTargetStatus(e.target.value)}
                                    required
                                >
                                    <option value="" disabled className="bg-[#151515]">{t('leads.bulk_update.select_status')}</option>
                                    {activeStatuses.map((status: LeadStatus) => (
                                        <option key={status.id} value={status.code} className="bg-[#151515]">{status.name}</option>
                                    ))}
                                </select>
                            )}
                            {selectedStatusDef && (
                                <div className="mt-3 text-[10px] text-gray-500 flex items-center gap-2 border-l-2 border-white/10 pl-3 ml-1 italic font-medium">
                                    {t('leads.bulk_update.preview')} <LeadStatusBadge statusCode={selectedStatusDef.code} />
                                </div>
                            )}
                        </div>

                        {/* Comentario (Opcional/Obligatorio) */}
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                                {t('leads.bulk_update.reason_or_comment')} {selectedStatusDef?.requires_comment ? <span className="text-red-500">*</span> : <span className="text-gray-600 font-normal italic">{t('leads.bulk_update.optional')}</span>}
                            </label>
                            <textarea
                                className="w-full text-sm border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 p-4 bg-[#121212] text-white transition-all custom-scrollbar resize-none placeholder-gray-700"
                                rows={3}
                                placeholder={t('leads.bulk_update.reason_placeholder')}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required={selectedStatusDef?.requires_comment}
                            />
                        </div>

                    </div>

                    {/* Footer actions */}
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isUpdating}
                            className="w-full sm:flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-white/10 disabled:opacity-50"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={!targetStatus || isUpdating || (selectedStatusDef?.requires_comment && !comment.trim())}
                            className="w-full sm:flex-[2] py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center active:scale-[0.98]"
                        >
                            {isUpdating ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('leads.bulk_update.processing')}</>
                            ) : (
                                t('leads.bulk_update.apply_all')
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};
