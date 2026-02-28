import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Bell } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        {
            id: "dashboard",
            icon: LayoutDashboard,
            label: "Inicio",
            path: "/admin/core/dashboard",
        },
        {
            id: "leads",
            icon: Users,
            label: "Bandeja",
            path: "/admin/core/crm/leads",
        },
        {
            id: "agenda",
            icon: Calendar,
            label: "Agenda",
            path: "/admin/core/agenda",
        },
        {
            id: "notifications",
            icon: Bell,
            label: "Notific.",
            path: "/admin/notifications",
        },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-safe">
            <div className="flex items-center justify-around px-2 py-3">
                {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center gap-1 min-w-[64px] transition-all active:scale-95 ${isActive ? 'text-medical-600' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <div className={`p-1.5 rounded-full ${isActive ? 'bg-medical-50' : 'bg-transparent'}`}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-medical-700' : 'text-gray-500'}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default MobileBottomNav;
