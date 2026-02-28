import React, { type ReactNode, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { io, Socket } from 'socket.io-client';
import { BACKEND_URL } from '../api/axios';
import { AlertCircle, X } from 'lucide-react';
import NotificationBell from './NotificationBell';
import MobileBottomNav from './MobileBottomNav';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const socketRef = useRef<Socket | null>(null);

  // Notification State
  const [notification, setNotification] = useState<{
    show: boolean;
    phone: string;
    reason: string;
  } | null>(null);

  // Global Socket Listener for Handoffs
  useEffect(() => {
    if (!user) return;

    // Conectar socket si no existe
    if (!socketRef.current) {
      // Connect to root namespace (matching ChatsView.tsx logic)
      socketRef.current = io(BACKEND_URL);
    }

    // Listener
    // Listener
    const handleHandoff = (data: { phone_number: string; reason: string }) => {

      // Mostrar notificación
      setNotification({
        show: true,
        phone: data.phone_number,
        reason: data.reason
      });

      // Auto-ocultar a los 5 segundos
      setTimeout(() => {
        setNotification(null);
      }, 5000);

      // Reproducir sonido (opcional, si el navegador lo permite)
      try {
        const audio = new Audio('/assets/notification.mp3');
        // Fallback or generic sound logic here if asset missing
        audio.play().catch(_e => { });
      } catch (e) { }
    };

    socketRef.current.on('HUMAN_HANDOFF', handleHandoff);

    return () => {
      socketRef.current?.off('HUMAN_HANDOFF', handleHandoff);
      // No desconectamos el socket aquí porque Layout se monta/desmonta poco, 
      // pero si navegamos fuera de app (logout), el socket debería morir.
      // Ojo: ChatsView también crea socket. Idealmente debería ser un Context.
      // Por ahora para cumplir el requerimiento rápido, duplicamos la conexión (low cost).
    };
  }, [user]);

  const handleNotificationClick = () => {
    if (notification) {
      // Navegar al chat seleccionando el teléfono
      navigate('/chats', { state: { selectPhone: notification.phone } });
      setNotification(null);
    }
  };

  return (
    <div className="flex h-screen bg-[#050505] text-white relative overflow-hidden">
      {/* Mobile Backdrop - Not needed with bottom nav, but kept for intermediate tablets if any */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 hidden md:block lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop */}
      <div className={`
        hidden md:flex flex-col
        fixed lg:relative inset-y-0 left-0 z-50 transition-all duration-300 transform
        w-72 lg:w-auto
        ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl shadow-blue-500/10' : '-translate-x-full lg:translate-x-0 shadow-none'}
        ${sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'}
      `}>
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 w-full min-w-0 pb-16 md:pb-0`}
      >
        {/* Top Header */}
        <header className="h-16 bg-[#050505]/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Hamburger Button for Tablet */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="hidden md:block lg:hidden p-2 hover:bg-white/5 rounded-lg text-gray-400"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-current rounded-full"></span>
                <span className="w-full h-0.5 bg-current rounded-full"></span>
                <span className="w-full h-0.5 bg-current rounded-full"></span>
              </div>
            </button>
            <h1 className="text-lg lg:text-xl font-semibold text-white tracking-tight truncate max-w-[200px] md:max-w-none ml-2 md:ml-0">
              {t('layout.app_title_crm')}
            </h1>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Tenant/Entity Selector - Hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm">
              <span className="text-gray-500">{t('layout.entity')}:</span>
              <span className="font-medium text-blue-400">{t('layout.entity_principal')}</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Notification Bell */}
              <NotificationBell className="block" />

              <div className="hidden xs:flex flex-col items-end">
                <span className="text-xs lg:text-sm font-medium text-white">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] lg:text-xs text-gray-500 uppercase leading-none font-semibold">{user?.role}</span>
              </div>
              <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-semibold text-sm lg:text-lg shadow-lg shadow-blue-500/10">
                {user?.email?.[0].toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 min-h-0 bg-transparent overflow-hidden">
          {children}
        </div>
      </main>

      {/* GLOBAL NOTIFICATION TOAST */}
      {notification && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white rounded-lg shadow-xl border-l-4 border-orange-500 p-4 transform transition-all duration-300 ease-in-out cursor-pointer hover:bg-gray-50"
          onClick={handleNotificationClick}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-orange-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">🔔 {t('layout.notification_handoff')}</h3>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {notification.phone}. {t('layout.notification_reason')}: {notification.reason}
              </p>
              <div className="mt-2 text-xs text-orange-600 font-medium">
                {t('layout.click_to_open_chat')}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setNotification(null); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
      {/* Bottom Navigation for Mobile */}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
