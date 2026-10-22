import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Ship,
  Anchor,
  CalendarDays,
  Boxes,
  Users,
  UserCheck,
  LayoutDashboard,
  Compass,
  Menu,
  X,
  LogOut,
  Shield,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Genel Bakış', icon: LayoutDashboard },
  { path: '/map', label: 'Canlı Harita', icon: Compass },
  { path: '/ships', label: 'Gemiler', icon: Ship },
  { path: '/ports', label: 'Limanlar', icon: Anchor },
  { path: '/visits', label: 'Gemi Ziyaretleri', icon: CalendarDays },
  { path: '/cargoes', label: 'Yükler & Kargo', icon: Boxes },
  { path: '/crew', label: 'Mürettebat', icon: Users },
  { path: '/assignments', label: 'Gemiye Personel Ata', icon: UserCheck },
  { path: '/reports', label: 'Raporlar & Veri Yönetimi', icon: BarChart3 },
  { path: '/security-lab', label: 'Güvenlik & Denetim', icon: ShieldCheck },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentItem = NAV_ITEMS.find((item) => item.path === location.pathname);
  const currentTitle = currentItem?.label || 'Liman Gemi Takip Sistemi';

  const getRoleText = (role?: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'admin') return 'Yönetici';
    if (r === 'portmanager') return 'Liman Müdürü';
    if (r === 'operator') return 'Operatör';
    return 'İzleyici';
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* Mobil menü arka planı */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sol Menü (Sidebar) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo / Başlık */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Anchor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-white">Liman Takip</h1>
              <p className="text-xs text-slate-400">Gemi Yönetim Sistemi</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menü Linkleri */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Alt Bilgi */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-medium text-slate-300">Liman Gemi Takip</p>
          <p className="text-[11px] text-slate-500 mt-0.5">.NET Core 8 & React</p>
        </div>
      </aside>

      {/* Ana İçerik */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Üst Bar (Header) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-bold text-slate-800">{currentTitle}</h2>
          </div>

          {/* Kullanıcı Profili ve Çıkış */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-700">
                    {user.fullName || user.username}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    @{user.username}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-600" />
                  {getRoleText(user.role)}
                </span>

                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Çıkış Yap</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Sayfa İçeriği */}
        <main className={`flex-1 ${location.pathname === '/map' ? 'overflow-y-auto lg:overflow-hidden p-3' : 'overflow-y-auto p-6'}`}>
          <div className={location.pathname === '/map' ? 'h-full w-full' : 'max-w-6xl mx-auto'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
