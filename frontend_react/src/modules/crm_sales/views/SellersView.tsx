import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useTranslation } from '../../../context/LanguageContext';
import {
    UserCheck, UserX, Clock, ShieldCheck, Mail, AlertTriangle, User, Users,
    Lock, Unlock, X, Building2, BarChart3, Phone, Settings, Edit
} from 'lucide-react';

const CRM_PREFIX = '/admin/core/crm';

interface StaffUser {
    id: string;
    email: string;
    role: string;
    status: 'pending' | 'active' | 'suspended';
    created_at: string;
    first_name?: string;
    last_name?: string;
}

interface SellerRow {
    id: number;
    tenant_id: number;
    user_id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone_number?: string;
    is_active?: boolean;
    role: string;
}

interface TenantOption {
    id: number;
    clinic_name: string;
}

type KpisByRowRecord = Record<string, { total_leads: number; by_status: Record<string, number> }>;

const SellersView: React.FC = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<StaffUser[]>([]);
    const [sellers, setSellers] = useState<SellerRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'requests' | 'sellers'>('requests');
    const [selectedSeller, setSelectedSeller] = useState<SellerRow | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [sellerRows, setSellerRows] = useState<SellerRow[]>([]);
    const [entities, setEntities] = useState<TenantOption[]>([]);
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [linkFormData, setLinkFormData] = useState({ tenant_id: null as number | null, phone: '' });
    const [linkFormSubmitting, setLinkFormSubmitting] = useState(false);
    const [editingRow, setEditingRow] = useState<SellerRow | null>(null);
    const [editFormData, setEditFormData] = useState({
        first_name: '', last_name: '', email: '', phone_number: '', is_active: true,
    });
    const [editFormSubmitting, setEditFormSubmitting] = useState(false);
    const [kpisByRow, setKpisByRow] = useState<KpisByRowRecord>({});

    useEffect(() => {
        fetchUsers();
        fetchSellers();
    }, []);

    useEffect(() => {
        api.get<TenantOption[]>(`/admin/core/chat/tenants`).then((res) => {
            setEntities(res.data || []);
        }).catch(() => setEntities([]));
    }, []);

    useEffect(() => {
        if (!selectedSeller) {
            setSellerRows([]);
            setKpisByRow({});
            return;
        }
        setDetailLoading(true);
        api.get<SellerRow[]>(`${CRM_PREFIX}/sellers/by-user/${selectedSeller.user_id}`)
            .then((res) => setSellerRows(res.data || []))
            .catch(() => setSellerRows([]))
            .finally(() => setDetailLoading(false));
    }, [selectedSeller?.user_id]);

    const fetchUsers = async () => {
        try {
            const response = await api.get<StaffUser[]>('/admin/core/users');
            setUsers(response.data || []);
        } catch {
            setError(t('approvals.error_load_users'));
        } finally {
            setLoading(false);
        }
    };

    const fetchSellers = async () => {
        try {
            const response = await api.get<SellerRow[]>(`${CRM_PREFIX}/sellers`);
            setSellers(response.data || []);
        } catch {
            setSellers([]);
        }
    };

    const handleAction = async (userId: string, action: 'active' | 'suspended') => {
        try {
            await api.post(`/admin/core/users/${userId}/status`, { status: action });
            setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: action } : u)));
            if (action === 'active') fetchSellers();
        } catch {
            alert(t('alerts.error_process'));
        }
    };

    const closeDetailModal = () => {
        setSelectedSeller(null);
        setShowLinkForm(false);
        setLinkFormData({ tenant_id: null, phone: '' });
        setKpisByRow({});
    };

    const loadKpis = async (row: SellerRow) => {
        const key = `${row.id}-${row.tenant_id}`;
        if (kpisByRow[key]) return;
        try {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
            const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
            const res = await api.get(`${CRM_PREFIX}/sellers/${row.id}/analytics`, {
                params: { tenant_id: row.tenant_id, start_date: start, end_date: end },
            });
            setKpisByRow((prev) => ({ ...prev, [key]: { total_leads: res.data.total_leads || 0, by_status: res.data.by_status || {} } }));
        } catch {
            setKpisByRow((prev) => ({ ...prev, [key]: { total_leads: 0, by_status: {} } }));
        }
    };

    const handleRemoveAccess = async () => {
        if (!selectedSeller || !confirm(t('sellers.confirm_remove_access'))) return;
        try {
            await api.post(`/admin/core/users/${selectedSeller.user_id}/status`, { status: 'suspended' });
            closeDetailModal();
            fetchUsers();
            fetchSellers();
        } catch {
            alert(t('approvals.error_process'));
        }
    };

    const handleLinkToEntitySubmit = async (e: React.FormEvent) => {
        if (!selectedSeller) return;
        const tenant_id = linkFormData.tenant_id ?? entities[0]?.id;
        if (!tenant_id) {
            alert(t('sellers.select_entity'));
            return;
        }
        e.preventDefault();
        setLinkFormSubmitting(true);
        try {
            await api.post(`${CRM_PREFIX}/sellers`, {
                first_name: selectedSeller.first_name || '',
                last_name: selectedSeller.last_name || '',
                email: selectedSeller.email,
                phone_number: linkFormData.phone || undefined,
                tenant_id,
                role: selectedSeller.role,
            });
            const res = await api.get<SellerRow[]>(`${CRM_PREFIX}/sellers/by-user/${selectedSeller.user_id}`);
            setSellerRows(res.data || []);
            setShowLinkForm(false);
            setLinkFormData({ tenant_id: null, phone: '' });
            fetchSellers();
        } catch (err: any) {
            alert(err?.response?.data?.detail || t('sellers.error_link_entity'));
        } finally {
            setLinkFormSubmitting(false);
        }
    };

    const openEditModal = (row: SellerRow) => {
        setEditingRow(row);
        setEditFormData({
            first_name: row.first_name || '',
            last_name: row.last_name || '',
            email: row.email || '',
            phone_number: row.phone_number || '',
            is_active: row.is_active ?? true,
        });
    };

    const closeEditModal = () => {
        setEditingRow(null);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRow) return;
        setEditFormSubmitting(true);
        try {
            await api.put(`${CRM_PREFIX}/sellers/${editingRow.id}`, {
                first_name: editFormData.first_name,
                last_name: editFormData.last_name,
                email: editFormData.email,
                phone_number: editFormData.phone_number || undefined,
                is_active: editFormData.is_active,
            });
            closeEditModal();
            if (selectedSeller && selectedSeller.user_id) {
                const res = await api.get<SellerRow[]>(`${CRM_PREFIX}/sellers/by-user/${selectedSeller.user_id}`);
                setSellerRows(res.data || []);
            }
            fetchSellers();
        } catch (err: any) {
            alert(err?.response?.data?.detail || t('approvals.error_save'));
        } finally {
            setEditFormSubmitting(false);
        }
    };

    const requests = users.filter((u) => u.status === 'pending' && (u.role === 'setter' || u.role === 'closer'));

    if (loading) return <div className="p-6">{t('sellers.loading')}</div>;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#050505] text-white">
            <div className="flex-shrink-0 px-4 lg:px-6 pt-4 lg:pt-6 bg-[#050505]/50 backdrop-blur-md border-b border-white/10 pb-6">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
                            <ShieldCheck className="text-blue-400" size={28} />
                            {t('sellers.page_title')}
                        </h1>
                        <p className="text-gray-400 text-sm font-medium mt-1">{t('sellers.page_subtitle')}</p>
                    </div>
                </div>

                <div className="flex gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all relative ${activeTab === 'requests'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {t('sellers.requests')}
                        {requests.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                {requests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('sellers')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sellers'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {t('sellers.sellers_tab')}
                    </button>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
                {error ? (
                    <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center">
                        <AlertTriangle className="text-red-400 mx-auto mb-4" size={48} />
                        <p className="text-red-400 font-bold">{error}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 max-w-7xl mx-auto">
                        {activeTab === 'requests' ? (
                            requests.length === 0 ? (
                                <div className="bg-white/[0.02] border border-white/10 p-20 rounded-3xl text-center backdrop-blur-md">
                                    <Clock size={48} className="mx-auto mb-4 text-white/10" />
                                    <h3 className="text-xl font-bold mb-2 tracking-tight">{t('sellers.no_requests')}</h3>
                                    <p className="text-gray-500 font-medium">{t('sellers.no_requests_hint')}</p>
                                </div>
                            ) : (
                                requests.map((user) => (
                                    <SellerUserCard key={user.id} user={user} onAction={handleAction} isRequest />
                                ))
                            )
                        ) : sellers.length === 0 ? (
                            <div className="bg-white/[0.02] border border-white/10 p-20 rounded-3xl text-center backdrop-blur-md">
                                <Users size={48} className="mx-auto mb-4 text-white/10" />
                                <h3 className="text-xl font-bold mb-2 tracking-tight">{t('sellers.no_sellers')}</h3>
                                <p className="text-gray-500 font-medium">{t('sellers.no_sellers_hint')}</p>
                            </div>
                        ) : (
                            sellers.map((seller) => (
                                <SellerCard
                                    key={`${seller.id}-${seller.tenant_id}`}
                                    seller={seller}
                                    onCardClick={() => setSelectedSeller(seller)}
                                    onConfigClick={() => {
                                        setSelectedSeller(seller);
                                        api.get<SellerRow[]>(`${CRM_PREFIX}/sellers/by-user/${seller.user_id}`)
                                            .then((res) => {
                                                const rows = res.data || [];
                                                if (rows.length > 0) openEditModal(rows[0]);
                                            })
                                            .catch(() => { });
                                    }}
                                />
                            ))
                        )}
                    </div>
                )}
            </main>

            {/* Modal detalle vendedor */}
            {selectedSeller && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#151515] rounded-3xl border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur-md shrink-0">
                            <h2 className="text-xl font-bold text-white tracking-tight truncate mr-4">
                                {selectedSeller.first_name || ''} {selectedSeller.last_name || ''}
                            </h2>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        api.get<SellerRow[]>(`${CRM_PREFIX}/sellers/by-user/${selectedSeller.user_id}`).then((res) => {
                                            const rows = res.data || [];
                                            if (rows.length > 0) openEditModal(rows[0]);
                                        });
                                    }}
                                    className="p-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all shadow-sm"
                                    title={t('sellers.edit_seller')}
                                >
                                    <Settings size={20} />
                                </button>
                                <button type="button" onClick={closeDetailModal} className="p-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
                            <div className="flex flex-wrap gap-4 items-center">
                                <span className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-widest border ${selectedSeller.role === 'setter'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>
                                    {selectedSeller.role === 'setter' ? t('sellers.setter') : t('sellers.closer')}
                                </span>
                                <p className="text-sm font-medium text-gray-400 flex items-center gap-2 italic">
                                    <Mail size={14} className="text-blue-400" />
                                    {selectedSeller.email}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <Building2 size={16} className="text-blue-400" />
                                            {t('sellers.assigned_entities')}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowLinkForm(true);
                                                setLinkFormData((p) => ({ ...p, tenant_id: entities[0]?.id ?? null }));
                                            }}
                                            className="text-[10px] font-bold text-blue-400 uppercase tracking-widest hover:text-blue-300 transition-colors"
                                        >
                                            {t('sellers.link_to_entity')}
                                        </button>
                                    </div>

                                    {showLinkForm && (
                                        <form onSubmit={handleLinkToEntitySubmit} className="bg-white/[0.02] border border-white/10 p-6 rounded-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('sellers.choose_entity')}</label>
                                                    <select
                                                        value={linkFormData.tenant_id ?? ''}
                                                        onChange={(e) => setLinkFormData((p) => ({ ...p, tenant_id: e.target.value ? parseInt(e.target.value, 10) : null }))}
                                                        className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                                                        required
                                                    >
                                                        <option value="" className="bg-[#151515]">{t('sellers.choose_entity')}</option>
                                                        {entities.map((c) => (
                                                            <option key={c.id} value={c.id} className="bg-[#151515]">{c.clinic_name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('approvals.phone')}</label>
                                                    <div className="relative group">
                                                        <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                                                        <input
                                                            type="text"
                                                            value={linkFormData.phone}
                                                            onChange={(e) => setLinkFormData((p) => ({ ...p, phone: e.target.value }))}
                                                            className="w-full bg-[#121212] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 placeholder-gray-700"
                                                            placeholder="+12345678"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <button type="submit" disabled={linkFormSubmitting} className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50">
                                                    {linkFormSubmitting ? t('common.saving') : t('approvals.save_and_link')}
                                                </button>
                                                <button type="button" onClick={() => { setShowLinkForm(false); setLinkFormData({ tenant_id: null, phone: '' }); }} className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 text-xs font-bold uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">
                                                    {t('common.cancel')}
                                                </button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="space-y-3">
                                        {detailLoading ? (
                                            <div className="flex items-center gap-3 py-4">
                                                <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest animate-pulse">{t('sellers.loading_entities')}</p>
                                            </div>
                                        ) : sellerRows.length > 0 ? (
                                            sellerRows.map((p) => (
                                                <div key={p.id} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-white/10 transition-all">
                                                    <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                                                        <Building2 size={16} />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
                                                        {entities.find((c) => c.id === p.tenant_id)?.clinic_name || `Entidad ${p.tenant_id}`}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center border border-dashed border-white/10 rounded-2xl">
                                                <p className="text-xs text-gray-600 font-medium italic">{t('sellers.not_linked_hint')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <BarChart3 size={16} className="text-blue-400" />
                                        {t('sellers.kpis_leads')}
                                    </h3>
                                    <div className="space-y-4">
                                        {sellerRows.map((row) => {
                                            const key = `${row.id}-${row.tenant_id}`;
                                            return (
                                                <div key={key} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <BarChart3 size={48} className="text-blue-400" />
                                                    </div>
                                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-3">
                                                        {entities.find((c) => c.id === row.tenant_id)?.clinic_name || `Entidad ${row.tenant_id}`}
                                                    </p>
                                                    {!kpisByRow[key] ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => loadKpis(row)}
                                                            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors group/btn"
                                                        >
                                                            <Clock size={14} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                                                            {t('sellers.load_kpis')}
                                                        </button>
                                                    ) : (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('sellers.total_leads')}</span>
                                                                <p className="text-2xl font-bold tracking-tight text-white">{kpisByRow[key].total_leads}</p>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('sellers.status')}</span>
                                                                <div className="space-y-1 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                                                                    {Object.entries(kpisByRow[key].by_status).map(([status, count]) => (
                                                                        <div key={status} className="flex justify-between items-center text-[10px] font-medium py-1 border-b border-white/5 last:border-0">
                                                                            <span className="text-gray-400 capitalize">{status}</span>
                                                                            <span className="text-white font-bold">{count}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-6 border-t border-white/10 bg-white/5 backdrop-blur-md flex justify-end shrink-0">
                            <button
                                type="button"
                                onClick={handleRemoveAccess}
                                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white shadow-lg shadow-red-500/10 transition-all"
                            >
                                <Lock size={18} />
                                {t('sellers.remove_access')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Editar vendedor */}
            {editingRow && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#151515] rounded-3xl border border-white/10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
                            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                                <Edit className="text-blue-400" size={24} />
                                {t('sellers.edit_seller')}
                            </h2>
                            <button type="button" onClick={closeEditModal} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('sellers.first_name')}</label>
                                    <input
                                        type="text"
                                        value={editFormData.first_name}
                                        onChange={(e) => setEditFormData((p) => ({ ...p, first_name: e.target.value }))}
                                        className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('sellers.last_name')}</label>
                                    <input
                                        type="text"
                                        value={editFormData.last_name}
                                        onChange={(e) => setEditFormData((p) => ({ ...p, last_name: e.target.value }))}
                                        className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('approvals.email')}</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData((p) => ({ ...p, email: e.target.value }))}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">{t('approvals.phone')}</label>
                                <input
                                    type="text"
                                    value={editFormData.phone_number}
                                    onChange={(e) => setEditFormData((p) => ({ ...p, phone_number: e.target.value }))}
                                    className="w-full bg-[#121212] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="pt-2">
                                <label className="inline-flex items-center gap-4 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={editFormData.is_active}
                                            onChange={(e) => setEditFormData((p) => ({ ...p, is_active: e.target.checked }))}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors">{t('approvals.active')}</span>
                                </label>
                            </div>
                            <div className="flex gap-4 pt-6 mt-4 border-t border-white/5">
                                <button type="button" onClick={closeEditModal} className="flex-1 py-3 rounded-2xl border border-white/10 text-gray-400 font-bold text-xs uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" disabled={editFormSubmitting} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50">
                                    {editFormSubmitting ? t('common.saving') : t('common.save_changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SellerUserCardProps {
    user: StaffUser;
    onAction: (id: string, action: 'active' | 'suspended') => void;
    isRequest?: boolean;
}

const SellerUserCard: React.FC<SellerUserCardProps> = ({ user, onAction, isRequest }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white/[0.02] border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 backdrop-blur-md rounded-3xl hover:bg-white/[0.04] transition-all group">
            <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 group-hover:scale-110 transition-transform ${user.role === 'setter' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    } ${user.status === 'suspended' ? 'grayscale opacity-50' : ''}`}>
                    <User size={24} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                            {user.first_name || t('approvals.no_name')} {user.last_name || ''}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-widest border ${user.role === 'setter'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {user.role === 'setter' ? t('sellers.setter') : t('sellers.closer')}
                        </span>
                    </div>
                    <div className="text-sm font-medium text-gray-400 flex items-center gap-2 group-hover:text-gray-300 transition-colors">
                        <Mail size={12} className="text-blue-400/50" />
                        {user.email}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                {isRequest ? (
                    <>
                        <button onClick={() => onAction(user.id, 'active')} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-[0.95] transition-all flex items-center justify-center gap-2">
                            <UserCheck size={18} /> {t('approvals.approve')}
                        </button>
                        <button onClick={() => onAction(user.id, 'suspended')} className="px-5 py-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white active:scale-[0.95] transition-all flex items-center justify-center gap-2">
                            <UserX size={18} /> {t('approvals.reject')}
                        </button>
                    </>
                ) : (
                    user.status === 'active' ? (
                        <button onClick={() => onAction(user.id, 'suspended')} className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 active:scale-[0.95] transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <Lock size={18} /> {t('approvals.suspend')}
                        </button>
                    ) : (
                        <button onClick={() => onAction(user.id, 'active')} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest active:scale-[0.95] transition-all flex items-center justify-center gap-2">
                            <Unlock size={18} /> {t('approvals.reactivate')}
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

interface SellerCardProps {
    seller: SellerRow;
    onCardClick: () => void;
    onConfigClick: () => void;
}

const SellerCard: React.FC<SellerCardProps> = ({ seller, onCardClick, onConfigClick }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white/[0.02] border border-white/10 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 backdrop-blur-md rounded-3xl hover:bg-white/[0.04] transition-all group">
            <div
                className="flex items-center gap-5 flex-1 min-w-0 cursor-pointer"
                onClick={onCardClick}
                role="button"
            >
                <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/10 group-hover:scale-110 transition-transform ${seller.role === 'setter' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                    }`}>
                    <User size={24} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                        <span className="text-lg font-bold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                            {seller.first_name || ''} {seller.last_name || ''}
                        </span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-widest border ${seller.role === 'setter'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {seller.role === 'setter' ? t('sellers.setter') : t('sellers.closer')}
                        </span>
                    </div>
                    <div className="text-sm font-medium text-gray-400 flex items-center gap-2 group-hover:text-gray-300 transition-colors">
                        <Mail size={12} className="text-blue-400/50" />
                        {seller.email}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    onClick={onConfigClick}
                    className="p-3 rounded-2xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all shadow-sm"
                    title={t('sellers.edit_seller')}
                >
                    <Settings size={20} />
                </button>
            </div>
        </div>
    );
};

export default SellersView;
