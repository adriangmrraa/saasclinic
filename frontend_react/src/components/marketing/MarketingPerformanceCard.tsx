import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Award, Target } from 'lucide-react';
import api from '../../api/axios';
import { useTranslation } from '../../context/LanguageContext';

interface MarketingPerformanceCardProps {
    stats?: any;
    loading?: boolean;
    timeRange?: string;
}

export default function MarketingPerformanceCard({ stats: externalStats, loading: externalLoading, timeRange = 'last_30d' }: MarketingPerformanceCardProps) {
    const { t } = useTranslation();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (externalStats) {
            setStats(externalStats);
            setLoading(externalLoading || false);
            return;
        }

        const fetchStats = async () => {
            try {
                setLoading(true);
                const { data } = await api.get(`/crm/marketing/stats/roi?range=${timeRange}`);
                setStats(data.data || data);
            } catch (error) {
                console.error("Error fetching ROI stats:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [externalStats, externalLoading, timeRange]);

    if (loading) return (
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 h-full flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 shadow-lg shadow-blue-500/20"></div>
        </div>
    );

    const investment = stats?.total_spend || 0;
    const revenue = stats?.total_revenue || 0;
    const roi = investment > 0 ? ((revenue - investment) / investment) * 100 : 0;

    return (
        <div className="bg-white/[0.02] border border-white/10 backdrop-blur-md rounded-3xl p-8 shadow-xl h-full flex flex-col justify-between overflow-hidden relative group hover:bg-white/[0.04] transition-all">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-gray-500 font-bold text-[10px] sm:text-xs mb-2 uppercase tracking-[0.2em]">{t('marketing.roi_card_title')}</h3>
                        <p className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tighter">
                            {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                        </p>
                    </div>
                    <div className={`p-3 sm:p-4 rounded-2xl ${roi >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-lg shadow-rose-500/10'}`}>
                        {roi >= 0 ? <TrendingUp size={24} className="sm:w-8 sm:h-8" /> : <TrendingDown size={24} className="sm:w-8 sm:h-8" />}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            {t('marketing.investment')}
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white break-words tracking-tight">{stats?.currency === 'USD' ? '$' : stats?.currency || ''}{investment.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            {t('marketing.return')}
                        </div>
                        <p className="text-2xl sm:text-3xl font-bold text-white break-words tracking-tight">{stats?.currency === 'USD' ? '$' : stats?.currency || ''}{revenue.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-6 pt-8 border-t border-white/10">
                <div className="text-center">
                    <p className="text-gray-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] mb-2">CPA</p>
                    <p className="text-sm sm:text-lg font-bold text-white">{stats?.currency === 'USD' ? '$' : stats?.currency || ''}{stats?.cpa > 999 ? Math.round(stats.cpa).toLocaleString() : stats?.cpa?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-center border-x border-white/10 px-2 sm:px-4">
                    <p className="text-gray-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] mb-2">Leads</p>
                    <p className="text-sm sm:text-lg font-bold text-white">{stats?.leads || 0}</p>
                </div>
                <div className="text-center">
                    <p className="text-gray-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] mb-2 truncate px-1">Convenidos</p>
                    <p className="text-sm sm:text-lg font-bold text-white">{stats?.patients_converted || 0}</p>
                </div>
            </div>
        </div>
    );
}
