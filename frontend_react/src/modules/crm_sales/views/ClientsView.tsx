import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Trash2, X, FileText, User } from 'lucide-react';
import api from '../../../api/axios';
import { useTranslation } from '../../../context/LanguageContext';
import PageHeader from '../../../components/PageHeader';

const CRM_CLIENTS_BASE = '/admin/core/crm/clients';
const CRM_LEADS_BASE = '/admin/core/crm/leads';
const STATUS_OPTIONS = ['active', 'inactive'] as const;

export interface Client {
  id: number;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ClientsView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    email: '',
    status: 'active' as typeof STATUS_OPTIONS[number],
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [leads, setLeads] = useState<{ id: string; phone_number: string; first_name?: string; last_name?: string; email?: string }[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, [statusFilter, searchTerm]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 100, offset: 0 };
      if (statusFilter) params.status = statusFilter;
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const response = await api.get<Client[]>(CRM_CLIENTS_BASE, { params });
      setClients(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError(null);
    try {
      if (editingClient) {
        await api.put(`${CRM_CLIENTS_BASE}/${editingClient.id}`, {
          first_name: formData.first_name || null,
          last_name: formData.last_name || null,
          email: formData.email || null,
          phone_number: formData.phone_number || null,
          status: formData.status,
        });
      } else {
        if (!formData.phone_number.trim()) {
          setModalError(t('clients.phone_required'));
          setSaving(false);
          return;
        }
        await api.post(CRM_CLIENTS_BASE, {
          phone_number: formData.phone_number.trim(),
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          email: formData.email || undefined,
          status: formData.status,
          ...(selectedLeadId ? { lead_id: selectedLeadId } : {}),
        });
      }
      fetchClients();
      closeModal();
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : t('clients.error_save');
      setModalError(String(msg));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('clients.confirm_delete'))) return;
    try {
      await api.delete(`${CRM_CLIENTS_BASE}/${id}`);
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      alert(t('clients.error_delete'));
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      first_name: client.first_name || '',
      last_name: client.last_name || '',
      phone_number: client.phone_number || '',
      email: client.email || '',
      status: (client.status as typeof formData.status) || 'active',
    });
    setShowModal(true);
  };

  const openCreateModal = async () => {
    setEditingClient(null);
    setSelectedLeadId(null);
    setFormData({
      first_name: '',
      last_name: '',
      phone_number: '',
      email: '',
      status: 'active',
    });
    setShowModal(true);
    try {
      const res = await api.get<typeof leads>(CRM_LEADS_BASE, { params: { limit: 200 } });
      setLeads(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLeads([]);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setSelectedLeadId(null);
    setModalError(null);
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId || null);
    if (!leadId) return;
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        phone_number: lead.phone_number || '',
        email: lead.email || '',
        status: 'active',
      });
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#050505] text-white">
      <div className="flex-shrink-0 px-4 lg:px-6 pt-4 lg:pt-6 bg-[#050505]/50 backdrop-blur-md border-b border-white/10 pb-6">
        <PageHeader
          title={t('clients.title')}
          subtitle={t('clients.subtitle')}
          icon={<User size={22} className="text-blue-400" />}
          action={
            <button
              onClick={openCreateModal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl transition-all text-sm font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              <Plus size={20} />
              {t('clients.new_client')}
            </button>
          }
        />

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('clients.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 text-sm bg-white/[0.02] border border-white/10 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-white placeholder-gray-600 transition-all backdrop-blur-sm"
            />
          </div>
          <div className="relative group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/10 rounded-2xl text-sm text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all backdrop-blur-sm appearance-none cursor-pointer font-medium"
            >
              <option value="" className="bg-[#151515]">{t('clients.all_statuses')}</option>
              <option value="active" className="bg-[#151515]">{t('clients.status_active')}</option>
              <option value="inactive" className="bg-[#151515]">{t('clients.status_inactive')}</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <Plus size={14} className="rotate-45" />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <div className="bg-white/[0.02] backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl overflow-hidden">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs animate-pulse">{t('common.loading')}</p>
            </div>
          ) : clients.length === 0 ? (
            <div className="p-20 text-center text-gray-500 italic flex flex-col items-center gap-4">
              <User size={48} className="text-white/5" />
              <p className="font-medium tracking-tight">{t('clients.no_clients')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                  <thead className="bg-gray-900/50 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-white/10">{t('clients.client')}</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-white/10">{t('clients.contact')}</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-white/10">{t('clients.status')}</th>
                      <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-white/10">{t('clients.date_added')}</th>
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] border-b border-white/10">{t('clients.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-white/[0.02] transition-all group">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                              {(client.first_name || client.phone_number || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                                {[client.first_name, client.last_name].filter(Boolean).join(' ') || client.phone_number || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-200 font-medium">{client.phone_number}</div>
                          <div className="text-xs text-gray-500 italic">{client.email || '—'}</div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border ${client.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                            }`}>
                            {t('clients.status_' + (client.status === 'active' ? 'active' : 'inactive'))}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-400 font-medium">
                          {new Date(client.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/crm/clientes/${client.id}`)}
                              className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all"
                              title={t('clients.view_detail')}
                            >
                              <FileText size={18} />
                            </button>
                            <button
                              onClick={() => openEditModal(client)}
                              className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                              title={t('common.edit')}
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
                              className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                              title={t('common.delete')}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden divide-y divide-white/5">
                {clients.map((client) => (
                  <div key={client.id} className="p-5 bg-transparent hover:bg-white/[0.02] transition-colors relative group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 shrink-0">
                          {(client.first_name || client.phone_number || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white truncate tracking-tight group-hover:text-blue-400 transition-colors">
                            {[client.first_name, client.last_name].filter(Boolean).join(' ') || client.phone_number || '—'}
                          </h3>
                          <p className="text-xs text-gray-500 font-medium">{client.phone_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => navigate(`/crm/clientes/${client.id}`)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-xl transition-all">
                          <FileText size={18} />
                        </button>
                        <button onClick={() => openEditModal(client)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border ${client.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}>
                        {t('clients.status_' + (client.status === 'active' ? 'active' : 'inactive'))}
                      </span>
                      <button onClick={() => handleDelete(client.id)} className="text-[10px] font-bold text-red-400 uppercase tracking-widest px-3 py-1 hover:bg-red-400/10 rounded-lg transition-all border border-red-500/20">
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto p-4 animate-in fade-in duration-300">
          <div className="bg-[#151515] rounded-3xl border border-white/10 w-full max-w-2xl mx-4 my-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/10 sticky top-0 bg-white/5 backdrop-blur-md z-10">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {editingClient ? t('clients.edit_client') : t('clients.new_client')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-all">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {modalError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium animate-in slide-in-from-top-2">
                  {modalError}
                </div>
              )}
              <div className="space-y-6">
                {!editingClient && leads.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{t('clients.load_from_lead')}</label>
                    <select
                      value={selectedLeadId || ''}
                      onChange={(e) => handleSelectLead(e.target.value)}
                      className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-[#151515]">{t('clients.select_lead_placeholder')}</option>
                      {leads.map((lead) => (
                        <option key={lead.id} value={lead.id} className="bg-[#151515]">
                          {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || lead.phone_number} — {lead.phone_number}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {!editingClient && (
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{t('clients.phone')} *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{t('clients.first_name')}</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{t('clients.last_name')}</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{t('clients.email')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] ml-1">{t('clients.status')}</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-4 py-3 bg-[#121212] border border-gray-800 rounded-2xl text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="active" className="bg-[#151515]">{t('clients.status_active')}</option>
                      <option value="inactive" className="bg-[#151515]">{t('clients.status_inactive')}</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-4 mt-10 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-3 text-gray-400 font-bold text-sm bg-transparent border border-white/10 rounded-2xl hover:text-white hover:bg-white/5 transition-all"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-3 text-white font-bold text-sm bg-blue-600 rounded-2xl hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {editingClient ? t('common.save_changes') : t('clients.create_client')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
