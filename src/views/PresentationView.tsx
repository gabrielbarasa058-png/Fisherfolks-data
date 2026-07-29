import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type {
  MarineZone, ConservationArea, SpeciesRecord, ComplianceIncident,
  Vessel, CatchRecord, Fisher, GeofenceAlert, Inspection,
  HabitatHealth, RestorationProject, FishingLicense,
} from '../types';
import { formatNumber } from '../lib/format';
import {
  ChevronLeft, ChevronRight, Anchor, Waves, ShieldAlert, Users, Fish,
  CloudSun, Bell, FileBarChart, Ship, AlertTriangle, TrendingUp,
  TrendingDown, MapPin, Navigation, Radio, Target, Sprout, Leaf,
  CheckCircle2, Gavel, DollarSign, Calendar, Globe, Award,
  ArrowRight, BarChart3, Activity, Eye, LayoutDashboard,
} from 'lucide-react';

export default function PresentationView() {
  const [slide, setSlide] = useState(0);
  const [data, setData] = useState<SlideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [z, c, s, i, v, ca, f, al, ins, hab, proj, lic] = await Promise.all([
        supabase.from('marine_zones').select('*'),
        supabase.from('conservation_areas').select('*'),
        supabase.from('species_records').select('*'),
        supabase.from('compliance_incidents').select('*'),
        supabase.from('vessels').select('*'),
        supabase.from('catches').select('*').order('landing_date', { ascending: false }),
        supabase.from('fishers').select('*'),
        supabase.from('geofence_alerts').select('*').order('timestamp', { ascending: false }),
        supabase.from('inspections').select('*'),
        supabase.from('habitat_health').select('*'),
        supabase.from('restoration_projects').select('*'),
        supabase.from('fishing_licenses').select('*'),
      ]);
      setData({
        zones: z.data || [], conservationAreas: c.data || [], species: s.data || [],
        incidents: i.data || [], vessels: v.data || [], catches: ca.data || [],
        fishers: f.data || [], alerts: al.data || [], inspections: ins.data || [],
        habitats: hab.data || [], projects: proj.data || [], licenses: lic.data || [],
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  const next = useCallback(() => setSlide(s => Math.min(s + 1, SLIDES.length - 1)), []);
  const prev = useCallback(() => setSlide(s => Math.max(s - 1, 0)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') setSlide(0);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const SlideComponent = SLIDES[slide].component;

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Slide Content */}
      <div className="flex-1 relative overflow-hidden">
        <div
          key={slide}
          className="absolute inset-0 animate-[fadeIn_0.5s_ease-out]"
          style={{ animationName: 'slideFadeIn' }}
        >
          <SlideComponent data={data} />
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="flex-shrink-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={prev}
            disabled={slide === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          {/* Slide Indicators */}
          <div className="flex items-center gap-1.5">
            {SLIDES.map((s, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  i === slide ? 'w-8 bg-cyan-500' : 'w-2 bg-slate-600 hover:bg-slate-500'
                }`}
                title={s.title}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 font-medium">
              {slide + 1} / {SLIDES.length}
            </span>
            <button
              onClick={next}
              disabled={slide === SLIDES.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideFadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

interface SlideData {
  zones: MarineZone[];
  conservationAreas: ConservationArea[];
  species: SpeciesRecord[];
  incidents: ComplianceIncident[];
  vessels: Vessel[];
  catches: CatchRecord[];
  fishers: Fisher[];
  alerts: GeofenceAlert[];
  inspections: Inspection[];
  habitats: HabitatHealth[];
  projects: RestorationProject[];
  licenses: FishingLicense[];
}

type SlideProps = { data: SlideData };

const SLIDES: { title: string; component: React.FC<SlideProps> }[] = [
  { title: 'Title', component: TitleSlide },
  { title: 'Challenge', component: ChallengeSlide },
  { title: 'Solution Overview', component: SolutionSlide },
  { title: 'System Architecture', component: ArchitectureSlide },
  { title: 'Marine Zoning', component: ZoningSlide },
  { title: 'Compliance & Enforcement', component: ComplianceSlide },
  { title: 'GPS Tracking Integration', component: GPSSlide },
  { title: 'Fisher Registration', component: FisherSlide },
  { title: 'Catch Monitoring', component: CatchSlide },
  { title: 'Biodiversity & Conservation', component: BiodiversitySlide },
  { title: 'Weather & Ocean', component: WeatherSlide },
  { title: 'Notifications', component: NotificationsSlide },
  { title: 'Reports & Analytics', component: ReportsSlide },
  { title: 'Impact & Results', component: ImpactSlide },
  { title: 'What Makes Us Unique', component: UniqueSlide },
  { title: 'Thank You', component: ThankYouSlide },
];

// ============================================================
// SLIDE 1: TITLE
// ============================================================
function TitleSlide(_: SlideProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-500 rounded-full blur-3xl" />
      </div>
      <div className="relative text-center px-8 max-w-4xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/30 mb-8">
          <Anchor className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4 leading-tight">
          Marine Blue Economy Governance Dashboard
        </h1>
        <p className="text-2xl text-cyan-400 font-medium mb-3">
          Marine Blue Economy Governance Dashboard
        </p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          An integrated platform for marine zoning, compliance enforcement,
          fisher registration, catch monitoring, and biodiversity conservation
          across the Kilifi County coastline.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Kilifi Old Ferry Hub, Kenya</span>
          <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> 2024</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 2: CHALLENGE
// ============================================================
function ChallengeSlide(_: SlideProps) {
  const challenges = [
    { icon: ShieldAlert, title: 'Enforcement Gap', desc: 'Limited capacity to monitor vessel activity and detect illegal fishing in real-time across vast coastal waters.' },
    { icon: Users, title: 'Unregistered Fishers', desc: 'Many artisanal fishers operate without proper registration, licenses, or BMU membership records.' },
    { icon: Fish, title: 'Declining Stocks', desc: 'Overfishing, destructive gear, and habitat degradation threatening livelihoods of coastal communities.' },
    { icon: AlertTriangle, title: 'No Early Warning', desc: 'Fishers lack timely weather alerts and closure notices, leading to safety risks and unintentional violations.' },
    { icon: FileBarChart, title: 'Fragmented Data', desc: 'Catch records, compliance data, and biodiversity assessments scattered across paper files and disconnected systems.' },
    { icon: Waves, title: 'Habitat Loss', desc: 'Coral reefs, mangroves, and seagrass beds declining due to uncoordinated management and monitoring.' },
  ];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-10 bg-red-500 rounded-full" />
          <h2 className="text-4xl font-bold">The Challenge</h2>
        </div>
        <p className="text-slate-400 text-lg mb-10 ml-4">Fisheries management along the Kilifi coast faces six critical barriers</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {challenges.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-red-500/30 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{c.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{c.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 3: SOLUTION OVERVIEW
// ============================================================
function SolutionSlide(_: SlideProps) {
  const modules = [
    { icon: LayoutDashboard, label: 'Home Dashboard', color: 'from-cyan-500 to-blue-600' },
    { icon: Waves, label: 'Marine Zoning', color: 'from-teal-500 to-cyan-600' },
    { icon: ShieldAlert, label: 'Compliance & Enforcement', color: 'from-red-500 to-rose-600' },
    { icon: Users, label: 'Fisher Registration', color: 'from-blue-500 to-indigo-600' },
    { icon: Fish, label: 'Catch & Fisheries', color: 'from-cyan-500 to-teal-600' },
    { icon: Leaf, label: 'Biodiversity & Conservation', color: 'from-emerald-500 to-green-600' },
    { icon: CloudSun, label: 'Weather & Ocean', color: 'from-amber-500 to-orange-600' },
    { icon: Bell, label: 'Notifications', color: 'from-orange-500 to-red-500' },
    { icon: FileBarChart, label: 'Reports & Analytics', color: 'from-slate-500 to-slate-700' },
  ];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-cyan-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-10 bg-cyan-500 rounded-full" />
          <h2 className="text-4xl font-bold">Our Solution</h2>
        </div>
        <p className="text-slate-400 text-lg mb-10 ml-4">A single, integrated dashboard organized around operational tasks — not just information display</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {modules.map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:scale-105 transition-transform">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-semibold text-white">{m.label}</h3>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 text-slate-400 text-sm">
          <ArrowRight className="w-4 h-4 text-cyan-400" />
          <span>9 operational modules, 13 database tables, real-time GPS integration</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 4: ARCHITECTURE
// ============================================================
function ArchitectureSlide(_: SlideProps) {
  const layers = [
    {
      title: 'Data Collection Layer',
      color: 'border-cyan-500/30 bg-cyan-500/5',
      items: ['Waterproof GPS tracking devices on vessels', 'BMU officers record catch landings at sites', 'KWS & fisheries officers log inspections', 'Weather data from KMA & satellite feeds'],
    },
    {
      title: 'Data Storage Layer',
      color: 'border-blue-500/30 bg-blue-500/5',
      items: ['Supabase PostgreSQL database', '13 tables covering all operational data', 'Row-level security policies', 'Real-time data synchronization'],
    },
    {
      title: 'Application Layer',
      color: 'border-emerald-500/30 bg-emerald-500/5',
      items: ['React + TypeScript + Vite frontend', 'Interactive Leaflet GIS maps', 'Live geofence alert system', 'Automated report generation'],
    },
    {
      title: 'Output Layer',
      color: 'border-amber-500/30 bg-amber-500/5',
      items: ['SMS, email & in-app notifications', 'PDF & Excel report exports', 'Compliance heat maps', 'County performance dashboards'],
    },
  ];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-10 bg-blue-500 rounded-full" />
          <h2 className="text-4xl font-bold">System Architecture</h2>
        </div>
        <p className="text-slate-400 text-lg mb-10 ml-4">Four-layer architecture connecting field operations to decision-makers</p>
        <div className="space-y-4">
          {layers.map((layer, i) => (
            <div key={i} className={`rounded-xl p-5 border ${layer.color}`}>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                <h3 className="text-lg font-semibold text-white">{layer.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 ml-11">
                {layer.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-2 text-sm text-slate-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 5: MARINE ZONING
// ============================================================
function ZoningSlide({ data }: SlideProps) {
  const open = data.zones.filter(z => z.zone_status === 'open').length;
  const closed = data.zones.filter(z => z.zone_status === 'closed').length;
  const seasonal = data.zones.filter(z => z.zone_status === 'seasonal_closure').length;
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-teal-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Marine Zoning Module</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Interactive GIS map with clickable zones, status tracking, and licensing requirements</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
            <div className="text-3xl font-bold text-emerald-400">{open}</div>
            <div className="text-sm text-slate-400 mt-1">Open Zones</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 text-center">
            <div className="text-3xl font-bold text-red-400">{closed}</div>
            <div className="text-sm text-slate-400 mt-1">Closed Zones</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-center">
            <div className="text-3xl font-bold text-amber-400">{seasonal}</div>
            <div className="text-sm text-slate-400 mt-1">Seasonal Closures</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: MapPin, title: 'Interactive GIS Map', desc: '3-layer Leaflet map (satellite, ocean, street) with clickable zone boundaries and popup details.' },
            { icon: Award, title: 'Licensing Requirements', desc: 'Each zone displays required permits, BMU registration, and gear restrictions for legal access.' },
            { icon: Navigation, title: 'Search by Location', desc: 'Find zones by beach name, landing site, or GPS coordinates. Quick lookup for officers in the field.' },
            { icon: CheckCircle2, title: 'Offline Boundaries', desc: 'Download zone boundaries as GeoJSON files for use in offline GPS devices and field mapping tools.' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 6: COMPLIANCE & ENFORCEMENT
// ============================================================
function ComplianceSlide({ data }: SlideProps) {
  const activeAlerts = data.alerts.filter(a => !a.acknowledged).length;
  const openCases = data.incidents.filter(i => ['open', 'under_investigation'].includes(i.status)).length;
  const prosecuted = data.incidents.filter(i => i.status === 'prosecuted').length;
  const penalties = data.incidents.reduce((s, i) => s + i.penalty_amount, 0);
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-red-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Compliance & Enforcement</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Our highest priority module — real-time vessel tracking, geofencing, and enforcement actions</p>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 text-center">
            <div className="text-3xl font-bold text-red-400">{activeAlerts}</div>
            <div className="text-xs text-slate-400 mt-1">Active Alerts</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-center">
            <div className="text-3xl font-bold text-amber-400">{openCases}</div>
            <div className="text-xs text-slate-400 mt-1">Open Cases</div>
          </div>
          <div className="bg-slate-500/10 rounded-xl p-4 border border-slate-500/20 text-center">
            <div className="text-3xl font-bold text-slate-300">{prosecuted}</div>
            <div className="text-xs text-slate-400 mt-1">Prosecuted</div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
            <div className="text-2xl font-bold text-emerald-400">{formatNumber(penalties)}</div>
            <div className="text-xs text-slate-400 mt-1">KES Penalties</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Navigation, title: 'Vessel Tracking', desc: 'Live GPS map showing real-time vessel positions, speed, heading, and track history with color-coded status.' },
            { icon: Radio, title: 'Geofence Alerts', desc: 'Automatic alerts when vessels enter restricted or seasonally closed zones. Officers can acknowledge in real-time.' },
            { icon: Gavel, title: 'Violation History', desc: 'Complete incident records with severity, status tracking, penalty amounts, and resolution outcomes.' },
            { icon: FileBarChart, title: 'Digital Inspections', desc: 'Officers record inspection results, gear checks, catch verification, and violations found — all digital.' },
            { icon: CheckCircle2, title: 'Catch Verification', desc: 'Link inspections to catch landings. Verify species, weight, and gear at the point of landing.' },
            { icon: Activity, title: 'Compliance Heat Map', desc: 'Visual hotspot analysis combining incidents and alerts per zone to target enforcement resources.' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-semibold text-white mb-1 text-sm">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 7: GPS TRACKING INTEGRATION
// ============================================================
function GPSSlide({ data }: SlideProps) {
  const trackedVessels = data.vessels.filter(v => v.gps_device_id);
  const alertVessels = data.alerts.filter(a => !a.acknowledged).length;
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Radio className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">GPS Tracking Integration</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Waterproof GPS devices transmit vessel positions to the dashboard in real-time</p>

        {/* Flow Diagram */}
        <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center min-w-[140px]">
            <Ship className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">GPS Device</div>
            <div className="text-xs text-slate-400">On vessel</div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-500" />
          <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20 text-center min-w-[140px]">
            <Navigation className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">Satellite</div>
            <div className="text-xs text-slate-400">Position relay</div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-500" />
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center min-w-[140px]">
            <Activity className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">Dashboard</div>
            <div className="text-xs text-slate-400">Real-time map</div>
          </div>
          <ArrowRight className="w-6 h-6 text-slate-500" />
          <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 text-center min-w-[140px]">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <div className="text-sm font-semibold text-white">Auto Alert</div>
            <div className="text-xs text-slate-400">If geofence breached</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <div className="text-3xl font-bold text-cyan-400">{trackedVessels.length}</div>
            <div className="text-sm text-slate-400 mt-1">Vessels with GPS</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <div className="text-3xl font-bold text-emerald-400">{data.vessels.length}</div>
            <div className="text-sm text-slate-400 mt-1">Total Registered</div>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 text-center">
            <div className="text-3xl font-bold text-red-400">{alertVessels}</div>
            <div className="text-sm text-slate-400 mt-1">Active Alerts</div>
          </div>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-5 border border-slate-700/50">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" /> How Geofencing Works
          </h3>
          <div className="space-y-2 text-sm text-slate-400">
            <p>1. Each marine zone has defined GPS boundary coordinates stored in the database.</p>
            <p>2. When a vessel's GPS position falls inside a restricted or closed zone, the system automatically generates an alert.</p>
            <p>3. Alerts are classified by severity (critical, high, medium, low) based on zone type and violation history.</p>
            <p>4. Fisheries officers receive instant notifications and can acknowledge or escalate each alert.</p>
            <p>5. All GPS track data is stored for historical analysis and compliance heat map generation.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 8: FISHER REGISTRATION
// ============================================================
function FisherSlide({ data }: SlideProps) {
  const activeLicenses = data.licenses.filter(l => l.status === 'active').length;
  const expiredLicenses = data.licenses.filter(l => l.status === 'expired').length;
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-blue-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Fisher Registration</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Complete records for fishers, vessels, crew, licenses, and emergency contacts</p>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
            <div className="text-3xl font-bold text-blue-400">{data.fishers.length}</div>
            <div className="text-xs text-slate-400 mt-1">Registered Fishers</div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
            <div className="text-3xl font-bold text-emerald-400">{activeLicenses}</div>
            <div className="text-xs text-slate-400 mt-1">Active Licenses</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-center">
            <div className="text-3xl font-bold text-amber-400">{expiredLicenses}</div>
            <div className="text-xs text-slate-400 mt-1">Expired</div>
          </div>
          <div className="bg-slate-500/10 rounded-xl p-4 border border-slate-500/20 text-center">
            <div className="text-3xl font-bold text-slate-300">{data.vessels.length}</div>
            <div className="text-xs text-slate-400 mt-1">Registered Vessels</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: Users, title: 'Fisher Profiles', desc: 'Full name, national ID, phone, gender, DOB, photo, and fishing experience years.' },
            { icon: Award, title: 'BMU Membership', desc: 'Beach Management Unit affiliation, role (Chairman, Secretary, Treasurer, Member), and landing site assignment.' },
            { icon: Ship, title: 'Vessel & Crew Records', desc: 'Vessel registration, type, license status, GPS device ID, crew member assignments, and boat owner details.' },
            { icon: AlertTriangle, title: 'Emergency Contacts', desc: 'Name, phone, and relationship for each fisher — critical for safety at sea incidents.' },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 9: CATCH MONITORING
// ============================================================
function CatchSlide({ data }: SlideProps) {
  const totalWeight = data.catches.reduce((s, c) => s + c.weight_kg, 0);
  const totalValue = data.catches.reduce((s, c) => s + (c.market_value_kes || 0), 0);
  const verified = data.catches.filter(c => c.verified).length;
  const verificationRate = data.catches.length > 0 ? Math.round((verified / data.catches.length) * 100) : 0;

  const speciesBreakdown: Record<string, number> = {};
  data.catches.forEach(c => {
    const name = c.species_name || 'Unknown';
    speciesBreakdown[name] = (speciesBreakdown[name] || 0) + c.weight_kg;
  });
  const topSpecies = Object.entries(speciesBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-cyan-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Catch Monitoring</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Officers record landings; the system auto-generates trends and reports</p>

        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/20 text-center">
            <div className="text-3xl font-bold text-cyan-400">{formatNumber(totalWeight)}</div>
            <div className="text-xs text-slate-400 mt-1">kg Total Catch</div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 text-center">
            <div className="text-2xl font-bold text-emerald-400">{formatNumber(totalValue)}</div>
            <div className="text-xs text-slate-400 mt-1">KES Market Value</div>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 text-center">
            <div className="text-3xl font-bold text-blue-400">{data.catches.length}</div>
            <div className="text-xs text-slate-400 mt-1">Landings Recorded</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 text-center">
            <div className="text-3xl font-bold text-amber-400">{verificationRate}%</div>
            <div className="text-xs text-slate-400 mt-1">Verification Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" /> Top Species by Weight
            </h3>
            <div className="space-y-3">
              {topSpecies.map(([name, weight]) => {
                const pct = (weight / totalWeight) * 100;
                return (
                  <div key={name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-300">{name}</span>
                      <span className="text-slate-400">{formatNumber(weight)} kg</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" /> What Officers Record
            </h3>
            <div className="space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2"><Fish className="w-4 h-4 text-cyan-400" /> Species caught</p>
              <p className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" /> Weight in kilograms</p>
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400" /> Landing site</p>
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-cyan-400" /> Date and time of landing</p>
              <p className="flex items-center gap-2"><Award className="w-4 h-4 text-cyan-400" /> Fishing gear used</p>
              <p className="flex items-center gap-2"><DollarSign className="w-4 h-4 text-cyan-400" /> Market value in KES</p>
              <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Verification status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 10: BIODIVERSITY & CONSERVATION
// ============================================================
function BiodiversitySlide({ data }: SlideProps) {
  const healthy = data.habitats.filter(h => h.health_status === 'green').length;
  const caution = data.habitats.filter(h => h.health_status === 'yellow').length;
  const critical = data.habitats.filter(h => h.health_status === 'red').length;
  const declining = data.species.filter(s => s.population_trend === 'decreasing').length;
  const recovering = data.species.filter(s => s.stock_status === 'recovering' || s.population_trend === 'increasing').length;
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-emerald-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Biodiversity & Conservation</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Simplified with traffic-light colors for quick understanding</p>

        {/* Traffic Light System */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20 text-center">
            <div className="w-6 h-6 rounded-full bg-emerald-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-emerald-400">{healthy}</div>
            <div className="text-sm text-slate-400 mt-1">Healthy Sites</div>
          </div>
          <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/20 text-center">
            <div className="w-6 h-6 rounded-full bg-amber-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-amber-400">{caution}</div>
            <div className="text-sm text-slate-400 mt-1">Need Attention</div>
          </div>
          <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/20 text-center">
            <div className="w-6 h-6 rounded-full bg-red-500 mx-auto mb-2" />
            <div className="text-3xl font-bold text-red-400">{critical}</div>
            <div className="text-sm text-slate-400 mt-1">Urgent Action</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Fish className="w-5 h-5 text-emerald-400" /> Species Monitoring
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Tracked</span>
                <span className="text-lg font-bold text-white">{data.species.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400 flex items-center gap-1.5"><TrendingDown className="w-4 h-4 text-red-400" /> Declining</span>
                <span className="text-lg font-bold text-red-400">{declining}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-400" /> Recovering</span>
                <span className="text-lg font-bold text-emerald-400">{recovering}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-700">Tracks population trends, exploitation levels, stock status, and threat categories for each species.</p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-teal-400" /> Restoration Projects
            </h3>
            <div className="space-y-3">
              {data.projects.slice(0, 4).map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300 truncate">{p.project_name}</span>
                    <span className="text-slate-400 ml-2">{p.progress_percentage || 0}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: `${p.progress_percentage || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {['Coral Reef Health', 'Mangrove Health', 'Seagrass Coverage', 'Threatened Species Sightings', 'Conservation Areas', 'Effectiveness Scores'].map(tag => (
            <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 11: WEATHER & OCEAN
// ============================================================
function WeatherSlide(_: SlideProps) {
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-amber-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <CloudSun className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Weather & Ocean Conditions</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Improves safety and helps fishers plan their trips</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Activity, label: 'Wind Speed', value: '12 knots', sub: 'NE direction', color: 'text-emerald-400' },
            { icon: Waves, label: 'Wave Height', value: '1.2 m', sub: 'Moderate', color: 'text-emerald-400' },
            { icon: Navigation, label: 'Tide Info', value: 'Rising', sub: '2.8m height', color: 'text-cyan-400' },
            { icon: CloudSun, label: 'Rain Forecast', value: 'Clear', sub: 'No rain expected', color: 'text-emerald-400' },
            { icon: Target, label: 'Sea Surface Temp', value: '27.5°C', sub: 'Normal range', color: 'text-emerald-400' },
            { icon: Eye, label: 'Visibility', value: '15 km', sub: 'Good', color: 'text-emerald-400' },
          ].map((w, i) => {
            const Icon = w.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className={`w-5 h-5 ${w.color}`} />
                  <span className="text-sm text-slate-400">{w.label}</span>
                </div>
                <div className={`text-2xl font-bold ${w.color}`}>{w.value}</div>
                <div className="text-xs text-slate-500 mt-1">{w.sub}</div>
              </div>
            );
          })}
        </div>

        <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/20">
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Fisher Safety Advisory
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">5</div>
              <div className="text-sm text-slate-400">Safe to Fish</div>
              <div className="text-xs text-slate-500 mt-1">Wind &lt; 16 knots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">2</div>
              <div className="text-sm text-slate-400">Caution Advised</div>
              <div className="text-xs text-slate-500 mt-1">Wind 10-18 knots</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">2</div>
              <div className="text-sm text-slate-400">Unsafe</div>
              <div className="text-xs text-slate-500 mt-1">Wind ≥ 16 knots</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 12: NOTIFICATIONS
// ============================================================
function NotificationsSlide(_: SlideProps) {
  const types = [
    { icon: Calendar, label: 'Closed-Season Notices', color: 'bg-amber-500/10 text-amber-400' },
    { icon: AlertTriangle, label: 'Weather Warnings', color: 'bg-red-500/10 text-red-400' },
    { icon: ShieldAlert, label: 'Illegal Fishing Alerts', color: 'bg-red-500/10 text-red-400' },
    { icon: Award, label: 'License Renewal Reminders', color: 'bg-blue-500/10 text-blue-400' },
    { icon: FileBarChart, label: 'New Regulations', color: 'bg-cyan-500/10 text-cyan-400' },
  ];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-orange-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Notifications</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Multi-channel alerts delivered by SMS, email, and in-app messaging</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {types.map((t, i) => {
            const Icon = t.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${t.color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="font-semibold text-white">{t.label}</span>
              </div>
            );
          })}
        </div>

        {/* Delivery Channels */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h3 className="font-semibold text-white mb-4">Delivery Channels</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">SMS</span>
              </div>
              <div className="text-sm font-medium text-slate-300">SMS Text</div>
              <div className="text-xs text-slate-500 mt-1">Reaches fishers without smartphones</div>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">@</span>
              </div>
              <div className="text-sm font-medium text-slate-300">Email</div>
              <div className="text-xs text-slate-500 mt-1">For officers and organizations</div>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-7 h-7 text-emerald-400 mx-auto" />
              </div>
              <div className="text-sm font-medium text-slate-300">In-App</div>
              <div className="text-xs text-slate-500 mt-1">Real-time dashboard alerts</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 13: REPORTS & ANALYTICS
// ============================================================
function ReportsSlide(_: SlideProps) {
  const reports = [
    { icon: Fish, label: 'Monthly Fisheries Report', desc: 'Catch volumes, landing site summaries, fishing effort' },
    { icon: ShieldAlert, label: 'Compliance Report', desc: 'Violations, inspections, geofence alerts, enforcement' },
    { icon: BarChart3, label: 'Catch Report', desc: 'Species breakdown, gear analysis, market value trends' },
    { icon: Leaf, label: 'Biodiversity Report', desc: 'Species status, habitat health, conservation projects' },
    { icon: TrendingUp, label: 'County Performance', desc: 'Key performance indicators for Kilifi County' },
  ];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center shadow-lg">
            <FileBarChart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">Reports & Analytics</h2>
        </div>
        <p className="text-slate-400 text-lg mb-8 ml-4">Automatic report generation with PDF and Excel export</p>

        <div className="space-y-3 mb-8">
          {reports.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{r.label}</h3>
                  <p className="text-sm text-slate-400">{r.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-500" />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
              <FileBarChart className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="font-semibold text-white">Export as PDF</div>
              <div className="text-sm text-slate-400">Print-ready formatted reports</div>
            </div>
          </div>
          <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="font-semibold text-white">Export as Excel</div>
              <div className="text-sm text-slate-400">CSV format for data analysis</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 14: IMPACT & RESULTS
// ============================================================
function ImpactSlide({ data }: SlideProps) {
  const stats = [
    { value: data.vessels.length, label: 'Vessels Registered', icon: Ship },
    { value: data.fishers.length, label: 'Fishers in Registry', icon: Users },
    { value: data.zones.length, label: 'Marine Zones Mapped', icon: Waves },
    { value: data.conservationAreas.length, label: 'Protected Areas', icon: ShieldAlert },
    { value: data.species.length, label: 'Species Tracked', icon: Fish },
    { value: data.projects.length, label: 'Restoration Projects', icon: Sprout },
    { value: data.inspections.length, label: 'Inspections Conducted', icon: CheckCircle2 },
    { value: data.alerts.length, label: 'Geofence Alerts Generated', icon: AlertTriangle },
  ];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-10 bg-cyan-500 rounded-full" />
          <h2 className="text-4xl font-bold">Impact & Results</h2>
        </div>
        <p className="text-slate-400 text-lg mb-10 ml-4">What the system delivers for Kilifi County fisheries management</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 text-center">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
            <h3 className="font-semibold text-emerald-400 mb-2">For Fishers</h3>
            <p className="text-sm text-slate-400">Real-time weather alerts, zone status updates, and license renewal reminders keep fishers safe and compliant.</p>
          </div>
          <div className="bg-cyan-500/10 rounded-xl p-5 border border-cyan-500/20">
            <h3 className="font-semibold text-cyan-400 mb-2">For Officers</h3>
            <p className="text-sm text-slate-400">Live vessel tracking, digital inspections, and geofence alerts enable proactive enforcement instead of reactive response.</p>
          </div>
          <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20">
            <h3 className="font-semibold text-blue-400 mb-2">For County</h3>
            <p className="text-sm text-slate-400">Automated reports, performance indicators, and data-driven insights support evidence-based fisheries policy decisions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 15: WHAT MAKES US UNIQUE
// ============================================================
function UniqueSlide(_: SlideProps) {
  const features = [
    { icon: Radio, title: 'Waterproof GPS Integration', desc: 'Purpose-built for artisanal fishing vessels operating in challenging marine conditions. Not adapted from industrial systems.' },
    { icon: ShieldAlert, title: 'Real-Time Geofencing', desc: 'Automatic detection and alerting when vessels enter restricted zones — no manual monitoring required.' },
    { icon: Users, title: 'BMU-Centric Design', desc: 'Built around Beach Management Units — the actual governance structure used by Kenyan coastal communities.' },
    { icon: Bell, title: 'Multi-Channel Notifications', desc: 'SMS alerts reach fishers without smartphones. The system works for everyone, not just those with technology access.' },
    { icon: Leaf, title: 'Integrated Conservation', desc: 'Zoning, compliance, and biodiversity in one system. Protected areas, habitat health, and restoration projects linked to enforcement.' },
    { icon: FileBarChart, title: 'Automated Reporting', desc: 'County performance indicators generated automatically. No more manual data compilation for monthly reports.' },
  ];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-950 via-purple-950 to-blue-950 text-white p-8 sm:p-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Target className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl font-bold">What Makes Us Unique</h2>
        </div>
        <p className="text-slate-400 text-lg mb-10 ml-4">Six features that set this system apart from existing fisheries management platforms</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SLIDE 16: THANK YOU
// ============================================================
function ThankYouSlide(_: SlideProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-emerald-500 rounded-full blur-3xl" />
      </div>
      <div className="relative text-center px-8 max-w-3xl">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl shadow-cyan-500/30 mb-8">
          <Anchor className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-white mb-4">
          Thank You
        </h1>
        <p className="text-xl text-cyan-400 font-medium mb-6">
          Marine Blue Economy Governance Dashboard
        </p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
          Protecting our ocean. Empowering our fishers. Securing our future.
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Kilifi Old Ferry Hub, Kenya</span>
          <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Ocean Governance System</span>
        </div>
      </div>
    </div>
  );
}
