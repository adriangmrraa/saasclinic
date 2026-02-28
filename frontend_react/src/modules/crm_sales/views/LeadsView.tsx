import { useState, useEffect, Component, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Search, MessageSquare, Edit, Loader2, AlertCircle, UserPlus,
  Star, Mail, MapPin, Building2, Globe, Instagram, Facebook, Linkedin, ExternalLink,
  History, MessageCircle, CheckCircle2, Layers, Check
} from 'lucide-react';
import api from '../../../api/axios';
import { useTranslation } from '../../../context/LanguageContext';
import { LeadStatusSelector } from '../../../components/leads/LeadStatusSelector';
import { LeadStatusBadge } from '../../../components/leads/LeadStatusBadge';
import { BulkStatusUpdate } from '../../../components/leads/BulkStatusUpdate';

const CRM_LEADS_BASE = '/admin/core/crm/leads';
const STATUS_OPTIONS = ['new', 'contacted', 'interested', 'negotiation', 'closed_won', 'closed_lost'] as const;

export interface Lead {
  id: string;
  tenant_id: number;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status: string;
  source?: string;
  assigned_seller_id?: string;
  tags?: string[];
  // Prospecting fields
  apify_title?: string;
  apify_category_name?: string;
  apify_address?: string;
  apify_city?: string;
  apify_state?: string;
  apify_website?: string;
  apify_rating?: number;
  apify_reviews?: number;
  social_links?: Record<string, string>;
  outreach_message_content?: string;
  outreach_last_sent_at?: string;
  outreach_message_sent?: boolean;
  created_at: string;
  updated_at: string;
}

const defaultForm = {
  phone_number: '',
  first_name: '',
  last_name: '',
  email: '',
  status: 'new' as const,
};

// ─── Error Boundary ───────────────────────────────────────────────
class LeadsErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">Error al cargar Leads</h2>
          <p className="text-sm text-gray-500 max-w-md font-mono bg-red-50 p-3 rounded-lg border border-red-100">{this.state.error}</p>
          <button
            className="mt-4 px-4 py-2 bg-medical-600 text-white rounded-lg text-sm font-bold hover:bg-medical-700"
            onClick={() => window.location.reload()}
          >Recargar página</button>
        </div>
      );
    }
    return this.props.children;
  }
}
// ──────────────────────────────────────────────────────────────────

export default function LeadsView() {
  return <LeadsErrorBoundary><LeadsViewInner /></LeadsErrorBoundary>;
}

function LeadsViewInner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'messages' | 'prospecting'>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleConvertToClient = async (e: React.MouseEvent, lead: Lead) => {
    e.stopPropagation();
    if (!window.confirm(t('leads.confirm_convert_to_client'))) return;
    setConvertingId(lead.id);
    try {
      await api.post(`${CRM_LEADS_BASE}/${lead.id}/convert-to-client`);
      await fetchLeads();
      navigate('/crm/clientes');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : t('leads.error_convert_to_client');
      alert(msg);
    } finally {
      setConvertingId(null);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, string | number> = { limit: 500, offset: 0 };
      if (statusFilter) params.status = statusFilter;
      const response = await api.get<Lead[]>(CRM_LEADS_BASE, { params });
      setLeads(Array.isArray(response.data) ? response.data : []);
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
      let message = 'Failed to load leads.';
      if (ax.response) {
        const rawDetail = ax.response.data?.detail;
        const detail = Array.isArray(rawDetail)
          ? rawDetail.map((d: { msg?: string; loc?: string[] }) => `${d.loc?.join('.') ?? ''}: ${d.msg ?? JSON.stringify(d)}`).join(' | ')
          : (typeof rawDetail === 'string' ? rawDetail : rawDetail ? JSON.stringify(rawDetail) : '');
        message = detail || (ax.response.status === 401 ? 'Session expired. Please log in again.' : ax.response.status === 403 ? 'You do not have access.' : `Error ${ax.response.status}.`);

      } else if (ax.message) {
        message = ax.message.includes('Network') || ax.message.includes('CORS') || ax.message.includes('Failed to fetch')
          ? 'Cannot reach the server. Ensure the backend is running and CORS allows this origin (redeploy if needed).'
          : String(ax.message);
      }
      setError(message);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    // Filter by Tab
    if (activeTab === 'all') return true;
    if (activeTab === 'messages' && lead.source !== 'whatsapp_inbound' && lead.source !== 'whatsapp') return false;
    if (activeTab === 'prospecting' && lead.source !== 'apify_scrape') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ').toLowerCase();
    return (
      name.includes(term) ||
      (lead.phone_number || '').includes(term) ||
      (lead.email || '').toLowerCase().includes(term)
    );
  });

  const handleOpenModal = (lead: Lead | null = null) => {
    if (lead) {
      setEditingLead(lead);
      setFormData({
        phone_number: lead.phone_number,
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        status: (lead.status as typeof defaultForm.status) || 'new',
      });
    } else {
      setEditingLead(null);
      setFormData(defaultForm);
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      if (editingLead) {
        await api.put(`${CRM_LEADS_BASE}/${editingLead.id}`, {
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          email: formData.email || null,
          status: formData.status,
        });
      } else {
        if (!formData.phone_number.trim()) {
          setModalError('Phone number is required.');
          return;
        }
        await api.post(CRM_LEADS_BASE, {
          phone_number: formData.phone_number.trim(),
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          email: formData.email || undefined,
          status: formData.status,
        });
      }
      await fetchLeads();
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : editingLead ? 'Failed to update lead' : 'Failed to create lead';
      setModalError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden bg-[#050505]">
      {/* FIXED TITLE BAR */}
      <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/10 bg-[#050505]/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{t('nav.leads')}</h1>
            <p className="text-sm text-gray-400 font-medium">{leads.length} {leads.length === 1 ? 'lead' : 'leads'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="lg:hidden inline-flex items-center p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* SCROLLABLE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-4 lg:p-6 space-y-6">
          {/* SEARCH & FILTERS BAR (Scrolls with content) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <div className="relative flex-1 lg:max-w-md group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#121212] border border-gray-800 text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-600"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {selectedLeads.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/10 text-blue-400 border border-blue-500/30 rounded-xl hover:bg-blue-600/20 text-sm font-bold transition-all shadow-lg shadow-blue-500/5 animate-in fade-in slide-in-from-left-2"
                >
                  <Layers size={18} />
                  <span className="hidden sm:inline">Actualización Masiva</span>
                  <span className="bg-blue-500 text-[10px] px-2 py-0.5 rounded-full ml-1 text-white">
                    {selectedLeads.length}
                  </span>
                </button>
              )}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-[#121212] border border-gray-800 rounded-xl text-sm text-gray-300 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium min-w-[160px] appearance-none cursor-pointer hover:border-gray-700"
              >
                <option value="" className="bg-[#121212]">Todos los estados</option>
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} className="bg-[#121212]">{s.replace('_', ' ')}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleOpenModal(null)}
                className="hidden lg:inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 text-sm font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
              >
                <Plus size={18} />
                Añadir Lead
              </button>
            </div>
          </div>
        </div>

        {/* TABS (integrated into scroll) */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md mb-6 mx-4 lg:mx-6">
          <div className="flex overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3.5 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'all'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`flex-1 py-3.5 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'messages'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
            >
              Mensajes
            </button>
            <button
              onClick={() => setActiveTab('prospecting')}
              className={`flex-1 py-3.5 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'prospecting'
                ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
            >
              Prospección
            </button>
          </div>

          {activeTab === 'prospecting' && (
            <div className="p-3 bg-blue-500/5 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest pl-2">Opciones de prospección</span>
              <button
                onClick={() => navigate('/crm/prospeccion')}
                className="text-[10px] font-bold uppercase tracking-wider text-white bg-blue-600/20 hover:bg-blue-600/40 px-4 py-2 rounded-lg border border-blue-500/30 transition-all shadow-lg shadow-blue-500/5"
              >
                Ir a Prospección →
              </button>
            </div>
          )}
        </div>

        {/* LEAD LIST SECTION */}
        <div className="px-4 lg:px-6 pb-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center gap-3">
              <AlertCircle size={18} />
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <p className="text-sm font-medium animate-pulse">{t('common.loading')}</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-md">
              <Users className="w-16 h-16 text-gray-800 mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-400">No leads yet.</p>
              <button
                type="button"
                onClick={() => handleOpenModal(null)}
                className="mt-4 text-blue-400 hover:text-blue-300 font-bold transition-colors"
              >
                Add your first lead
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto whitespace-nowrap scrollbar-hide w-full max-w-full pb-2">
              <ul className="space-y-4 min-w-[700px]">
                {filteredLeads.map((lead) => {
                  if (!lead || !lead.id) return null;
                  const isSelected = selectedLeads.includes(lead.id);
                  const safeName = [lead.first_name, lead.last_name].filter(Boolean).join(' ') || String(lead.phone_number || '—');
                  const businessName = lead.apify_title || (lead.source === 'apify_scrape' ? 'Negocio Desconocido' : null);
                  const displayName = businessName || safeName;
                  const firstChar = String(displayName).charAt(0).toUpperCase() || '?';

                  return (
                    <li
                      key={lead.id}
                      className={`group relative bg-white/[0.02] border ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/10' : 'border-white/10'} rounded-2xl p-4 lg:p-5 hover:bg-white/[0.04] hover:border-white/20 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 active:scale-[0.99] backdrop-blur-md`}
                      onClick={() => handleOpenModal(lead)}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Selection Checkbox */}
                        <div
                          className={`shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-[#121212] border-gray-700 opacity-0 group-hover:opacity-100'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLeads(prev =>
                              prev.includes(lead.id)
                                ? prev.filter(id => id !== lead.id)
                                : [...prev, lead.id]
                            );
                          }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </div>

                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-inner group-hover:scale-105 transition-transform">
                          <span className="text-blue-400 font-bold text-xl">
                            {firstChar}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-lg tracking-tight">
                            {displayName}
                          </p>
                          {businessName && (
                            <p className="text-xs text-blue-400 font-bold truncate mb-0.5 tracking-wide">
                              {safeName !== businessName ? safeName : String(lead.phone_number || '')}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 font-medium truncate">{String(lead.phone_number || '')}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                        <div className="flex flex-col items-start sm:items-end" onClick={(e) => e.stopPropagation()}>
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] leading-none mb-2">Status</span>
                          <LeadStatusSelector
                            leadId={lead.id}
                            currentStatusCode={lead.status}
                            onChangeSuccess={fetchLeads}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleConvertToClient(e, lead)}
                            disabled={convertingId === lead.id}
                            className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
                            title={t('leads.convert_to_client')}
                          >
                            {convertingId === lead.id ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/chats', { state: { selectPhone: lead.phone_number } });
                            }}
                            className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-all"
                            title="Open chat"
                          >
                            <MessageSquare size={20} />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className={`bg-[#151515] rounded-3xl border border-white/10 shadow-2xl w-full ${editingLead?.source === 'apify_scrape' ? 'max-w-4xl' : 'max-w-md'} max-h-[90vh] flex flex-col overflow-hidden`}>
              <div className="p-6 border-b border-white/10 shrink-0 flex items-center justify-between bg-white/5">
                <h2 className="text-xl font-bold flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    {editingLead ? <Edit className="text-blue-400" size={20} /> : <Plus className="text-blue-400" size={20} />}
                  </div>
                  {editingLead ? (editingLead.source === 'apify_scrape' ? 'Business Detail' : 'Edit lead') : 'New lead'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 bg-[#0d0d0d]">
                <div className={`p-6 lg:p-8 ${editingLead?.source === 'apify_scrape' ? 'grid grid-cols-1 lg:grid-cols-2 gap-10' : 'space-y-6'}`}>
                  {/* LEFT COLUMN: Basic Form */}
                  <div className="space-y-6">
                    {modalError && (
                      <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm border border-red-500/20 animate-shake">
                        <AlertCircle size={18} /> {modalError}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-2xl border border-blue-500/20 shadow-inner">
                        {(formData.first_name || editingLead?.apify_title || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">
                          {editingLead?.apify_title || (formData.first_name ? `${formData.first_name} ${formData.last_name}` : editingLead?.phone_number)}
                        </h3>
                        {editingLead?.source === 'apify_scrape' && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-lg border border-blue-400/20 mt-1 inline-block">Prospección</span>
                        )}
                      </div>
                    </div>

                    <form id="lead-form" onSubmit={handleModalSubmit} className="space-y-5">
                      {!editingLead && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Phone number *</label>
                          <input
                            required
                            type="tel"
                            placeholder="+1 234 567 890"
                            className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">First name</label>
                          <input
                            type="text"
                            placeholder="John"
                            className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                            value={formData.first_name}
                            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Last name</label>
                          <input
                            type="text"
                            placeholder="Doe"
                            className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                            value={formData.last_name}
                            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Email</label>
                        <div className="relative group">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 group-focus-within:text-blue-400 transition-colors" />
                          <input
                            type="email"
                            placeholder="john@example.com"
                            className="w-full pl-10 pr-4 py-3 bg-[#121212] border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">Status</label>
                        <select
                          className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof defaultForm.status })}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s} className="bg-[#151515]">{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </form>
                  </div>

                  {/* RIGHT COLUMN: Business Intelligence (Only for apify_scrape) */}
                  {editingLead?.source === 'apify_scrape' && (
                    <div className="space-y-8">
                      <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/10 space-y-6 backdrop-blur-sm shadow-inner">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-white/5 pb-3 flex items-center gap-3">
                          <Building2 size={18} className="text-blue-400" />
                          Business Insights
                        </h4>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Rating</p>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <Star size={16} className="text-amber-500 fill-current" />
                                <span className="text-xl font-bold text-white leading-none">{editingLead.apify_rating?.toFixed(1) || '—'}</span>
                              </div>
                              <span className="text-xs text-gray-500">({editingLead.apify_reviews || 0} reviews)</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1.5">Categoría</p>
                            <p className="text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 inline-block">{editingLead.apify_category_name || '—'}</p>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="group">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                              <MapPin size={14} className="group-hover:text-blue-400 transition-colors" />
                              Dirección
                            </p>
                            <p className="text-sm text-gray-300 leading-relaxed pl-5">
                              {editingLead.apify_address || `${editingLead.apify_city || '—'}, ${editingLead.apify_state || ''}`}
                            </p>
                          </div>

                          {editingLead.apify_website && (
                            <div>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                                <Globe size={14} />
                                Sitio Web
                              </p>
                              <a
                                href={editingLead.apify_website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-400 font-bold bg-blue-400/5 px-4 py-2 rounded-xl border border-blue-500/20 inline-flex items-center gap-2 hover:bg-blue-400/10 transition-all group ml-5"
                              >
                                {editingLead.apify_website.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </a>
                            </div>
                          )}

                          <div>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-3">Redes Sociales</p>
                            <div className="flex gap-4 pl-5">
                              {editingLead.social_links?.instagram ? (
                                <a href={editingLead.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-pink-500/10 rounded-xl border border-pink-500/20 text-gray-400 hover:text-pink-500 hover:scale-110 transition-all">
                                  <Instagram size={22} />
                                </a>
                              ) : <Instagram size={22} className="opacity-10" />}
                              {editingLead.social_links?.facebook ? (
                                <a href={editingLead.social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-blue-600/10 rounded-xl border border-blue-500/20 text-gray-400 hover:text-blue-500 hover:scale-110 transition-all">
                                  <Facebook size={22} />
                                </a>
                              ) : <Facebook size={22} className="opacity-10" />}
                              {editingLead.social_links?.linkedin ? (
                                <a href={editingLead.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-blue-700/10 rounded-xl border border-blue-700/20 text-gray-400 hover:text-blue-600 hover:scale-110 transition-all">
                                  <Linkedin size={22} />
                                </a>
                              ) : <Linkedin size={22} className="opacity-10" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Outreach History Section */}
                      <div className="bg-emerald-500/5 rounded-2xl p-6 border border-emerald-500/20 space-y-4 backdrop-blur-sm shadow-inner overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
                        <h4 className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-[0.2em] border-b border-emerald-500/10 pb-3 flex items-center gap-3 relative z-10">
                          <History size={18} className="text-emerald-400" />
                          Auditoría de Outreach
                        </h4>

                        {editingLead.outreach_message_sent ? (
                          <div className="space-y-5 relative z-10">
                            <div className="flex items-center gap-3 text-emerald-400 font-bold text-xs uppercase tracking-[0.1em]">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"></div>
                              Mensaje Enviado
                            </div>
                            <div className="bg-[#000]/30 p-4 rounded-xl border border-emerald-500/20">
                              <p className="text-[10px] text-emerald-500/60 font-bold uppercase mb-2 tracking-widest pl-1">Contenido / Plantilla</p>
                              <p className="text-sm text-gray-300 italic leading-relaxed pl-1">
                                "{editingLead.outreach_message_content || 'First Contact Template'}"
                              </p>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-emerald-400/70 pt-2 font-medium">
                              <span>Fecha de envío</span>
                              <span className="font-bold text-emerald-400">
                                {editingLead.outreach_last_sent_at ? new Date(editingLead.outreach_last_sent_at).toLocaleString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center relative z-10">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                              <MessageCircle size={32} className="text-emerald-500/30" />
                            </div>
                            <p className="text-sm text-emerald-400/50 italic font-medium">No hay registros de contacto previa.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 shrink-0 flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-full sm:flex-1 py-3.5 text-gray-400 font-bold hover:bg-white/5 rounded-2xl transition-all border border-white/10"
                >
                  {t('common.cancel')}
                </button>
                <button
                  // Link with form tag via id
                  form="lead-form"
                  type="submit"
                  disabled={saving}
                  className="w-full sm:flex-[2] py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  {saving ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      {editingLead ? 'Update Lead' : t('common.save')}
                      {!editingLead && <Plus size={18} />}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isBulkModalOpen && (
          <BulkStatusUpdate
            selectedLeadIds={selectedLeads}
            onSuccess={() => {
              setIsBulkModalOpen(false);
              setSelectedLeads([]);
              fetchLeads();
            }}
            onCancel={() => setIsBulkModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
