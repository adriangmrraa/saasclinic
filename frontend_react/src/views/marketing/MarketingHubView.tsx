import { useState, useEffect } from 'react';
import { Megaphone, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../../api/axios';
import PageHeader from '../../components/PageHeader';
import { useTranslation } from '../../context/LanguageContext';
import MarketingPerformanceCard from '../../components/marketing/MarketingPerformanceCard';
import MetaConnectionWizard from '../../components/marketing/MetaConnectionWizard';
import { getCurrentTenantId } from '../../api/axios';
import { useSearchParams } from 'react-router-dom';

export default function MarketingHubView() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const [stats, setStats] = useState<any>(null);
    const [isMetaConnected, setIsMetaConnected] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [timeRange, setTimeRange] = useState('all');
    const [activeTab, setActiveTab] = useState<'campaigns' | 'ads'>('campaigns');

    useEffect(() => {
        loadStats();

        // Manejo de errores de Meta OAuth
        const error = searchParams.get('error');
        if (error) {
            const errorMessages: Record<string, string> = {
                'missing_tenant': t('marketing.errors.missing_tenant'),
                'auth_failed': t('marketing.errors.auth_failed'),
                'token_exchange_failed': t('marketing.errors.token_exchange_failed')
            };
            alert(errorMessages[error] || `${t('common.error')}: ${error}`);
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('error');
            setSearchParams(newParams);
        }

        // Detectar si venimos de un login exitoso de Meta
        if (searchParams.get('success') === 'connected') {
            setIsWizardOpen(true);
            // Limpiar el parámetro de la URL
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('success');
            setSearchParams(newParams);
        }

        // Detectar si queremos iniciar reconexión automática desde el banner
        if (searchParams.get('reconnect') === 'true') {
            handleConnectMeta();
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('reconnect');
            setSearchParams(newParams);
        }
    }, [searchParams, timeRange]);

    const loadStats = async () => {
        try {
            const { data } = await api.get(`/crm/marketing/stats?range=${timeRange}`);
            console.log("[MarketingHub] Stats data loaded:", data);
            setStats(data.data || data);
            setIsMetaConnected(data?.data?.meta_connected || data?.meta_connected || false);
        } catch (error) {
            console.error("Error loading marketing stats:", error);
        }
    };

    const handleConnectMeta = async () => {
        try {
            const tenantId = getCurrentTenantId();
            const { data } = await api.get(`/crm/auth/meta/url?state=tenant_${tenantId}`);
            const authUrl = data?.data?.auth_url || data?.url || data?.auth_url;
            if (authUrl) {
                // Redirigir a la página de OAuth de Meta
                window.location.href = authUrl;
            } else {
                console.error("No auth_url in response:", data);
                alert(t('marketing.errors.init_failed'));
            }
        } catch (error) {
            console.error("Error initiating Meta OAuth:", error);
            alert(t('marketing.errors.init_failed'));
        }
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-[#050505] text-white">
            <div className="p-4 sm:p-6 pb-24 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 scroll-smooth">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <PageHeader
                        title={t('nav.marketing')}
                        subtitle={t('marketing.subtitle')}
                        icon={<Megaphone size={24} />}
                    />

                    <div className="flex flex-wrap items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-md">
                        {[
                            { id: 'last_30d', label: t('marketing.range_30d') },
                            { id: 'last_90d', label: t('marketing.range_90d') },
                            { id: 'this_year', label: t('marketing.range_year') },
                            { id: 'all', label: t('marketing.range_all') }
                        ].map(range => (
                            <button
                                key={range.id}
                                onClick={() => setTimeRange(range.id)}
                                className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${timeRange === range.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Real ROI Card - Main Metric */}
                    <div className="lg:col-span-2">
                        <MarketingPerformanceCard stats={stats?.roi} loading={!stats} timeRange={timeRange} />
                    </div>

                    {/* Connection Status Card */}
                    <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 shadow-xl flex flex-col justify-between group hover:bg-white/[0.04] transition-all">
                        <div>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-white flex items-center gap-3 text-lg">
                                    <div className={`p-2 rounded-xl ${isMetaConnected ? 'bg-blue-500/10' : 'bg-gray-500/10'}`}>
                                        <RefreshCw size={20} className={isMetaConnected ? "text-blue-400 animate-spin-slow" : "text-gray-500"} />
                                    </div>
                                    {t('marketing.meta_connection')}
                                </h3>
                                <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border ${isMetaConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                    {isMetaConnected ? t('marketing.connected_active') : t('marketing.connected_disconnected')}
                                </span>
                            </div>
                            <p className="text-sm text-gray-400 leading-relaxed mb-8">
                                {isMetaConnected
                                    ? t('marketing.connected_desc')
                                    : t('marketing.disconnected_desc')}
                            </p>
                        </div>

                        <button
                            onClick={handleConnectMeta}
                            className={`w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 transition-all ${isMetaConnected
                                ? "bg-white/5 text-white border border-white/10 hover:bg-white/10"
                                : "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                                }`}
                        >
                            <ExternalLink size={18} /> {isMetaConnected ? t('marketing.reconnect') : t('marketing.connect')}
                        </button>
                    </div>
                </div>



                {/* Campaign/Ad Table with Tabs */}
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl shadow-xl overflow-hidden mb-12 backdrop-blur-md">
                    <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white/5">
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
                            <button
                                onClick={() => setActiveTab('campaigns')}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'campaigns'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {t('marketing.tabs.campaigns')}
                            </button>
                            <button
                                onClick={() => setActiveTab('ads')}
                                className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'ads'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {t('marketing.tabs.creatives')}
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            <span className="text-sm text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('marketing.period_label')}: {timeRange.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto whitespace-nowrap scrollbar-hide w-full max-w-full">
                        {/* Desktop Table View */}
                        <table className="hidden lg:table w-full text-left border-separate border-spacing-0 min-w-[800px]">
                            <thead className="bg-gray-900/50 text-gray-400 text-[10px] uppercase font-bold tracking-[0.2em] sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-5 border-b border-white/10 w-1/3">
                                        {activeTab === 'campaigns' ? t('marketing.table_campaign_ad') : t('marketing.table_ad')}
                                    </th>
                                    <th className="px-6 py-5 border-b border-white/10">{t('marketing.table_spend')}</th>
                                    <th className="px-6 py-5 border-b border-white/10">{t('marketing.table_leads')}</th>
                                    <th className="px-6 py-5 border-b border-white/10">{t('marketing.table_appts')}</th>
                                    <th className="px-6 py-5 text-blue-400 border-b border-white/10">{t('marketing.table_roi')}</th>
                                    <th className="px-6 py-5 border-b border-white/10">{t('marketing.table_status')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {(activeTab === 'campaigns' ? stats?.campaigns?.campaigns : stats?.campaigns?.creatives)?.map((c: any) => (
                                    <tr key={c.ad_id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="font-bold text-white group-hover:text-blue-400 transition-colors">{c.ad_name}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{c.campaign_name}</div>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-gray-300">
                                            {stats.currency === 'ARS' ? 'ARS' : '$'} {Number(c.spend || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 font-bold text-gray-300">{c.leads}</td>
                                        <td className="px-6 py-5">
                                            <span className="font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                                                {c.opportunities}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1.5 rounded-xl font-black text-xs border ${c.roi >= 0
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-500/5'
                                                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                                                {c.roi > 0 ? '+' : ''}{Math.round(c.roi * 100)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] ${c.status === 'active' ? 'text-emerald-400' : (c.status === 'paused' || c.status === 'archived') ? 'text-amber-400' : 'text-gray-500'}`}>
                                                <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : (c.status === 'paused' || c.status === 'archived') ? 'bg-amber-500' : 'bg-gray-700'}`}></div>
                                                {c.status || 'Unknown'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Mobile Cards View (Stacking Pattern) */}
                        <div className="lg:hidden divide-y divide-white/5">
                            {(activeTab === 'campaigns' ? stats?.campaigns?.campaigns : stats?.campaigns?.creatives)?.map((c: any) => (
                                <div key={c.ad_id} className="p-6 space-y-5 hover:bg-white/[0.04] transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="font-bold text-white text-lg leading-tight mb-1 group-hover:text-blue-400 transition-colors">{c.ad_name}</div>
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{c.campaign_name}</div>
                                        </div>
                                        <span className={`flex items-center gap-2 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${c.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-gray-500 border-white/10'}`}>
                                            <div className={`w-2 h-2 rounded-full ${c.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-gray-700'}`}></div>
                                            {c.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-2">
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-1">{t('marketing.table_spend')}</div>
                                            <div className="font-bold text-white">{stats.currency === 'ARS' ? 'ARS' : '$'}{Number(c.spend || 0).toLocaleString()}</div>
                                        </div>
                                        <div className="bg-blue-500/5 p-3 rounded-2xl border border-blue-500/10">
                                            <div className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.1em] mb-1">{t('marketing.table_roi')}</div>
                                            <div className={`font-black ${c.roi >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                                                {c.roi > 0 ? '+' : ''}{Math.round(c.roi * 100)}%
                                            </div>
                                        </div>
                                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-1">{t('marketing.table_leads')}</div>
                                            <div className="font-bold text-white">{c.leads}</div>
                                        </div>
                                        <div className="bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                                            <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.1em] mb-1">{t('marketing.table_appts')}</div>
                                            <div className="font-black text-emerald-400">{c.opportunities}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {!(activeTab === 'campaigns' ? stats?.campaigns?.campaigns : stats?.campaigns?.creatives)?.length && (
                            <div className="px-6 py-32 text-center text-gray-500 italic bg-white/[0.01]">
                                <Megaphone className="w-16 h-16 mx-auto mb-6 text-gray-800 opacity-30" />
                                <p className="text-lg font-medium">{t('marketing.no_data')}</p>
                                <p className="text-sm text-gray-600 mt-2 not-italic tracking-tight">Sincroniza tu cuenta de Meta para ver el rendimiento.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-20" /> {/* Spacer for extra breathing room at the bottom */}

                <MetaConnectionWizard
                    isOpen={isWizardOpen}
                    onClose={() => setIsWizardOpen(false)}
                    onSuccess={loadStats}
                />
            </div>
        </div>
    );
}
