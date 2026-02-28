import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { User, Mail, Calendar, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import PageHeader from '../components/PageHeader';

interface UserProfile {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    google_calendar_id?: string;
    created_at?: string;
}

const ProfileView: React.FC = () => {
    const { user: authUser } = useAuth();
    const { t } = useTranslation();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form State
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [calendarId, setCalendarId] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/auth/profile');
            const data = response.data;
            setProfile(data);
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
            setCalendarId(data.google_calendar_id || '');
        } catch (err: any) {
            setError("No se pudo cargar el perfil.");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            await api.patch('/auth/profile', {
                first_name: firstName,
                last_name: lastName,
                google_calendar_id: authUser?.role === 'professional' ? calendarId : undefined
            });
            setSuccess("Perfil actualizado correctamente.");
            // Refresh local auth context or state if needed (optional)
        } catch (err: any) {
            setError(err.response?.data?.detail || "Error al actualizar perfil.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin text-medical-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn p-4 lg:p-6 bg-[#050505] text-gray-200 min-h-screen">
            <PageHeader
                title={t('profile.title')}
                subtitle={t('profile.subtitle')}
                icon={<User size={22} />}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Summary Card */}
                <div className="md:col-span-1">
                    <div className="bg-white/[0.02] rounded-2xl p-6 border border-white/10 backdrop-blur-md flex flex-col items-center text-center shadow-2xl shadow-purple-500/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
                        <div className="w-24 h-24 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-3xl mb-4 border-4 border-white/5 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                            {firstName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold text-white leading-tight">{firstName} {lastName}</h2>
                        <p className="text-[10px] text-purple-400 uppercase font-bold tracking-[0.2em] mt-2 px-2 py-0.5 bg-purple-500/10 rounded-full border border-purple-500/20">{profile?.role}</p>
                        <div className="mt-6 w-full pt-6 border-t border-white/5 text-left space-y-4">
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Mail size={16} className="text-purple-400" />
                                <span className="truncate">{profile?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                <Calendar size={16} className="text-purple-400" />
                                <span>{t('profile.registered_at')}: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Settings Form */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white/[0.02] rounded-2xl p-8 border border-white/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <form onSubmit={handleSave} className="space-y-6 relative z-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 leading-none">{t('profile.first_name')}</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                        placeholder={t('profile.placeholder_first_name')}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 leading-none">{t('profile.last_name')}</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                        placeholder={t('profile.placeholder_last_name')}
                                    />
                                </div>
                            </div>

                            {authUser?.role === 'professional' && (
                                <div className="pt-6 border-t border-white/5">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Calendar size={20} className="text-blue-400" />
                                        {t('profile.agenda_settings')}
                                    </h3>
                                    <div className="bg-blue-500/5 p-4 rounded-xl mb-4 text-xs text-blue-300 leading-relaxed border border-blue-500/20 backdrop-blur-sm">
                                        <p>{t('profile.calendar_help')}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 leading-none">{t('profile.calendar_id_label')}</label>
                                        <input
                                            type="text"
                                            value={calendarId}
                                            onChange={(e) => setCalendarId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono text-sm"
                                            placeholder={t('profile.calendar_id_placeholder')}
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm animate-fadeIn">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm animate-fadeIn">
                                    <CheckCircle size={18} />
                                    {success}
                                </div>
                            )}

                            <div className="flex justify-end pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:transform active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    {t('common.save_changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
        .shadow-card {
          box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
};

export default ProfileView;
