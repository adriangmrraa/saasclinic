import { useEffect, useMemo, useState } from 'react';
import {
  Search, Send, Play, CheckCircle2, AlertCircle, Loader2,
  Globe, Instagram, Facebook, Filter, X,
  Mail, Star, MapPin, ChevronUp, ChevronDown, Phone
} from 'lucide-react';
import api from '../../../api/axios';
import { useTranslation } from '../../../context/LanguageContext';

type TenantOption = {
  id: number;
  clinic_name: string;
};

type ProspectLead = {
  id: string;
  tenant_id: number;
  phone_number: string;
  first_name?: string;
  apify_title?: string;
  apify_category_name?: string;
  apify_city?: string;
  apify_state?: string;
  apify_website?: string;
  email?: string;
  apify_total_score?: number;
  apify_reviews_count?: number;
  apify_rating?: number;
  apify_reviews?: number;
  apify_address?: string;
  social_links?: Record<string, string>;
  outreach_message_sent: boolean;
  outreach_send_requested: boolean;
  updated_at: string;
};

type WhatsAppTemplate = {
  name: string;
  status: string;
  language: string;
  category: string;
};

export default function ProspectingView() {
  const { t } = useTranslation();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [tenantId, setTenantId] = useState<number | null>(null);
  const [niche, setNiche] = useState('');
  const [location, setLocation] = useState('');
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [maxPlaces, setMaxPlaces] = useState(30);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [requestingSend, setRequestingSend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [leads, setLeads] = useState<ProspectLead[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, value]) => value).map(([id]) => id),
    [selected],
  );

  const loadTenants = async () => {
    try {
      setLoadingTenants(true);
      const res = await api.get<TenantOption[]>('/admin/core/chat/tenants');
      const rows = Array.isArray(res.data) ? res.data : [];
      setTenants(rows);
      if (rows.length > 0) {
        setTenantId((prev) => prev ?? rows[0].id);
      }
    } catch {
      setError(t('prospecting.errorLoadingEntities'));
    } finally {
      setLoadingTenants(false);
    }
  };

  const loadLeads = async (targetTenantId?: number) => {
    const resolvedTenantId = targetTenantId ?? tenantId;
    if (!resolvedTenantId) return;
    try {
      setLoadingLeads(true);
      const res = await api.get<ProspectLead[]>('/admin/core/crm/prospecting/leads', {
        params: {
          tenant_id_override: resolvedTenantId,
          only_pending: false,
          limit: 300,
          offset: 0,
        },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      setLeads(rows);
      setSelected({});
    } catch {
      setError(t('prospecting.errorLoadingLeads'));
    } finally {
      setLoadingLeads(false);
    }
  };

  const loadTemplates = async () => {
    if (!tenantId) return;
    try {
      setLoadingTemplates(true);
      const res = await api.get<{ items: WhatsAppTemplate[] }>('/admin/core/crm/prospecting/templates');
      setTemplates(res.data.items || []);
      if (res.data.items?.length > 0) {
        setSelectedTemplate(res.data.items[0].name);
      } else {
        setSelectedTemplate('');
      }
    } catch {
      console.error('Error loading templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  useEffect(() => {
    if (tenantId) {
      loadLeads(tenantId);
      loadTemplates();
    }
  }, [tenantId]);

  const handleScrape = async () => {
    if (!tenantId || !niche.trim() || !location.trim()) {
      setError(t('prospecting.errorMissingFields'));
      return;
    }
    try {
      setError(null);
      setSuccess(null);
      setScraping(true);
      const res = await api.post('/admin/core/crm/prospecting/scrape', {
        tenant_id: tenantId,
        niche: niche.trim(),
        location: location.trim(),
        max_places: maxPlaces,
      }, { timeout: 300000 }); // 5 minutes timeout for scraping
      await loadLeads(tenantId);
      const total = res.data?.total_results ?? 0;
      const imported = res.data?.imported ?? res.data?.imported_or_updated ?? 0;
      const skipped = res.data?.skipped_already_exists ?? 0;
      const fromWeb = res.data?.fetched_from_web ?? 0;
      setSuccess(
        t('prospecting.scrapeSuccess', { total, imported, skipped, fromWeb }),
      );
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || t('prospecting.errorScraping'));
    } finally {
      setScraping(false);
    }
  };

  const handleRequestSend = async (mode: 'selected' | 'pending_all') => {
    if (!tenantId) return;
    try {
      setError(null);
      setSuccess(null);
      setRequestingSend(true);
      const payload =
        mode === 'selected'
          ? {
            tenant_id: tenantId,
            lead_ids: selectedIds,
            only_pending: true,
            template_name: selectedTemplate || undefined
          }
          : {
            tenant_id: tenantId,
            only_pending: true,
            template_name: selectedTemplate || undefined
          };
      const res = await api.post('/admin/core/crm/prospecting/request-send', payload);
      await loadLeads(tenantId);
      const count = res.data?.updated ?? 0;
      if (selectedTemplate) {
        setSuccess(t('prospecting.statusSending') + ` (${count} leads)`);
      } else {
        setSuccess(t('prospecting.sendQueued', { count }));
      }
    } catch {
      setError(t('prospecting.errorSendRequest'));
    } finally {
      setRequestingSend(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-gray-200 overflow-hidden">
      {/* FIXED TITLE BAR */}
      <div
        onClick={() => {
          if (window.innerWidth < 1024) setIsHeaderExpanded(!isHeaderExpanded);
        }}
        className="flex items-center justify-between p-4 lg:p-6 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 shrink-0 z-20 cursor-pointer lg:cursor-default"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <Search className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">{t('nav.prospecting')}</h1>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mt-0.5">
              {leads.length} {t('prospecting.subtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsHeaderExpanded(!isHeaderExpanded);
          }}
          className="p-2 hover:bg-white/5 rounded-xl transition-all text-gray-400 border border-transparent hover:border-white/10 group"
          title={isHeaderExpanded ? "Colapsar filtros" : "Expandir filtros"}
        >
          {isHeaderExpanded ?
            <ChevronUp size={24} className="group-hover:text-blue-400 transition-colors" /> :
            <ChevronDown size={24} className="group-hover:text-blue-400 transition-colors" />
          }
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 bg-[#050505] custom-scrollbar">
        {/* COLLAPSIBLE FILTERS & ACTIONS BAR */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden border-b border-white/5 bg-white/[0.01] backdrop-blur-sm
          ${isHeaderExpanded ? 'max-h-[800px] opacity-100 p-4 lg:p-8' : 'max-h-0 opacity-0 p-0'}`}
        >
          <div className="max-w-7xl mx-auto space-y-8">
            {/* FILTERS & ACTIONS BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Entidad</label>
                <select
                  className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer hover:bg-[#1a1a1a]"
                  value={tenantId ?? ''}
                  disabled={loadingTenants}
                  onChange={(e) => setTenantId(Number(e.target.value))}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.clinic_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{t('prospecting.niche')}</label>
                <input
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:bg-[#1a1a1a]"
                  placeholder={t('prospecting.nichePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">{t('prospecting.location')}</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none hover:bg-[#1a1a1a]"
                  placeholder={t('prospecting.locationPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Cant. Resultados</label>
                <select
                  className="w-full px-4 py-3 bg-[#121212] border border-white/10 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer hover:bg-[#1a1a1a]"
                  value={maxPlaces}
                  onChange={(e) => setMaxPlaces(Number(e.target.value))}
                >
                  <option value={10}>10 resultados</option>
                  <option value={30}>30 resultados</option>
                  <option value={60}>60 resultados</option>
                  <option value={100}>100 resultados</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleScrape}
                  disabled={scraping || !niche || !location}
                  className="w-full h-[46px] flex items-center justify-center gap-3 px-6 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-30 transition-all font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {scraping ? 'Buscando...' : t('prospecting.runScrape')}
                </button>
              </div>
            </div>

            {/* Template & Send Mass Support */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50"></div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <span className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">Plan de Mensajes:</span>
                <div className="relative group">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="w-full sm:w-64 pl-4 pr-10 py-2.5 bg-[#121212] border border-white/10 rounded-xl text-xs text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-black uppercase tracking-widest transition-all cursor-pointer hover:bg-[#1a1a1a]"
                  >
                    {templates.length === 0 ? (
                      <option value="">{loadingTemplates ? t('common.loading') : t('prospecting.noTemplates')}</option>
                    ) : (
                      <>
                        <option value="">{t('prospecting.selectTemplate')}</option>
                        {templates.map((tpl) => (
                          <option key={tpl.name} value={tpl.name}>
                            {tpl.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                  <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50 pointer-events-none transition-colors group-hover:text-blue-400" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleRequestSend('selected')}
                  disabled={requestingSend || selectedIds.length === 0 || !selectedTemplate}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-30 transition-all font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-600/20 active:scale-95"
                >
                  {requestingSend ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {t('prospecting.sendSelected', { count: selectedIds.length })}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const toSelect: Record<string, boolean> = {};
                    leads.filter(l => !l.outreach_message_sent).forEach(l => toSelect[l.id] = true);
                    setSelected(toSelect);
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 bg-white/[0.02] border border-white/10 text-gray-300 rounded-xl hover:bg-white/[0.05] transition-all text-[10px] font-black uppercase tracking-[0.15em] hover:text-white active:scale-95"
                >
                  Auto-selección
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
          {error && (
            <div className="px-6 py-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-2 bg-red-500/20 rounded-xl">
                <AlertCircle size={20} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          )}
          {success && (
            <div className="px-6 py-4 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <CheckCircle2 size={20} />
              </div>
              <p className="text-xs font-black uppercase tracking-widest">{success}</p>
              <button onClick={() => setSuccess(null)} className="ml-auto p-2 hover:bg-blue-500/10 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          )}

          {loadingLeads ? (
            <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="font-medium">{t('prospecting.loadingLeads')}</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-white/10">
                      <th className="px-6 py-4 w-12 text-left">
                        <input
                          type="checkbox"
                          checked={leads.length > 0 && selectedIds.length === leads.length}
                          onChange={(e) => {
                            const next: Record<string, boolean> = {};
                            if (e.target.checked) {
                              leads.forEach(l => next[l.id] = true);
                            }
                            setSelected(next);
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-blue-500/50 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('prospecting.colBusiness')}</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('prospecting.colPhone')}</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Email</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Rating</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Website</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Social</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">{t('prospecting.colStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="group hover:bg-white/[0.02] transition-all">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={Boolean(selected[lead.id])}
                            onChange={(e) => setSelected(prev => ({ ...prev, [lead.id]: e.target.checked }))}
                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-blue-500/50 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-black text-white group-hover:text-blue-400 transition-colors">{lead.apify_title || '—'}</div>
                          <div className="text-[10px] text-blue-500/50 font-black uppercase tracking-tighter mt-0.5">{lead.apify_category_name || '—'}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px] text-gray-400">{lead.phone_number}</td>
                        <td className="px-6 py-4">
                          {lead.email ? (
                            <div className="flex items-center gap-2 text-gray-500 italic text-[11px]">
                              <Mail size={12} className="text-blue-500/30" />
                              <span className="truncate max-w-[120px]" title={lead.email}>{lead.email}</span>
                            </div>
                          ) : <span className="text-gray-800">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {lead.apify_rating ? (
                            <div className="flex items-center gap-1.5 text-amber-500/80 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10">
                              <Star size={12} className="fill-current" />
                              <span className="font-black text-[11px]">{lead.apify_rating.toFixed(1)}</span>
                            </div>
                          ) : <span className="text-gray-800">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {lead.apify_website ? (
                            <a href={lead.apify_website} target="_blank" rel="noopener noreferrer" className="p-2 bg-white/[0.02] text-gray-500 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 border border-white/5 hover:border-blue-500/20 transition-all inline-block shadow-lg">
                              <Globe size={16} />
                            </a>
                          ) : <span className="text-gray-800">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {lead.social_links?.instagram && (
                              <a href={lead.social_links.instagram} target="_blank" rel="noopener noreferrer" className="p-2 text-pink-500/50 hover:text-pink-400 hover:bg-pink-500/5 rounded-xl border border-transparent hover:border-pink-500/20 transition-all">
                                <Instagram size={16} />
                              </a>
                            )}
                            {lead.social_links?.facebook && (
                              <a href={lead.social_links.facebook} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-500/50 hover:text-blue-400 hover:bg-blue-500/5 rounded-xl border border-transparent hover:border-blue-500/20 transition-all">
                                <Facebook size={16} />
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {lead.outreach_message_sent ? (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] border border-blue-500/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]">{t('prospecting.statusSent')}</span>
                          ) : lead.outreach_send_requested ? (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-[0.2em] border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">{t('prospecting.statusRequested')}</span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-white/[0.02] text-gray-500 text-[9px] font-black uppercase tracking-[0.2em] border border-white/10">{t('prospecting.statusPending')}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="lg:hidden space-y-4">
                {leads.map((lead) => (
                  <div
                    key={lead.id}
                    className={`bg-white/[0.02] border backdrop-blur-md rounded-3xl p-6 shadow-2xl transition-all relative overflow-hidden group active:scale-[0.98] ${selected[lead.id] ? 'border-blue-500/50 shadow-blue-500/10' : 'border-white/10'}`}
                    onClick={() => setSelected((prev) => ({ ...prev, [lead.id]: !prev[lead.id] }))}
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <input
                        type="checkbox"
                        checked={Boolean(selected[lead.id])}
                        onChange={() => { }} // Controlled by div click
                        className="w-5 h-5 rounded border-white/20 bg-black/40 text-blue-600 shadow-inner"
                      />
                    </div>

                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-lg group-hover:bg-blue-500/20 transition-all duration-500">
                        <span className="text-blue-400 font-black text-xl">{(lead.apify_title || '—').charAt(0)}</span>
                      </div>
                      <div className="pr-8">
                        <h3 className="font-black text-white text-lg leading-tight group-hover:text-blue-400 transition-colors">
                          {lead.apify_title || '—'}
                        </h3>
                        <p className="text-[10px] font-black text-blue-500/50 uppercase tracking-[0.2em] mt-1.5 font-mono">
                          {lead.apify_category_name || '—'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Contacto</span>
                        <div className="text-xs font-mono text-gray-300 flex items-center gap-2">
                          <Phone size={12} className="text-blue-500" />
                          {lead.phone_number}
                        </div>
                      </div>
                      {lead.apify_rating && (
                        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-1">
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Reputación</span>
                          <div className="flex items-center gap-1.5 text-amber-500">
                            <Star size={12} className="fill-current" />
                            <span className="text-xs font-black">{lead.apify_rating.toFixed(1)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-6 text-xs text-gray-400 bg-white/[0.01] p-3 rounded-2xl border border-dashed border-white/5">
                      <MapPin size={14} className="text-blue-500/50" />
                      <span className="truncate">{lead.apify_city || lead.apify_address || '—'}</span>
                    </div>

                    <div className="flex items-center justify-between pt-5 border-t border-white/5">
                      <div className="flex gap-2">
                        {lead.apify_website && (
                          <a
                            href={lead.apify_website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-white/[0.02] text-gray-500 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 border border-white/10 transition-all hover:scale-110 active:scale-95 shadow-xl"
                          >
                            <Globe size={18} />
                          </a>
                        )}
                        {lead.social_links?.instagram && (
                          <a
                            href={lead.social_links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-3 bg-white/[0.02] text-pink-500/50 rounded-xl hover:bg-pink-500/10 hover:text-pink-400 border border-white/10 transition-all hover:scale-110 active:scale-95 shadow-xl"
                          >
                            <Instagram size={18} />
                          </a>
                        )}
                      </div>
                      <div>
                        {lead.outreach_message_sent ? (
                          <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">{t('prospecting.statusSent')}</span>
                        ) : lead.outreach_send_requested ? (
                          <span className="px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-[0.2em] border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">{t('prospecting.statusRequested')}</span>
                        ) : (
                          <span className="px-4 py-1.5 rounded-full bg-white/5 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">{t('prospecting.statusPending')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {leads.length === 0 && (
                <div className="py-32 text-center animate-in fade-in zoom-in duration-500">
                  <div className="inline-flex p-8 rounded-[40px] bg-blue-500/5 text-blue-500/20 border border-blue-500/10 shadow-[inner_0_0_40px_rgba(0,0,0,0.2)] mb-8">
                    <Search size={80} strokeWidth={1} />
                  </div>
                  <p className="text-2xl font-black text-gray-700 uppercase tracking-widest">{t('prospecting.noLeads')}</p>
                  <p className="text-gray-500 mt-2 max-w-xs mx-auto text-sm">{t('prospecting.subtitle')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
