import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { SpeciesRecord, HabitatHealth, RestorationProject, ConservationArea } from '../types';
import { formatNumber, formatArea, formatDate, titleCase, getColor } from '../lib/format';
import {
  Waves, TrendingUp, TrendingDown, Minus, Leaf,
  Sprout, X, Calendar, Building2, DollarSign, Target,
  Shield, Fish,
} from 'lucide-react';

type Tab = 'species' | 'habitats' | 'conservation' | 'restoration';

const TREND_ICONS: Record<string, typeof TrendingUp> = {
  increasing: TrendingUp,
  decreasing: TrendingDown,
  stable: Minus,
  recovering: TrendingUp,
  improving: TrendingUp,
  declining: TrendingDown,
};

const TREND_COLORS: Record<string, string> = {
  increasing: '#16a34a',
  decreasing: '#dc2626',
  stable: '#64748b',
  recovering: '#16a34a',
  improving: '#16a34a',
  declining: '#dc2626',
};

const STATUS_COLORS: Record<string, string> = {
  green: '#16a34a',
  yellow: '#d97706',
  red: '#dc2626',
};

const STATUS_LABELS: Record<string, string> = {
  green: 'Healthy',
  yellow: 'Caution',
  red: 'Critical',
};

export default function BiodiversityView() {
  const [species, setSpecies] = useState<SpeciesRecord[]>([]);
  const [habitats, setHabitats] = useState<HabitatHealth[]>([]);
  const [projects, setProjects] = useState<RestorationProject[]>([]);
  const [conservationAreas, setConservationAreas] = useState<ConservationArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('species');
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesRecord | null>(null);
  const [selectedProject, setSelectedProject] = useState<RestorationProject | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [sp, hab, proj, ca] = await Promise.all([
        supabase.from('species_records').select('*').order('species_name'),
        supabase.from('habitat_health').select('*'),
        supabase.from('restoration_projects').select('*').order('start_date', { ascending: false }),
        supabase.from('conservation_areas').select('*'),
      ]);
      setSpecies(sp.data || []);
      setHabitats(hab.data || []);
      setProjects(proj.data || []);
      setConservationAreas(ca.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const declining = species.filter(s => s.population_trend === 'decreasing').length;
  const recovering = species.filter(s => s.stock_status === 'recovering' || s.population_trend === 'increasing').length;

  const healthyHabitats = habitats.filter(h => h.health_status === 'green').length;
  const cautionHabitats = habitats.filter(h => h.health_status === 'yellow').length;
  const criticalHabitats = habitats.filter(h => h.health_status === 'red').length;

  const activeProjects = projects.filter(p => p.status === 'active').length;

  const tabs: { key: Tab; label: string; icon: typeof Waves }[] = [
    { key: 'species', label: 'Species Status', icon: Fish },
    { key: 'habitats', label: 'Habitat Health', icon: Leaf },
    { key: 'conservation', label: 'Conservation Areas', icon: Shield },
    { key: 'restoration', label: 'Restoration Projects', icon: Sprout },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Biodiversity & Conservation</h1>
        <p className="text-sm text-slate-500">Species status, habitat health, conservation areas, and restoration projects in Kilifi County</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Fish className="w-3.5 h-3.5" /> Tracked Species
          </div>
          <div className="text-2xl font-bold text-slate-900">{species.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" /> Declining
          </div>
          <div className="text-2xl font-bold text-red-600">{declining}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Recovering
          </div>
          <div className="text-2xl font-bold text-emerald-600">{recovering}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Sprout className="w-3.5 h-3.5 text-teal-500" /> Active Projects
          </div>
          <div className="text-2xl font-bold text-teal-600">{activeProjects}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Species Tab */}
      {activeTab === 'species' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {species.map(s => {
            const TrendIcon = TREND_ICONS[s.population_trend] || Minus;
            const trendColor = TREND_COLORS[s.population_trend] || '#64748b';
            return (
              <button
                key={s.id}
                onClick={() => setSelectedSpecies(s)}
                className="bg-white rounded-xl p-5 border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-900">{s.species_name}</div>
                    <div className="text-xs text-slate-400 italic">{s.scientific_name}</div>
                  </div>
                  <TrendIcon className="w-5 h-5" style={{ color: trendColor }} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Stock Status</span>
                    <span className="font-medium" style={{ color: getColor(s.stock_status) }}>{titleCase(s.stock_status)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Exploitation</span>
                    <span className="font-medium text-slate-700">{titleCase(s.exploitation_level)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Threat</span>
                    <span className="font-medium px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${getColor(s.threat_category)}15`, color: getColor(s.threat_category) }}>
                      {titleCase(s.threat_category)}
                    </span>
                  </div>
                  {s.catch_tonnage !== null && s.catch_tonnage > 0 && (
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-slate-500">Annual Catch</span>
                      <span className="font-medium text-slate-700">{formatNumber(s.catch_tonnage)}t / {formatNumber(s.max_sustainable_yield || 0)}t MSY</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Habitats Tab */}
      {activeTab === 'habitats' && (
        <div className="space-y-6">
          {/* Traffic Light Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-emerald-900">Healthy</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">{healthyHabitats}</div>
              <div className="text-xs text-emerald-700 mt-1">sites assessed</div>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold text-amber-900">Caution</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">{cautionHabitats}</div>
              <div className="text-xs text-amber-700 mt-1">sites need attention</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-semibold text-red-900">Critical</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{criticalHabitats}</div>
              <div className="text-xs text-red-700 mt-1">sites need urgent action</div>
            </div>
          </div>

          {/* Habitat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habitats.map(h => {
              const statusColor = STATUS_COLORS[h.health_status] || '#64748b';
              const TrendIcon = TREND_ICONS[h.trend || ''] || Minus;
              return (
                <div key={h.id} className="bg-white rounded-xl p-5 border border-slate-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${statusColor}15` }}>
                        {h.habitat_type === 'coral_reef' ? <Waves className="w-5 h-5" style={{ color: statusColor }} /> : <Leaf className="w-5 h-5" style={{ color: statusColor }} />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{titleCase(h.habitat_type.replace(/_/g, ' '))}</div>
                        <div className="text-xs text-slate-500">{h.location_name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColor }} />
                      <span className="text-xs font-medium" style={{ color: statusColor }}>{STATUS_LABELS[h.health_status]}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="text-xs text-slate-500">Score</div>
                      <div className="font-semibold" style={{ color: statusColor }}>{h.health_score || '—'}/100</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Coverage</div>
                      <div className="font-semibold text-slate-700">{h.coverage_km2 ? `${h.coverage_km2} km²` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Trend</div>
                      <div className="flex items-center gap-1">
                        <TrendIcon className="w-4 h-4" style={{ color: TREND_COLORS[h.trend || ''] }} />
                        <span className="font-medium text-slate-700">{titleCase(h.trend || '')}</span>
                      </div>
                    </div>
                  </div>
                  {h.notes && <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">{h.notes}</p>}
                  <div className="text-xs text-slate-400 mt-2">Last assessed: {formatDate(h.last_assessed)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conservation Areas Tab */}
      {activeTab === 'conservation' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conservationAreas.map(ca => (
            <div key={ca.id} className="bg-white rounded-xl p-5 border border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-semibold text-slate-900">{ca.name}</div>
                  <div className="text-xs text-slate-500">{titleCase(ca.type.replace(/_/g, ' '))} · {titleCase(ca.protection_level)} protection</div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${getColor(ca.conservation_status)}15`, color: getColor(ca.conservation_status) }}>
                  {titleCase(ca.conservation_status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <div className="text-xs text-slate-500">Area</div>
                  <div className="font-semibold text-slate-700">{formatArea(ca.area_km2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Established</div>
                  <div className="font-semibold text-slate-700">{formatDate(ca.established_date)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Effectiveness</div>
                  <div className="font-semibold" style={{ color: (ca.effectiveness_score || 0) >= 70 ? '#16a34a' : (ca.effectiveness_score || 0) >= 50 ? '#d97706' : '#dc2626' }}>
                    {ca.effectiveness_score || '—'}/100
                  </div>
                </div>
              </div>
              {ca.key_species && ca.key_species.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {ca.key_species.slice(0, 5).map(sp => (
                    <span key={sp} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{sp}</span>
                  ))}
                </div>
              )}
              {ca.management_plan && <p className="text-xs text-slate-500 pt-2 border-t border-slate-100">{ca.management_plan}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Restoration Projects Tab */}
      {activeTab === 'restoration' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedProject(p)}
              className="bg-white rounded-xl p-5 border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{p.project_name}</div>
                    <div className="text-xs text-slate-500">{titleCase(p.project_type.replace(/_/g, ' '))} · {p.location_name}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  {titleCase(p.status)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-500">Progress</span>
                  <span className="font-semibold text-slate-700">{p.progress_percentage || 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all" style={{ width: `${p.progress_percentage || 0}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Building2 className="w-3.5 h-3.5" /> {p.lead_organization}
                </div>
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(p.start_date)}
                </div>
                {p.budget_kes && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <DollarSign className="w-3.5 h-3.5" /> KES {formatNumber(p.budget_kes)}
                  </div>
                )}
                {p.area_km2 && (
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Target className="w-3.5 h-3.5" /> {p.area_km2} km²
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Species Detail Modal */}
      {selectedSpecies && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedSpecies(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="h-2" style={{ backgroundColor: getColor(selectedSpecies.threat_category) }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedSpecies.species_name}</h2>
                  <p className="text-sm italic text-slate-500">{selectedSpecies.scientific_name}</p>
                </div>
                <button onClick={() => setSelectedSpecies(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Population Trend</div><div className="font-semibold text-slate-900">{titleCase(selectedSpecies.population_trend)}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Exploitation Level</div><div className="font-semibold text-slate-900">{titleCase(selectedSpecies.exploitation_level)}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Stock Status</div><div className="font-semibold" style={{ color: getColor(selectedSpecies.stock_status) }}>{titleCase(selectedSpecies.stock_status)}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Threat Category</div><div className="font-semibold" style={{ color: getColor(selectedSpecies.threat_category) }}>{titleCase(selectedSpecies.threat_category)}</div></div>
                {selectedSpecies.catch_tonnage !== null && (
                  <>
                    <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Annual Catch</div><div className="font-semibold text-slate-900">{formatNumber(selectedSpecies.catch_tonnage)} t</div></div>
                    <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Max Sustainable Yield</div><div className="font-semibold text-slate-900">{formatNumber(selectedSpecies.max_sustainable_yield || 0)} t</div></div>
                  </>
                )}
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Region</div><div className="font-semibold text-slate-900">{selectedSpecies.region || '—'}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="text-xs text-slate-500 mb-1">Last Assessment</div><div className="font-semibold text-slate-900">{formatDate(selectedSpecies.last_assessment_date)}</div></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Restoration Project</h2>
              <button onClick={() => setSelectedProject(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Project Name</div>
                <div className="text-lg font-semibold text-slate-900">{selectedProject.project_name}</div>
                <div className="text-sm text-slate-500">{titleCase(selectedProject.project_type.replace(/_/g, ' '))} · {selectedProject.location_name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs text-slate-500 mb-1">Start Date</div><div className="text-sm font-medium text-slate-900">{formatDate(selectedProject.start_date)}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">End Date</div><div className="text-sm font-medium text-slate-900">{selectedProject.end_date ? formatDate(selectedProject.end_date) : 'Ongoing'}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">Status</div><div className="text-sm font-medium text-slate-900">{titleCase(selectedProject.status)}</div></div>
                <div><div className="text-xs text-slate-500 mb-1">Lead Organization</div><div className="text-sm font-medium text-slate-900">{selectedProject.lead_organization}</div></div>
                {selectedProject.budget_kes && <div><div className="text-xs text-slate-500 mb-1">Budget</div><div className="text-sm font-medium text-slate-900">KES {formatNumber(selectedProject.budget_kes)}</div></div>}
                {selectedProject.area_km2 && <div><div className="text-xs text-slate-500 mb-1">Area</div><div className="text-sm font-medium text-slate-900">{selectedProject.area_km2} km²</div></div>}
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1"><span className="text-slate-500">Progress</span><span className="font-semibold text-slate-900">{selectedProject.progress_percentage || 0}%</span></div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: `${selectedProject.progress_percentage || 0}%` }} /></div>
              </div>
              {selectedProject.objectives && <div className="bg-blue-50 rounded-lg p-3"><div className="text-xs text-blue-700 font-medium mb-1">Objectives</div><p className="text-sm text-blue-800">{selectedProject.objectives}</p></div>}
              {selectedProject.outcomes && <div className="bg-emerald-50 rounded-lg p-3"><div className="text-xs text-emerald-700 font-medium mb-1">Outcomes</div><p className="text-sm text-emerald-800">{selectedProject.outcomes}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
