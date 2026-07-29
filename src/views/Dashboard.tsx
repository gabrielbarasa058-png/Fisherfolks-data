import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  MarineZone, ConservationArea, SpeciesRecord, ComplianceIncident, Vessel,
  CatchRecord, GeofenceAlert, Notification,
} from '../types';
import { formatNumber, formatArea, titleCase, getColor, formatDate } from '../lib/format';
import {
  Waves, Shield, Fish, AlertTriangle, Ship, TrendingUp, TrendingDown,
  Activity, Globe, ChevronRight, Calendar, DollarSign, Bell,
  Users, CloudSun, FileBarChart, ShieldAlert, Anchor,
} from 'lucide-react';
interface DashboardProps {
  onNavigate: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [zones, setZones] = useState<MarineZone[]>([]);
  const [conservationAreas, setConservationAreas] = useState<ConservationArea[]>([]);
  const [species, setSpecies] = useState<SpeciesRecord[]>([]);
  const [incidents, setIncidents] = useState<ComplianceIncident[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [z, c, s, i, v, ca, al, no] = await Promise.all([
        supabase.from('marine_zones').select('*'),
        supabase.from('conservation_areas').select('*'),
        supabase.from('species_records').select('*'),
        supabase.from('compliance_incidents').select('*').order('date', { ascending: false }),
        supabase.from('vessels').select('*'),
        supabase.from('catches').select('*').order('landing_date', { ascending: false }),
        supabase.from('geofence_alerts').select('*').order('timestamp', { ascending: false }),
        supabase.from('notifications').select('*').order('sent_at', { ascending: false }),
      ]);
      setZones(z.data || []);
      setConservationAreas(c.data || []);
      setSpecies(s.data || []);
      setIncidents(i.data || []);
      setVessels(v.data || []);
      setCatches(ca.data || []);
      setAlerts(al.data || []);
      setNotifications(no.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeVessels = vessels.filter(v => v.license_status === 'active').length;
  const protectedAreas = conservationAreas.length;
  const todayCatches = catches.filter(c => c.landing_date === new Date().toISOString().split('T')[0]);
  const todayCatchWeight = todayCatches.reduce((sum, c) => sum + c.weight_kg, 0);
  const todayCatchValue = todayCatches.reduce((sum, c) => sum + (c.market_value_kes || 0), 0);
  const activeAlerts = alerts.filter(a => !a.acknowledged).length;
  const resolvedIncidents = incidents.filter(i => ['resolved', 'prosecuted'].includes(i.status)).length;
  const complianceRate = incidents.length > 0
    ? Math.round((resolvedIncidents / incidents.length) * 100)
    : 100;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  const stats = [
    {
      label: 'Active Vessels',
      value: activeVessels,
      sub: `${vessels.length} registered total`,
      icon: Ship,
      color: 'blue',
      onClick: () => onNavigate('fishers'),
    },
    {
      label: 'Protected Areas',
      value: protectedAreas,
      sub: `${formatArea(conservationAreas.reduce((s, c) => s + c.area_km2, 0))} protected`,
      icon: Shield,
      color: 'emerald',
      onClick: () => onNavigate('biodiversity'),
    },
    {
      label: 'Compliance Rate',
      value: `${complianceRate}%`,
      sub: `${resolvedIncidents}/${incidents.length} cases resolved`,
      icon: ShieldAlert,
      color: complianceRate >= 80 ? 'emerald' : complianceRate >= 60 ? 'amber' : 'red',
      onClick: () => onNavigate('compliance'),
    },
    {
      label: "Today's Catches",
      value: `${formatNumber(todayCatchWeight)} kg`,
      sub: `KES ${formatNumber(todayCatchValue)} market value`,
      icon: Fish,
      color: 'cyan',
      onClick: () => onNavigate('catches'),
    },
    {
      label: 'Active Alerts',
      value: activeAlerts,
      sub: `${alerts.length} total geofence alerts`,
      icon: AlertTriangle,
      color: activeAlerts > 0 ? 'red' : 'emerald',
      onClick: () => onNavigate('compliance'),
    },
    {
      label: 'Unread Notifications',
      value: unreadNotifications,
      sub: `${notifications.length} total sent`,
      icon: Bell,
      color: 'amber',
      onClick: () => onNavigate('notifications'),
    },
  ];

  const colorMap: Record<string, string> = {
    cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/20',
    emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20',
    amber: 'from-amber-500 to-amber-600 shadow-amber-500/20',
    red: 'from-red-500 to-red-600 shadow-red-500/20',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/20',
    teal: 'from-teal-500 to-teal-600 shadow-teal-500/20',
  };

  const recentIncidents = incidents.slice(0, 5);
  const recentAlerts = alerts.slice(0, 5);
  const decliningSpecies = species.filter(s => ['decreasing', 'collapsing'].includes(s.population_trend)).slice(0, 5);

  const quickLinks = [
    { label: 'Marine Zoning', icon: Waves, view: 'zoning', color: 'text-cyan-600 bg-cyan-50' },
    { label: 'Compliance', icon: ShieldAlert, view: 'compliance', color: 'text-red-600 bg-red-50' },
    { label: 'Fisher Registry', icon: Users, view: 'fishers', color: 'text-blue-600 bg-blue-50' },
    { label: 'Catch & Fisheries', icon: Fish, view: 'catches', color: 'text-teal-600 bg-teal-50' },
    { label: 'Biodiversity', icon: Activity, view: 'biodiversity', color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Weather', icon: CloudSun, view: 'weather', color: 'text-amber-600 bg-amber-50' },
    { label: 'Notifications', icon: Bell, view: 'notifications', color: 'text-orange-600 bg-orange-50' },
    { label: 'Reports', icon: FileBarChart, view: 'reports', color: 'text-slate-600 bg-slate-100' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-cyan-950 to-blue-950 p-8 sm:p-10">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500 rounded-full blur-3xl" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium mb-3">
            <Globe className="w-4 h-4" />
            <span>Kilifi Old Ferry Fishing Hub · Kilifi County, Kenya</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Ocean Governance Dashboard
          </h1>
          <p className="text-slate-300 max-w-2xl text-base sm:text-lg leading-relaxed">
            Integrated monitoring of marine zoning, compliance enforcement, fisher registration,
            catch landings, biodiversity, and weather for the Kilifi County coastline.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
              <Ship className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">{activeVessels} Active Vessels</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-white text-sm font-medium">{protectedAreas} Protected Areas</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-white text-sm font-medium">{activeAlerts} Active Alerts</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/10">
              <Fish className="w-4 h-4 text-cyan-400" />
              <span className="text-white text-sm font-medium">{formatNumber(todayCatchWeight)} kg Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.label}
              onClick={() => onNavigate(link.view)}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${link.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center">{link.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={stat.onClick}
              className="group bg-white rounded-xl p-5 border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br ${colorMap[stat.color]} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-sm font-medium text-slate-600 mt-0.5">{stat.label}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.sub}</div>
            </button>
          );
        })}
      </div>

      {/* Two Column Section: Recent Alerts + Recent Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geofence Alerts */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-slate-900">Live Geofence Alerts</h2>
            </div>
            <button
              onClick={() => onNavigate('compliance')}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColor(alert.severity) }}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {titleCase(alert.alert_type)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {alert.vessel_name || 'Unknown'} · {alert.zone_name || 'Unknown Zone'}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      alert.acknowledged
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-red-50 text-red-600'
                    }`}
                  >
                    {alert.acknowledged ? 'Acknowledged' : 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Recent Compliance Incidents</h2>
            </div>
            <button
              onClick={() => onNavigate('compliance')}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentIncidents.map((inc) => (
              <div key={inc.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColor(inc.severity) }}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {titleCase(inc.incident_type)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {inc.vessel_name || 'Unknown Vessel'} · {formatDate(inc.date)}
                      </div>
                    </div>
                  </div>
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${getColor(inc.status)}15`,
                      color: getColor(inc.status),
                    }}
                  >
                    {titleCase(inc.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Catch Summary + Declining Species */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Catch */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Fish className="w-5 h-5 text-cyan-500" />
              <h2 className="font-semibold text-slate-900">Today's Catch Landings</h2>
            </div>
            <button
              onClick={() => onNavigate('catches')}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {todayCatches.slice(0, 5).map((c) => (
              <div key={c.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-900">
                      {c.species_name || 'Unknown Species'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {c.gear_used} · {c.weight_kg} kg
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      KES {formatNumber(c.market_value_kes || 0)}
                    </div>
                    <div className={`text-xs ${c.verified ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {c.verified ? 'Verified' : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {todayCatches.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                No catch landings recorded today
              </div>
            )}
          </div>
        </div>

        {/* Declining Species */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Species in Decline</h2>
            </div>
            <button
              onClick={() => onNavigate('biodiversity')}
              className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {decliningSpecies.map((s) => (
              <div key={s.id} className="px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getColor(s.threat_category) }}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{s.species_name}</div>
                      <div className="text-xs text-slate-500">
                        {s.region} · {titleCase(s.exploitation_level)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.catch_tonnage !== null && s.catch_tonnage > 0 && (
                      <span className="text-xs text-slate-400">
                        {formatNumber(s.catch_tonnage)}t
                      </span>
                    )}
                    <TrendingDown className="w-4 h-4 text-red-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-xs font-medium">Latest Assessment</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {formatDate(species.reduce((latest, s) => {
              return !latest || (s.last_assessment_date && s.last_assessment_date > latest) ? s.last_assessment_date : latest;
            }, null as string | null))}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Total Penalties</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            KES {formatNumber(incidents.reduce((sum, i) => sum + i.penalty_amount, 0))}
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Recovering Species</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {species.filter(s => s.stock_status === 'recovering').length} species
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Anchor className="w-4 h-4" />
            <span className="text-xs font-medium">Marine Zones</span>
          </div>
          <div className="text-sm font-semibold text-slate-900">
            {zones.length} zones · {formatArea(zones.reduce((s, z) => s + z.area_km2, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}
