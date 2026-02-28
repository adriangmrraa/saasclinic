import React, { useState, useEffect } from 'react';
import {
  Filter, Search, Download, Upload, UserPlus, MessageSquare,
  Phone, Mail, Calendar, Target, TrendingUp, Users,
  CheckCircle, XCircle, Clock, AlertCircle, Loader2,
  BarChart3, Facebook, ExternalLink, RefreshCw, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import SellerBadge from '../components/SellerBadge';
import SellerSelector from '../components/SellerSelector';

interface MetaLead {
  id: string;
  first_name?: string;
  last_name?: string;
  phone_number: string;
  email?: string;
  status: string;
  lead_source: string;
  campaign_name?: string;
  adset_name?: string;
  ad_name?: string;
  form_name?: string;
  created_at: string;
  assigned_seller_id?: string;
  assigned_seller_name?: string;
  assigned_seller_role?: string;
  notes?: string;
  is_demo?: boolean;
}

const DEMO_LEADS: MetaLead[] = [
  {
    id: 'demo-1',
    first_name: 'Juan',
    last_name: 'Pérez',
    phone_number: '+5491112345678',
    email: 'juanperez@example.com',
    status: 'new',
    lead_source: 'META_ADS',
    campaign_name: 'Campaña Dental Invierno',
    form_name: 'Formulario de Contacto Directo',
    created_at: new Date().toISOString(),
    is_demo: true
  },
  {
    id: 'demo-2',
    first_name: 'María',
    last_name: 'García',
    phone_number: '+5491187654321',
    email: 'mariagarcia@example.com',
    status: 'contacted',
    lead_source: 'META_ADS',
    campaign_name: 'Ortodoncia Invisible',
    form_name: 'Consulta Gratuita',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    is_demo: true
  },
  {
    id: 'demo-3',
    first_name: 'Carlos',
    last_name: 'López',
    phone_number: '+5491100001111',
    email: 'carloslopez@example.com',
    status: 'qualified',
    lead_source: 'META_ADS',
    campaign_name: 'Implantes Demo',
    form_name: 'Interés en Implantes',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    is_demo: true
  }
];

const MetaLeadsView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState<MetaLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showSellerSelector, setShowSellerSelector] = useState(false);
  const [selectedLeadForAssignment, setSelectedLeadForAssignment] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    converted: 0,
    today: 0
  });

  useEffect(() => {
    fetchMetaLeads();
  }, [statusFilter, dateFilter]);

  const fetchMetaLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        lead_source: 'META_ADS'
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (dateFilter !== 'all') {
        if (dateFilter === 'today') {
          params.created_after = new Date().toISOString().split('T')[0];
        } else if (dateFilter === 'week') {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          params.created_after = weekAgo.toISOString();
        } else if (dateFilter === 'month') {
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          params.created_after = monthAgo.toISOString();
        }
      }

      const response = await api.get('/admin/core/crm/leads', { params });

      // Robust handling of different API response formats
      let rawLeads: any[] = [];
      if (Array.isArray(response.data)) {
        rawLeads = response.data;
      } else if (response.data && response.data.success) {
        rawLeads = response.data.leads || [];
      } else if (response.data && response.data.leads) {
        rawLeads = response.data.leads;
      } else if (response.data) {
        // Handle single object response if happens
        rawLeads = [response.data];
      }

      const metaLeads = rawLeads.filter((lead: any) =>
        (lead.lead_source === 'META_ADS' || lead.lead_source === 'meta_ads') &&
        (lead.status !== 'deleted')
      );

      // If no real leads and no active filters/search, show demo leads
      if (metaLeads.length === 0 && searchQuery === '' && statusFilter === 'all' && dateFilter === 'all') {
        setLeads(DEMO_LEADS);
        calculateStats(DEMO_LEADS);
      } else {
        setLeads(metaLeads);
        calculateStats(metaLeads);
      }
    } catch (err: any) {
      console.error('Error fetching Meta leads:', err);
      // Don't show technical error if we can fallback to demo data
      if (leads.length === 0) {
        setLeads(DEMO_LEADS);
        calculateStats(DEMO_LEADS);
      } else {
        setError(err.response?.data?.detail || 'Error de conexión con el servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leadsData: MetaLead[]) => {
    const today = new Date().toISOString().split('T')[0];

    const statsData = {
      total: leadsData.length,
      new: leadsData.filter(lead => lead.status === 'new').length,
      contacted: leadsData.filter(lead => lead.status === 'contacted').length,
      converted: leadsData.filter(lead => lead.status === 'converted' || lead.status === 'closed_won').length,
      today: leadsData.filter(lead => lead.created_at.startsWith(today)).length
    };

    setStats(statsData);
  };

  const handleAssignSeller = async (leadId: string, sellerId: string, sellerName: string) => {
    try {
      const response = await api.put(`/admin/core/crm/leads/${leadId}`, {
        assigned_seller_id: sellerId
      });

      if (response.data.success) {
        // Actualizar localmente
        setLeads(prev => prev.map(lead =>
          lead.id === leadId
            ? {
              ...lead,
              assigned_seller_id: sellerId,
              assigned_seller_name: sellerName
            }
            : lead
        ));

        setSelectedLeadForAssignment(null);
        setShowSellerSelector(false);

        // Mostrar notificación
        // showToast({ type: 'success', message: `Lead asignado a ${sellerName}` });
      }
    } catch (err: any) {
      console.error('Error assigning seller to lead:', err);
      // showToast({ type: 'error', message: 'Error al asignar lead' });
    }
  };

  const handleBulkAssign = async (sellerId: string, sellerName: string) => {
    if (selectedLeads.length === 0) return;

    try {
      const promises = selectedLeads.map(leadId =>
        api.put(`/admin/core/crm/leads/${leadId}`, {
          assigned_seller_id: sellerId
        })
      );

      await Promise.all(promises);

      // Actualizar localmente
      setLeads(prev => prev.map(lead =>
        selectedLeads.includes(lead.id)
          ? {
            ...lead,
            assigned_seller_id: sellerId,
            assigned_seller_name: sellerName
          }
          : lead
      ));

      setSelectedLeads([]);
      // showToast({ type: 'success', message: `${selectedLeads.length} leads asignados a ${sellerName}` });
    } catch (err: any) {
      console.error('Error in bulk assign:', err);
      // showToast({ type: 'error', message: 'Error en asignación masiva' });
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const response = await api.put(`/admin/core/crm/leads/${leadId}`, {
        status: newStatus
      });

      if (response.data.success) {
        setLeads(prev => prev.map(lead =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
      }
    } catch (err: any) {
      console.error('Error updating lead status:', err);
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Nombre', 'Teléfono', 'Email', 'Estado', 'Campaña', 'Formulario', 'Asignado a', 'Fecha'],
      ...leads.map(lead => [
        `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Sin nombre',
        lead.phone_number,
        lead.email || '',
        lead.status,
        lead.campaign_name || '',
        lead.form_name || '',
        lead.assigned_seller_name || 'Sin asignar',
        new Date(lead.created_at).toLocaleDateString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meta-leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery ||
      (lead.first_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.last_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.phone_number.includes(searchQuery) ||
      (lead.email?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.campaign_name?.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'contacted': return 'bg-yellow-100 text-yellow-700';
      case 'qualified': return 'bg-purple-100 text-purple-700';
      case 'converted': return 'bg-green-100 text-green-700';
      case 'closed_won': return 'bg-green-100 text-green-700';
      case 'lost': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle size={14} />;
      case 'contacted': return <MessageSquare size={14} />;
      case 'qualified': return <Target size={14} />;
      case 'converted': return <CheckCircle size={14} />;
      case 'closed_won': return <CheckCircle size={14} />;
      case 'lost': return <XCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  if (loading && leads.length === 0) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="animate-spin mx-auto text-gray-400" size={32} />
        <p className="text-gray-500 text-sm mt-3">Cargando leads de Meta Ads...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-gray-200 overflow-hidden">
      {/* Header - Fixed */}
      <div className="p-4 md:p-6 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 flex-shrink-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]">
              <Facebook size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white leading-tight tracking-tight">FORMULARIO META</h1>
              <p className="text-sm text-gray-400 font-medium">Leads generados desde Meta Ads</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchMetaLeads}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Actualizar"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
        {/* Stats Cards - Adaptive Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-all duration-700"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Total Leads</p>
                <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                <BarChart3 size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-all duration-700"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Nuevos</p>
                <p className="text-3xl font-black text-white mt-1">{stats.new}</p>
              </div>
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                <AlertCircle size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-yellow-500/10 transition-all duration-700"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Contactados</p>
                <p className="text-3xl font-black text-white mt-1">{stats.contacted}</p>
              </div>
              <div className="p-2.5 bg-yellow-500/10 rounded-xl text-yellow-400 border border-yellow-500/20">
                <MessageSquare size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-emerald-500/10 transition-all duration-700"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Convertidos</p>
                <p className="text-3xl font-black text-white mt-1">{stats.converted}</p>
              </div>
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-5 shadow-2xl relative overflow-hidden group col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-purple-500/10 transition-all duration-700"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Hoy</p>
                <p className="text-3xl font-black text-white mt-1">{stats.today}</p>
              </div>
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                <Calendar size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions - Responsive */}
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-2xl p-4 md:p-6 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 relative z-10">
            <div className="flex-1">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono, campaña..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 focus:bg-black/60 transition-all outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:flex items-center gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="col-span-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-300 text-sm focus:ring-2 focus:ring-blue-500/30 outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
              >
                <option value="all">Todos los estados</option>
                <option value="new">Nuevo</option>
                <option value="contacted">Contactado</option>
                <option value="qualified">Calificado</option>
                <option value="converted">Convertido</option>
                <option value="lost">Perdido</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="col-span-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-gray-300 text-sm focus:ring-2 focus:ring-blue-500/30 outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
              >
                <option value="all">Todo el tiempo</option>
                <option value="today">Hoy</option>
                <option value="week">Esta semana</option>
                <option value="month">Este mes</option>
              </select>

              {selectedLeads.length > 0 && (
                <button
                  onClick={() => {
                    setSelectedLeadForAssignment(null); // Ensure bulk mode
                    setShowSellerSelector(true);
                  }}
                  className="col-span-2 lg:col-span-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:transform active:scale-95 font-black uppercase text-xs tracking-widest border border-blue-400/20"
                >
                  <UserPlus size={18} />
                  <span>Asignar ({selectedLeads.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Data View */}
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent"></div>
          {error ? (
            <div className="p-16 text-center">
              <div className="inline-flex p-5 rounded-3xl bg-red-500/10 text-red-400 mb-6 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
                <AlertCircle size={48} />
              </div>
              <p className="text-white font-black uppercase tracking-widest mb-2">{error}</p>
              <p className="text-gray-500 text-sm mb-6">Ha ocurrido un error al cargar la información.</p>
              <button
                onClick={fetchMetaLeads}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 font-black uppercase text-xs tracking-[0.2em]"
              >
                Reintentar
              </button>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex p-5 rounded-3xl bg-blue-500/10 text-blue-400 mb-6 border border-blue-500/20 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
                <Users size={48} />
              </div>
              <p className="text-white font-black uppercase tracking-widest mb-2">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'Sin coincidencias'
                  : 'Sin leads registrados'}
              </p>
              <p className="text-gray-500 text-sm mb-6">
                {searchQuery || statusFilter !== 'all' || dateFilter !== 'all'
                  ? 'No encontramos leads que coincidan con tus filtros.'
                  : 'Aún no se han generado leads desde tus campañas de Meta Ads.'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-blue-400 hover:text-blue-300 font-black uppercase text-xs tracking-widest border-b border-blue-400/20 pb-1"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto custom-scrollbar">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 border-b border-white/10">
                      <th className="px-6 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads(filteredLeads.map(lead => lead.id));
                            } else {
                              setSelectedLeads([]);
                            }
                          }}
                          className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-blue-500/50 cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        Lead / Contacto
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        Campaña / Formulario
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        Responsable
                      </th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="group hover:bg-white/[0.02] transition-all">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedLeads.includes(lead.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLeads(prev => [...prev, lead.id]);
                              } else {
                                setSelectedLeads(prev => prev.filter(id => id !== lead.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-blue-500/50 cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <p className="font-black text-white flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                              {lead.first_name || lead.last_name
                                ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                : 'Sin nombre'}
                              {lead.is_demo && (
                                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded-full border border-purple-500/20 uppercase tracking-tighter">
                                  Demo
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-gray-500 group-hover:text-gray-400 transition-colors">
                              <Phone size={11} className="text-blue-500/50" />
                              <span className="text-xs font-mono tracking-tighter">{lead.phone_number}</span>
                            </div>
                            {lead.email && (
                              <div className="flex items-center gap-1.5 mt-0.5 text-gray-600">
                                <Mail size={11} />
                                <span className="text-[11px] truncate max-w-[150px] italic">{lead.email}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-[180px]">
                            <p className="text-[11px] font-black text-white truncate uppercase tracking-tighter">
                              {lead.campaign_name || 'Sin campaña'}
                            </p>
                            <p className="text-[9px] text-gray-500 truncate mt-1 uppercase tracking-widest font-bold">
                              {lead.form_name || 'Sin formulario'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border ${getStatusColor(lead.status)} shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                            {getStatusIcon(lead.status)}
                            {lead.status === 'new' ? 'Nuevo' :
                              lead.status === 'contacted' ? 'Contactado' :
                                lead.status === 'qualified' ? 'Calificado' :
                                  lead.status === 'converted' ? 'Convertido' :
                                    lead.status === 'closed_won' ? 'Cerrado' :
                                      lead.status === 'lost' ? 'Perdido' : lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {lead.assigned_seller_id ? (
                            <SellerBadge
                              sellerId={lead.assigned_seller_id}
                              sellerName={lead.assigned_seller_name}
                              sellerRole={lead.assigned_seller_role}
                              size="sm"
                              showLabel={true}
                              onClick={() => {
                                setSelectedLeadForAssignment(lead.id);
                                setShowSellerSelector(true);
                              }}
                            />
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedLeadForAssignment(lead.id);
                                setShowSellerSelector(true);
                              }}
                              className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest bg-white/[0.02] text-gray-500 rounded-lg hover:bg-blue-500/10 hover:text-blue-400 border border-white/5 hover:border-blue-500/30 transition-all border-dashed"
                            >
                              Asignar
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 text-[11px] font-bold text-gray-500 whitespace-nowrap">
                          {new Date(lead.created_at).toLocaleDateString()}
                          <span className="block text-[9px] text-gray-600 font-normal mt-0.5 uppercase tracking-tighter">
                            {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/chats?phone=${encodeURIComponent(lead.phone_number)}`)}
                              className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all border border-transparent hover:border-blue-500/20"
                              title="Ir al chat"
                            >
                              <MessageSquare size={16} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(lead.id, 'contacted')}
                              className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20"
                              title="Marcar como contactado"
                            >
                              <CheckCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Layout */}
              <div className="lg:hidden divide-y divide-white/5 bg-white/[0.01]">
                {filteredLeads.map((lead) => (
                  <div key={lead.id} className="p-5 active:bg-white/[0.05] transition-all relative overflow-hidden group">
                    <div className="flex items-start gap-4 relative z-10">
                      <div className="pt-1.5">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads(prev => [...prev, lead.id]);
                            } else {
                              setSelectedLeads(prev => prev.filter(id => id !== lead.id));
                            }
                          }}
                          className="w-5 h-5 rounded border-white/20 bg-black/40 text-blue-600 focus:ring-blue-500/50"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-white text-lg flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                              {lead.first_name || lead.last_name
                                ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                : 'Sin nombre'}
                              {lead.is_demo && (
                                <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black rounded-full border border-purple-500/20 uppercase tracking-tighter">
                                  Demo
                                </span>
                              )}
                            </h3>
                            <p className="text-sm font-bold text-gray-400 flex items-center gap-2 mt-2 font-mono">
                              <Phone size={14} className="text-blue-500/50" />
                              {lead.phone_number}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(lead.status)} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}>
                            {getStatusIcon(lead.status)}
                          </span>
                        </div>

                        <div className="mt-5 p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 shadow-inner">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Responsable</span>
                            {lead.assigned_seller_id ? (
                              <SellerBadge
                                sellerId={lead.assigned_seller_id}
                                sellerName={lead.assigned_seller_name}
                                sellerRole={lead.assigned_seller_role}
                                size="sm"
                              />
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedLeadForAssignment(lead.id);
                                  setShowSellerSelector(true);
                                }}
                                className="text-[9px] font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20 uppercase tracking-widest transition-all hover:bg-blue-500/20"
                              >
                                Asignar
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Campaña</span>
                            <span className="text-white text-[11px] font-bold truncate ml-3 uppercase tracking-tight">
                              {lead.campaign_name || 'Sin nombre'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6">
                          <span className="text-[10px] text-gray-500 font-bold mr-auto uppercase tracking-widest">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>

                          <button
                            onClick={() => navigate(`/chats?phone=${encodeURIComponent(lead.phone_number)}`)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-blue-500/20 text-blue-400 bg-blue-500/5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-blue-500/10 hover:border-blue-500/40"
                          >
                            <MessageSquare size={16} />
                            Chat
                          </button>

                          <button
                            onClick={() => handleStatusChange(lead.id, 'contacted')}
                            className="flex items-center gap-2 px-5 py-2.5 border border-emerald-500/20 text-emerald-400 bg-emerald-500/5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/40"
                          >
                            <CheckCircle size={16} />
                            Listo
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination - Responsive */}
        {filteredLeads.length > 0 && (
          <div className="mt-8 mb-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-400">
              Mostrando <span className="text-gray-900">{filteredLeads.length}</span> de <span className="text-gray-900">{leads.length}</span> contactos
            </p>
            <div className="flex items-center gap-1.5">
              <button className="p-2 text-xs font-bold text-gray-400 hover:text-gray-900 disabled:opacity-30" disabled>
                ANTERIOR
              </button>
              <div className="flex gap-1 px-2">
                <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-blue-600 text-white rounded-lg shadow-sm">1</span>
                {/* Simulated remaining pages */}
              </div>
              <button className="p-2 text-xs font-bold text-gray-400 hover:text-gray-900 disabled:opacity-30" disabled>
                SIGUIENTE
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Footer / Info - Mobile Responsive */}
        <div className="mt-6 mb-12 lg:mb-0 p-5 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-blue-500/20">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
              <Facebook size={28} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold leading-tight">Gestión Estratégica de Leads</h3>
              <p className="text-blue-100/80 text-sm mt-1 max-w-2xl">
                Los contactos generados desde formularios de Facebook e Instagram se centralizan aquí automáticamente.
                Asigna responsables rápidamente para maximizar la conversión.
              </p>
            </div>
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-6 w-full lg:w-auto pt-4 lg:pt-0 border-t lg:border-t-0 border-white/10 lg:pl-6 lg:border-l border-white/20">
              <div className="flex-1 lg:flex-none">
                <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-widest text-center lg:text-left">DKG Central</p>
                <p className="text-xl font-black text-center lg:text-left tracking-tight">{(stats.total > 0 ? (stats.converted / stats.total) * 100 : 0).toFixed(1)}% <span className="text-xs font-normal text-blue-200 opacity-60">ROI Est.</span></p>
              </div>
              <div className="flex-1 lg:flex-none">
                <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-widest text-center lg:text-left">Sin Asignar</p>
                <p className="text-xl font-black text-center lg:text-left tracking-tight">{leads.filter(l => !l.assigned_seller_id).length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Modal de Selección de Vendedor */}
      {showSellerSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedLeadForAssignment ? 'Asignar Lead' : 'Asignación Masiva'}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {selectedLeadForAssignment
                        ? 'Selecciona el vendedor responsable para este lead'
                        : `Selecciona el vendedor para ${selectedLeads.length} leads`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSellerSelector(false);
                    setSelectedLeadForAssignment(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <SellerSelector
                phone="" // No aplica para bulk/lead list simple aquí
                onSellerSelected={async (sellerId, sellerName) => {
                  if (selectedLeadForAssignment) {
                    await handleAssignSeller(selectedLeadForAssignment, sellerId, sellerName);
                  } else {
                    await handleBulkAssign(sellerId, sellerName);
                  }
                }}
                onCancel={() => {
                  setShowSellerSelector(false);
                  setSelectedLeadForAssignment(null);
                }}
                showAssignToMe={true}
                showAutoAssign={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaLeadsView;
