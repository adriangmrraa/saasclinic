import { useState, useEffect, useCallback } from 'react';
import {
    Bell, Filter, User, MessageSquare, Zap, Clock, TrendingUp, AlertCircle,
    ChevronDown, RefreshCw, Loader2, Calendar, CheckCircle, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    recipient_id: string;
    sender_id?: string;
    related_entity_type?: string;
    related_entity_id?: string;
    metadata: Record<string, any>;
    read: boolean;
    created_at: string;
    expires_at?: string;
}

interface Seller {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: string;
}

export default function NotificationsView() {
    const { user } = useAuth();

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [selectedSellerId, setSelectedSellerId] = useState<string>('all');
    const [unreadOnly, setUnreadOnly] = useState(false);

    const LIMIT = 30;

    // Fetch sellers for CEO filter
    useEffect(() => {
        if (user?.role === 'ceo') {
            const fetchSellers = async () => {
                try {
                    const response = await api.get('/admin/core/users');
                    // Filter only staff roles
                    const staff = response.data.filter((u: any) =>
                        ['setter', 'closer', 'secretary', 'professional'].includes(u.role)
                    );
                    setSellers(staff);
                } catch (err) {
                    console.error('Error fetching sellers:', err);
                }
            };
            fetchSellers();
        }
    }, [user]);

    const fetchNotifications = useCallback(async (currentOffset: number, append = false) => {
        try {
            if (append) setLoadingMore(true);
            else setLoading(true);

            const response = await api.get('/admin/core/notifications', {
                params: {
                    limit: LIMIT,
                    offset: currentOffset,
                    unread_only: unreadOnly,
                    seller_id: selectedSellerId === 'all' ? undefined : selectedSellerId
                }
            });

            const newNotifications = response.data;

            if (append) {
                setNotifications(prev => [...prev, ...newNotifications]);
            } else {
                setNotifications(newNotifications);
            }

            setHasMore(newNotifications.length === LIMIT);
            setError(null);
        } catch (err: any) {
            console.error('Error fetching notifications:', err);
            setError('No se pudieron cargar las notificaciones. Intenta de nuevo.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [selectedSellerId, unreadOnly]);

    useEffect(() => {
        setOffset(0);
        fetchNotifications(0, false);
    }, [selectedSellerId, unreadOnly, fetchNotifications]);

    const loadMore = () => {
        const nextOffset = offset + LIMIT;
        setOffset(nextOffset);
        fetchNotifications(nextOffset, true);
    };

    const markAsRead = async (id: string) => {
        try {
            await api.post('/admin/core/notifications/read', { notification_id: id });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'unanswered': return <MessageSquare size={18} className="text-red-500" />;
            case 'hot_lead': return <Zap size={18} className="text-orange-500" />;
            case 'followup': return <Clock size={18} className="text-blue-500" />;
            case 'performance_alert': return <TrendingUp size={18} className="text-yellow-500" />;
            case 'assignment': return <User size={18} className="text-green-500" />;
            default: return <Bell size={18} className="text-gray-500" />;
        }
    };

    const getPriorityBadge = (priority: string) => {
        const styles: Record<string, string> = {
            critical: 'bg-red-100 text-red-700 border-red-200',
            high: 'bg-orange-100 text-orange-700 border-orange-200',
            medium: 'bg-blue-100 text-blue-700 border-blue-200',
            low: 'bg-gray-100 text-gray-700 border-gray-200',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles[priority] || styles.medium}`}>
                {priority.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 pb-20">
            <div className="max-w-6xl mx-auto px-4 pt-8">
                <PageHeader
                    title={user?.role === 'ceo' ? "Centro de Control (CEO)" : "Mis Notificaciones"}
                    subtitle="Monitoreo en tiempo real de la actividad comercial"
                    icon={<Bell className="text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]" />}
                />

                {/* Filters Bar */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => setUnreadOnly(false)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${!unreadOnly ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setUnreadOnly(true)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${unreadOnly ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                No leídas
                            </button>
                        </div>

                        {user?.role === 'ceo' && (
                            <div className="flex items-center gap-2 ml-4">
                                <Filter size={16} className="text-blue-400" />
                                <select
                                    value={selectedSellerId}
                                    onChange={(e) => setSelectedSellerId(e.target.value)}
                                    className="bg-black/40 border border-white/10 text-white text-sm rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none p-2 transition-all"
                                >
                                    <option value="all" className="bg-gray-900">Todos los vendedores</option>
                                    {sellers.map(s => (
                                        <option key={s.id} value={s.id} className="bg-gray-900">
                                            {s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.email} ({s.role})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => fetchNotifications(0, false)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-white/5 rounded-full transition-all border border-transparent hover:border-white/10"
                        title="Refrescar"
                    >
                        <RefreshCw size={20} className={loading && !loadingMore ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Notifications List */}
                <div className="mt-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                            <AlertCircle size={20} />
                            <p>{error}</p>
                        </div>
                    )}

                    {!loading && notifications.length === 0 ? (
                        <div className="bg-white/[0.02] backdrop-blur-md rounded-3xl p-12 text-center border border-dashed border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mt-16"></div>
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 shadow-inner">
                                <Bell size={40} className="text-gray-600" />
                            </div>
                            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Sin notificaciones</h3>
                            <p className="text-gray-500 mt-2 font-medium">No se encontraron alertas para el filtro seleccionado.</p>
                        </div>
                    ) : (
                        <>
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    className={`bg-white/[0.02] backdrop-blur-md rounded-2xl p-5 border transition-all hover:bg-white/[0.04] flex gap-4 relative overflow-hidden ${!n.read ? 'border-blue-500/30' : 'border-white/10'
                                        }`}
                                >
                                    {!n.read && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                                    )}
                                    <div className={`flex-none w-12 h-12 rounded-xl flex items-center justify-center border ${!n.read ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/10 text-gray-500'
                                        }`}>
                                        {getTypeIcon(n.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold text-sm truncate ${!n.read ? 'text-white' : 'text-gray-400'}`}>
                                                    {n.title}
                                                </h4>
                                                {getPriorityBadge(n.priority)}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 whitespace-nowrap uppercase tracking-tighter">
                                                <Calendar size={12} className="text-blue-400/50" />
                                                {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed mb-3 ${!n.read ? 'text-gray-300' : 'text-gray-500'}`}>
                                            {n.message}
                                        </p>

                                        <div className="flex items-center gap-3">
                                            {!n.read && (
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all hover:bg-blue-500/20"
                                                >
                                                    <CheckCircle size={14} />
                                                    Marcar como leída
                                                </button>
                                            )}

                                            {n.related_entity_id && (
                                                <a
                                                    href={n.related_entity_type === 'conversation' ? `/chat?phone=${n.metadata?.phone}` : `/leads/${n.related_entity_id}`}
                                                    className="text-[10px] font-bold text-gray-400 hover:text-white flex items-center gap-1 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 transition-all hover:bg-white/10"
                                                >
                                                    <Info size={14} />
                                                    Ir al detalle
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="w-full py-4 bg-white/[0.02] backdrop-blur-md border border-white/10 rounded-2xl text-gray-400 font-bold hover:bg-white/[0.05] hover:text-white flex items-center justify-center gap-2 transition-all shadow-xl"
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            Cargando más...
                                        </>
                                    ) : (
                                        <>
                                            Ver más notificaciones
                                            <ChevronDown size={20} />
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    )}

                    {loading && !loadingMore && (
                        <div className="flex flex-col items-center justify-center p-20">
                            <Loader2 size={48} className="text-primary-500 animate-spin mb-4" />
                            <p className="text-gray-500 font-medium">Sincronizando con el servidor...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
