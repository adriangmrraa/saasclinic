import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  MessageSquare,
  CalendarCheck,
  Activity,
  DollarSign,
  Clock,
  ArrowUpRight,
  User,
  Users,
  Target,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import api, { BACKEND_URL } from '../api/axios';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import WelcomeModal from './WelcomeModal';
import OnboardingChecklist from './OnboardingChecklist';

// ============================================
// INTERFACES & TYPES
// ============================================

// Interface para stats DENTAL (existente)
interface DentalAnalyticsStats {
  ia_conversations: number;
  ia_appointments: number;
  active_urgencies: number;
  total_revenue: number;
  growth_data: { date: string; ia_referrals: number; completed_appointments: number }[];
}

// Interface para stats CRM (nuevo)
interface CrmAnalyticsStats {
  total_leads: number;
  total_clients: number;
  active_leads: number;
  converted_leads: number;
  total_revenue: number;
  conversion_rate: number;
  recent_leads: Array<{
    id: string;
    name: string;
    phone: string;
    status: string;
    source: string;
    niche: string;
    created_at: string;
  }>;
}

// Tipo unificado
type AnalyticsStats = DentalAnalyticsStats | CrmAnalyticsStats;

interface UrgencyRecord {
  id: string;
  patient_name: string;
  phone: string;
  urgency_level: 'CRITICAL' | 'HIGH' | 'NORMAL';
  reason: string;
  timestamp: string;
}

interface RecentLeadRecord {
  id: string;
  name: string;
  phone: string;
  status: string;
  source: string;
  niche: string;
  created_at: string;
}

// ============================================
// COMPONENTS
// ============================================

const KPICard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 group hover:bg-white/[0.04] hover:border-white/20">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform border border-white/5`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
          <TrendingUpIcon size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-gray-400 text-sm font-medium tracking-tight uppercase tracking-[0.1em] text-[10px]">{title}</p>
    <h3 className="text-3xl font-bold text-white mt-1 tracking-tighter">{value}</h3>
  </div>
);

const UrgencyBadge = ({ level }: { level: UrgencyRecord['urgency_level'] }) => {
  const styles = {
    CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    NORMAL: 'bg-green-500/10 text-green-400 border-green-500/20'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[level]}`}>
      {level}
    </span>
  );
};

// ============================================
// MAIN VIEW
// ============================================

export default function DashboardView() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Determinar el nicho basado en el usuario
  const nicheType = user?.niche_type || 'dental';
  const isCrmSales = nicheType === 'crm_sales';

  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [urgencies, setUrgencies] = useState<UrgencyRecord[]>([]);
  const [recentLeads, setRecentLeads] = useState<RecentLeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Conectar WebSocket
    socketRef.current = io(BACKEND_URL);

    // 2. Escuchar nuevos turnos/mensajes para actualización en vivo
    socketRef.current.on('NEW_APPOINTMENT', () => {
      setStats((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          ia_appointments: (prev.ia_appointments || 0) + 1
        };
      });
    });

    const loadDashboardData = async (range: string) => {
      try {
        setLoading(true);

        if (isCrmSales) {
          // Cargar datos para CRM Sales
          const [statsRes, recentLeadsRes] = await Promise.all([
            api.get(`/admin/core/crm/stats/summary?range=${range}`),
            api.get('/admin/core/crm/leads?limit=5&offset=0')
          ]);

          setStats(statsRes.data);
          setRecentLeads(statsRes.data.recent_leads || []);
          setUrgencies([]); // No hay urgencias en CRM

        } else {
          // Cargar datos para Dental (existente)
          const [statsRes, urgenciesRes] = await Promise.all([
            api.get(`/admin/core/stats/summary?range=${range}`),
            api.get('/admin/core/chat/urgencies')
          ]);

          setStats(statsRes.data);
          setUrgencies(urgenciesRes.data);
          setRecentLeads([]);
        }

      } catch (error) {
        console.error('Error loading analytics:', error);

        if (isCrmSales) {
          setStats({
            total_leads: 0,
            total_clients: 0,
            active_leads: 0,
            converted_leads: 0,
            total_revenue: 0,
            conversion_rate: 0,
            recent_leads: []
          });
          setRecentLeads([]);
        } else {
          setStats({
            ia_conversations: 0,
            ia_appointments: 0,
            active_urgencies: 0,
            total_revenue: 0,
            growth_data: [],
          });
        }
        setUrgencies([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData(timeRange);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [timeRange]); // Re-run effect when timeRange changes to fetch new data

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 shadow-lg shadow-blue-500/20"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* HEADER SECTION */}
      <header className="p-4 sm:p-6 shrink-0 bg-[#050505]/50 backdrop-blur-md border-b border-white/10">
        <PageHeader
          title={t('dashboard.analytics_title')}
          subtitle={t('dashboard.analytics_subtitle')}
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('weekly')}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${timeRange === 'weekly'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-[#121212] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                  }`}
              >
                {t('dashboard.weekly')}
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${timeRange === 'monthly'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-[#121212] text-gray-400 border-gray-800 hover:text-white hover:border-gray-700'
                  }`}
              >
                {t('dashboard.monthly')}
              </button>
            </div>
          }
        />
      </header>

      {/* MAIN SCROLLABLE CONTENT WITH ISORATION */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scroll-smooth relative">

        <WelcomeModal isTrial={(user as any)?.subscription_status === 'trial'} />

        {/* TOP ROW: KPI CARDS AND ONBOARDING FOR NEW USERS */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {isCrmSales ? (
              // KPIs para CRM Sales
              <>
                <KPICard
                  title="Total Leads"
                  value={(stats as CrmAnalyticsStats)?.total_leads || 0}
                  icon={Users}
                  color="bg-blue-500"
                  trend="+12%"
                />
                <KPICard
                  title="Active Leads"
                  value={(stats as CrmAnalyticsStats)?.active_leads || 0}
                  icon={Activity}
                  color="bg-emerald-500"
                  trend="+5%"
                />
                <KPICard
                  title="Conversion Rate"
                  value={`${(stats as CrmAnalyticsStats)?.conversion_rate || 0}%`}
                  icon={Target}
                  color="bg-amber-500"
                />
                <KPICard
                  title="Total Revenue"
                  value={`$${((stats as CrmAnalyticsStats)?.total_revenue || 0).toLocaleString()}`}
                  icon={DollarSign}
                  color="bg-purple-500"
                  trend="+8%"
                />
              </>
            ) : (
              // KPIs para Dental (existente)
              <>
                <KPICard
                  title={t('dashboard.conversations')}
                  value={(stats as DentalAnalyticsStats)?.ia_conversations || 0}
                  icon={MessageSquare}
                  color="bg-blue-500"
                  trend="+12%"
                />
                <KPICard
                  title={t('dashboard.ia_appointments')}
                  value={(stats as DentalAnalyticsStats)?.ia_appointments || 0}
                  icon={CalendarCheck}
                  color="bg-emerald-500"
                  trend="+5%"
                />
                <KPICard
                  title={t('dashboard.urgencies')}
                  value={(stats as DentalAnalyticsStats)?.active_urgencies || 0}
                  icon={Activity}
                  color="bg-rose-500"
                />
                <KPICard
                  title={t('dashboard.revenue')}
                  value={`$${(stats as DentalAnalyticsStats)?.total_revenue?.toLocaleString() || 0}`}
                  icon={DollarSign}
                  color="bg-amber-500"
                  trend="+8%"
                />
              </>
            )}
          </div>
          {/* Onboarding checklist placed next to KPI cards for trial users */}
          {(user as any)?.subscription_status === 'trial' && (
            <OnboardingChecklist />
          )}
        </div>

        {/* MIDDLE ROW: CHARTS */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {isCrmSales ? 'Leads Overview' : t('dashboard.chart_title')}
              </h2>
              {!isCrmSales && (
                <div className="hidden sm:flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> {t('dashboard.referrals')}</span>
                  <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> {t('dashboard.completed')}</span>
                </div>
              )}
            </div>
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              {isCrmSales ? (
                <div className="h-full flex items-center justify-center border border-white/5 bg-white/5 rounded-2xl border-dashed">
                  <div className="text-center">
                    <TrendingUpIcon className="w-12 h-12 text-blue-500/20 mx-auto mb-3 animate-pulse" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{t('dashboard.chart_coming_soon') || 'Leads Analytics Coming Soon'}</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <AreaChart data={(stats as DentalAnalyticsStats)?.growth_data ?? []}>
                    <defs>
                      <linearGradient id="colorIA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDone" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#151515', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="ia_referrals" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIA)" />
                    <Area type="monotone" dataKey="completed_appointments" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDone)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: RECENT ITEMS TABLE */}
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col mb-8">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {isCrmSales ? 'Recent Leads' : t('dashboard.urgencies_recent')}
            </h2>
            <button className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors px-3 py-2">
              {isCrmSales ? 'See All Leads' : t('dashboard.see_all')}
            </button>
          </div>
          <div className="overflow-x-auto">
            {isCrmSales ? (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-900/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Lead</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Phone</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Source</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Created</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all border border-white/5 group-hover:border-blue-500/30">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{lead.name}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{lead.niche || 'General'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-mono tracking-tight">{lead.phone}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${lead.status === 'new' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          lead.status === 'contacted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            lead.status === 'qualified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 font-medium">{lead.source}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-600" />
                          <span className="font-medium text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-500 hover:text-blue-400 transition-all">
                          <ArrowUpRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentLeads.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-600 font-medium italic">
                        No recent leads found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-900/50">
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">{t('dashboard.patient')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">{t('dashboard.reason')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">{t('dashboard.severity')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">{t('dashboard.time')}</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {urgencies.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all border border-white/5 group-hover:border-blue-500/30">
                            <User size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{u.patient_name}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{u.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300 font-bold">{u.reason}</td>
                      <td className="px-6 py-4">
                        <UrgencyBadge level={u.urgency_level} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-gray-600" />
                          <span className="font-medium text-gray-400">{u.timestamp}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-500 hover:text-blue-400 transition-all">
                          <ArrowUpRight size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
