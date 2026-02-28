import { useEffect, useState } from 'react';
import {
  Users,
  UserCheck,
  Target,
  DollarSign,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Phone,
  Building,
  MapPin,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';

// ============================================
// INTERFACES & TYPES
// ============================================

interface CrmDashboardStats {
  total_leads: number;
  total_clients: number;
  active_leads: number;
  converted_leads: number;
  total_revenue: number;
  conversion_rate: number;
  revenue_leads_trend: Array<{
    month: string;
    revenue: number;
    leads: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
    color: string;
  }>;
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

// interfaces for dashboard data mapping are managed in CrmDashboardStats

// ============================================
// COMPONENTS
// ============================================

const KPICard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6 transition-all duration-300 group hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] hover:border-white/20">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform border border-white/5`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 uppercase tracking-wider">
          <TrendingUp size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.15em]">{title}</p>
    <h3 className="text-3xl font-bold text-white mt-1 tracking-tighter">{value}</h3>
  </div>
);

import { LeadStatusBadge } from '../components/leads/LeadStatusBadge';
import { BulkStatusUpdate } from '../components/leads/BulkStatusUpdate';
import { LeadHistoryTimeline } from '../components/leads/LeadHistoryTimeline';

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    'new': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'contacted': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'interested': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'negotiation': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'closed_won': 'bg-green-500/10 text-green-400 border-green-500/20',
    'closed_lost': 'bg-red-500/10 text-red-400 border-red-500/20',
    'default': 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  };

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[status] || styles.default}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

// ============================================
// MAIN VIEW
// ============================================

export default function CrmDashboardView() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<CrmDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [historyModalLead, setHistoryModalLead] = useState<{ id: string, name: string } | null>(null);

  const isAdvancedLeadStatusEnabled = import.meta.env.VITE_ENABLE_ADVANCED_LEAD_STATUS === 'true';

  const toggleLeadSelection = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedLeads.length === stats?.recent_leads?.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(stats?.recent_leads?.map(l => l.id) || []);
    }
  };

  useEffect(() => {
    const loadDashboardData = async (range: string) => {
      try {
        setLoading(true);
        const statsRes = await api.get('/admin/core/crm/stats/summary', { params: { range } });
        setStats(statsRes.data);
      } catch (error) {
        console.error('Error loading CRM dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData(timeRange);
  }, [timeRange]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 shadow-lg shadow-blue-600/20"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden">
      {/* HEADER SECTION */}
      <header className="p-4 sm:p-6 shrink-0 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <PageHeader
          title="CRM Sales Dashboard"
          subtitle="Real-time sales pipeline monitoring and analytics"
          action={
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('weekly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${timeRange === 'weekly'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${timeRange === 'monthly'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20'
                  : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
              >
                Monthly
              </button>
            </div>
          }
        />
      </header>

      {/* MAIN SCROLLABLE CONTENT */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scroll-smooth">

        {/* TOP ROW: KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Leads"
            value={stats?.total_leads || 0}
            icon={Users}
            color="bg-blue-500"
            trend="+12%"
          />
          <KPICard
            title="Active Leads"
            value={stats?.active_leads || 0}
            icon={UserCheck}
            color="bg-emerald-500"
            trend="+8%"
          />
          <KPICard
            title="Conversion Rate"
            value={`${stats?.conversion_rate || 0}%`}
            icon={Target}
            color="bg-amber-500"
            trend="+2.5%"
          />
          <KPICard
            title="Total Revenue"
            value={`$${(stats?.total_revenue || 0).toLocaleString()}`}
            icon={DollarSign}
            color="bg-purple-500"
            trend="+15%"
          />
        </div>

        {/* MIDDLE ROW: CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Status Distribution */}
          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">Lead Status Distribution</h2>
              <Filter size={18} className="text-gray-500" />
            </div>
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <PieChart>
                  <Pie
                    data={stats?.status_distribution || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }: any) => `${status}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    stroke="rgba(255,255,255,0.1)"
                  >
                    {(stats?.status_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151515', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any, name) => [`${value} leads`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Trend */}
          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">Revenue & Leads Trend</h2>
              <div className="hidden sm:flex gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> Revenue</span>
                <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Leads</span>
              </div>
            </div>
            <div className="h-[300px] min-h-[300px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart data={stats?.revenue_leads_trend || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#151515', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value: any, name) => {
                      if (name === 'revenue' && value != null) return [`$${value.toLocaleString()}`, 'Revenue'];
                      return [value, 'Leads'];
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leads" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: RECENT LEADS */}
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col mb-4">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Leads</h2>
              {isAdvancedLeadStatusEnabled && selectedLeads.length > 0 && (
                <div className="animate-in fade-in slide-in-from-left-4 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
                    {selectedLeads.length} seleccionados
                  </span>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="text-white text-[10px] font-bold hover:bg-blue-600 bg-blue-700 px-4 py-1.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all border border-blue-500/30 uppercase tracking-widest"
                  >
                    Actualizar Masivo
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/crm/leads')}
              className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors px-3 py-2"
            >
              See All Leads
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-900/50">
                  {isAdvancedLeadStatusEnabled && (
                    <th className="px-6 py-4 w-12 text-center text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-700 bg-[#121212] text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedLeads.length > 0 && selectedLeads.length === (stats?.recent_leads ? stats.recent_leads.length : 0)}
                        onChange={toggleAllSelection}
                      />
                    </th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Lead</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Source</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Niche</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10">Created</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-white/10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(stats?.recent_leads || []).map((lead) => (
                  <tr key={lead.id} className={`hover:bg-white/[0.02] transition-colors group ${selectedLeads.includes(lead.id) && isAdvancedLeadStatusEnabled ? 'bg-blue-600/5' : ''}`}>
                    {isAdvancedLeadStatusEnabled && (
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-700 bg-[#121212] text-blue-600 focus:ring-blue-500 cursor-pointer"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleLeadSelection(lead.id)}
                        />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all border border-white/5 group-hover:border-blue-500/30">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{lead.name}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {lead.id.substring(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-300 font-mono tracking-tight">
                          <Phone size={14} className="text-gray-600" />
                          {lead.phone}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          {lead.source === 'website' ? <Building size={12} /> :
                            lead.source === 'meta_ads' ? <TrendingUp size={12} /> :
                              <UserCheck size={12} />}
                          {lead.source.replace('_', ' ')}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isAdvancedLeadStatusEnabled ? (
                        <LeadStatusBadge statusCode={lead.status} />
                      ) : (
                        <StatusBadge status={lead.status} />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">
                      <span className="capitalize">{lead.source}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin size={14} className="text-gray-600" />
                        {lead.niche}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock size={14} className="text-gray-600" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isAdvancedLeadStatusEnabled && (
                          <button
                            title="Ver Historial de Estados"
                            onClick={() => setHistoryModalLead({ id: lead.id, name: lead.name })}
                            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-500 hover:text-blue-400 transition-all"
                          >
                            <Clock size={18} />
                          </button>
                        )}
                        <button
                          title="Ver Detalles del Lead"
                          onClick={() => navigate(`/crm/leads/${lead.id}`)}
                          className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-gray-500 hover:text-blue-400 transition-all"
                        >
                          <ArrowUpRight size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(stats?.recent_leads || []).length === 0 && (
                  <tr>
                    <td colSpan={isAdvancedLeadStatusEnabled ? 8 : 7} className="px-6 py-12 text-center text-gray-600 font-medium italic">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={48} className="text-white/5" strokeWidth={1} />
                        <p className="text-lg font-bold text-gray-700 tracking-tight">No recent leads found</p>
                        <p className="text-sm text-gray-800">Start prospecting to see leads here</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Bulk Status Update Modal */}
      {isAdvancedLeadStatusEnabled && showBulkModal && (
        <BulkStatusUpdate
          selectedLeadIds={selectedLeads}
          onCancel={() => setShowBulkModal(false)}
          onSuccess={() => {
            setShowBulkModal(false);
            setSelectedLeads([]);
            // Force local manual reload since the hook query invalidation hits 'leads' rather than dashboard stats
            window.location.reload();
          }}
        />
      )}

      {/* Lead History Timeline Modal */}
      {isAdvancedLeadStatusEnabled && historyModalLead && (
        <LeadHistoryTimeline
          leadId={historyModalLead.id}
          leadName={historyModalLead.name}
          onClose={() => setHistoryModalLead(null)}
        />
      )}
    </div>
  );
}
