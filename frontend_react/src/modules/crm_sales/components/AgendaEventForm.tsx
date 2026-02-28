import React, { useState, useEffect } from 'react';
import { X, Calendar, User, FileText, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../context/LanguageContext';

export interface AgendaEventFormData {
  seller_id: number;
  title: string;
  start_datetime: string;
  end_datetime: string;
  notes: string;
}

export interface SellerOption {
  id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  is_active: boolean;
}

interface AgendaEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<AgendaEventFormData> & { id?: string };
  sellers: SellerOption[];
  onSubmit: (data: AgendaEventFormData) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isEditing: boolean;
}

const toLocalDatetimeInput = (isoOrDate: string | Date): string => {
  const d = new Date(isoOrDate);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AgendaEventForm({
  isOpen,
  onClose,
  initialData,
  sellers,
  onSubmit,
  onDelete,
  isEditing,
}: AgendaEventFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<AgendaEventFormData>({
    seller_id: 0,
    title: '',
    start_datetime: '',
    end_datetime: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const firstSellerId = sellers.length > 0 ? sellers[0].id : 0;
      setFormData({
        seller_id: initialData.seller_id || firstSellerId,
        title: initialData.title || '',
        start_datetime: initialData.start_datetime ? toLocalDatetimeInput(initialData.start_datetime) : '',
        end_datetime: initialData.end_datetime ? toLocalDatetimeInput(initialData.end_datetime) : '',
        notes: initialData.notes || '',
      });
      setError(null);
    }
  }, [isOpen, initialData, sellers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError(t('agenda_crm.title_required'));
      return;
    }
    if (!formData.start_datetime || !formData.end_datetime) {
      setError(t('agenda_crm.datetime_required'));
      return;
    }
    const start = new Date(formData.start_datetime);
    const end = new Date(formData.end_datetime);
    if (end <= start) {
      setError(t('agenda_crm.end_after_start'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        ...formData,
        start_datetime: start.toISOString(),
        end_datetime: end.toISOString(),
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || t('agenda_crm.save_error'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#151515] rounded-3xl border border-white/10 shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-bold text-white tracking-tight">
            {isEditing ? t('agenda_crm.form_edit') : t('agenda_crm.form_new')}
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
              {t('agenda_crm.seller')}
            </label>
            <div className="relative group">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <select
                value={formData.seller_id || ''}
                onChange={(e) => setFormData({ ...formData, seller_id: Number(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-[#151515]">{t('agenda_crm.select_seller')}</option>
                {sellers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#151515]">
                    {s.first_name} {s.last_name || ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
              {t('agenda_crm.title')} *
            </label>
            <div className="relative group">
              <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700 font-medium"
                placeholder={t('agenda_crm.title_placeholder')}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                {t('agenda_crm.start')} *
              </label>
              <input
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all [color-scheme:dark]"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
                {t('agenda_crm.end')} *
              </label>
              <input
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all [color-scheme:dark]"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">
              {t('agenda_crm.notes')}
            </label>
            <div className="relative group">
              <FileText size={16} className="absolute left-3.5 top-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none placeholder-gray-700 min-h-[100px] custom-scrollbar"
                rows={3}
                placeholder={t('agenda_crm.notes_placeholder')}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-4 border-t border-white/5">
            {isEditing && onDelete && initialData.id && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id!).then(() => onClose())}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-red-500/20 text-red-500 font-bold text-sm hover:bg-red-500/10 transition-all order-2 sm:order-1"
              >
                {t('agenda_crm.cancel_event')}
              </button>
            )}
            <div className="hidden sm:block flex-1 order-2" />
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-2xl border border-white/10 text-gray-400 font-bold text-sm hover:text-white hover:bg-white/5 transition-all"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {t('common.loading')}
                  </div>
                ) : t('agenda_crm.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
