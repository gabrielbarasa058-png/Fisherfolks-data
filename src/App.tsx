import { useState } from 'react';
import {
  LayoutDashboard, Waves, ShieldAlert, Users, Fish,
  CloudSun, Bell, FileBarChart, Anchor, Menu, Presentation,
} from 'lucide-react';
import type { ViewKey } from './types';
import Dashboard from './views/Dashboard';
import ZoningView from './views/ZoningView';
import ComplianceView from './views/ComplianceView';
import FishersView from './views/FishersView';
import CatchesView from './views/CatchesView';
import BiodiversityView from './views/BiodiversityView';
import WeatherView from './views/WeatherView';
import NotificationsView from './views/NotificationsView';
import ReportsView from './views/ReportsView';
import PresentationView from './views/PresentationView';

const NAV_ITEMS: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dashboard', label: 'Home Dashboard', icon: LayoutDashboard },
  { key: 'zoning', label: 'Marine Zoning', icon: Waves },
  { key: 'compliance', label: 'Compliance & Enforcement', icon: ShieldAlert },
  { key: 'fishers', label: 'Fisher Registration', icon: Users },
  { key: 'catches', label: 'Catch & Fisheries', icon: Fish },
  { key: 'biodiversity', label: 'Biodiversity & Conservation', icon: Waves },
  { key: 'weather', label: 'Weather & Ocean', icon: CloudSun },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
];

const PRESENTATION_KEY = 'presentation';

function App() {
  const [activeView, setActiveView] = useState<ViewKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = (view: string) => {
    setActiveView(view as ViewKey);
    setMobileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 bg-slate-900 flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent activeView={activeView} onNavigate={navigate} />
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 flex flex-col">
            <SidebarContent activeView={activeView} onNavigate={navigate} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-slate-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Anchor className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Marine Blue Economy</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        {/* Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {activeView === 'dashboard' && <Dashboard onNavigate={navigate} />}
          {activeView === 'zoning' && <ZoningView />}
          {activeView === 'compliance' && <ComplianceView />}
          {activeView === 'fishers' && <FishersView />}
          {activeView === 'catches' && <CatchesView />}
          {activeView === 'biodiversity' && <BiodiversityView />}
          {activeView === 'weather' && <WeatherView />}
          {activeView === 'notifications' && <NotificationsView />}
          {activeView === 'reports' && <ReportsView />}
          {activeView === PRESENTATION_KEY && <PresentationView />}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  activeView,
  onNavigate,
}: {
  activeView: ViewKey;
  onNavigate: (view: string) => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Anchor className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight">Marine Blue Economy</div>
            <div className="text-slate-400 text-xs">Old Ferry Hub · Kenya</div>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Presentation Button */}
      <div className="px-4 pb-2">
        <button
          onClick={() => onNavigate(PRESENTATION_KEY)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeView === PRESENTATION_KEY
              ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'
          }`}
        >
          <Presentation className={`w-4.5 h-4.5 ${activeView === PRESENTATION_KEY ? 'text-cyan-400' : 'text-slate-500'}`} />
          Presentation
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          Marine Blue Economy Governance
          <br />
          Prototype v2.0
        </div>
      </div>
    </>
  );
}

export default App;
