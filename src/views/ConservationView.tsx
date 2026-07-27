import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ConservationArea } from '../types';
import { formatArea, formatDate, titleCase, getColor } from '../lib/format';
import {
  Shield, ShieldCheck, ShieldAlert, Search, X, Calendar,
  Fish, TrendingUp, TrendingDown, Minus, Award, Leaf,
} from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  mpa: 'Marine Protected Area',
  marine_reserve: 'Marine Reserve',
  marine_sanctuary: 'Marine Sanctuary',
  habitat_protection: 'Habitat Protection',
  species_reserve: 'Species Reserve',
  ramsar_site: 'Ramsar Site',
  lmma: 'Locally Managed Marine Area (LMMA)',
  fishery_closure: 'Fishery Closure Area',
  marine_park: 'Marine National Park',
};

const PROTECTION_LABELS: Record<string, string> = {
  strict: 'Strict Protection',
  high: 'High Protection',
  moderate: 'Moderate Protection',
  light: 'Light Protection',
};

export default function ConservationView() {
  const [areas, setAreas] = useState<ConservationArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [selected, setSelected] = useState<ConservationArea | null>(null);

  useEffect(() => {
    async function fetchAreas() {
      const { data } = await supabase.from('conservation_areas').select('*').order('area_km2', { ascending: false });
      setAreas(data || []);
      setLoading(false);
    }
    fetchAreas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = areas.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.key_species?.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesLevel = filterLevel === 'all' || a.protection_level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  const totalArea = areas.reduce((sum, a) => sum + a.area_km2, 0);
  const improving = areas.filter(a => a.conservation_status === 'improving').length;
  const avgScore = areas.length > 0
    ? Math.round(areas.reduce((sum, a) => sum + (a.effectiveness_score || 0), 0) / areas.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Marine Conservation</h1>
            <p className="text-sm text-slate-500">MPAs, LMMAs, and biodiversity conservation in Kilifi County</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Shield className="w-3.5 h-3.5" /> Protected Areas
          </div>
          <div className="text-2xl font-bold text-slate-900">{areas.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Leaf className="w-3.5 h-3.5" /> Total Protected Area
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatArea(totalArea)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <TrendingUp className="w-3.5 h-3.5" /> Improving
          </div>
          <div className="text-2xl font-bold text-emerald-600">{improving}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Award className="w-3.5 h-3.5" /> Avg Effectiveness
          </div>
          <div className="text-2xl font-bold text-slate-900">{avgScore}%</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or key species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
          />
        </div>
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm bg-white"
        >
          <option value="all">All Protection Levels</option>
          <option value="strict">Strict</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="light">Light</option>
        </select>
      </div>

      {/* Conservation Area Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((area) => (
          <button
            key={area.id}
            onClick={() => setSelected(area)}
            className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 text-left overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {area.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{TYPE_LABELS[area.type] || titleCase(area.type)}</p>
                </div>
                <div className="flex flex-col items-end gap-1 ml-2">
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: `${getColor(area.conservation_status)}15`,
                      color: getColor(area.conservation_status),
                    }}
                  >
                    {titleCase(area.conservation_status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <div className="text-xs text-slate-400">Area</div>
                  <div className="text-sm font-semibold text-slate-700">{formatArea(area.area_km2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Established</div>
                  <div className="text-sm font-semibold text-slate-700">{formatDate(area.established_date)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Protection</div>
                  <div className="text-sm font-semibold text-slate-700">{PROTECTION_LABELS[area.protection_level]?.split(' ')[0]}</div>
                </div>
              </div>

              {/* Effectiveness Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">Management Effectiveness</span>
                  <span className="text-xs font-semibold text-slate-700">{area.effectiveness_score || 0}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${area.effectiveness_score || 0}%`,
                      backgroundColor: getColor(area.conservation_status),
                    }}
                  />
                </div>
              </div>

              {/* Key Species */}
              {area.key_species && area.key_species.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Fish className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  {area.key_species.slice(0, 4).map((sp, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                      {sp}
                    </span>
                  ))}
                  {area.key_species.length > 4 && (
                    <span className="text-xs text-slate-400">+{area.key_species.length - 4} more</span>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No conservation areas match your search.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2" style={{ backgroundColor: getColor(selected.conservation_status) }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selected.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{TYPE_LABELS[selected.type] || titleCase(selected.type)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Area</div>
                  <div className="font-semibold text-slate-900">{formatArea(selected.area_km2)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Established
                  </div>
                  <div className="font-semibold text-slate-900">{formatDate(selected.established_date)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Protection Level</div>
                  <div className="font-semibold text-slate-900 text-sm">{PROTECTION_LABELS[selected.protection_level]}</div>
                </div>
              </div>

              {/* Effectiveness Score */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Management Effectiveness Score</span>
                  <span className="text-lg font-bold" style={{ color: getColor(selected.conservation_status) }}>
                    {selected.effectiveness_score || 0}%
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${selected.effectiveness_score || 0}%`,
                      backgroundColor: getColor(selected.conservation_status),
                    }}
                  />
                </div>
              </div>

              {/* Conservation Status */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  {selected.conservation_status === 'improving' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                  {selected.conservation_status === 'stable' && <Minus className="w-4 h-4 text-blue-500" />}
                  {selected.conservation_status === 'declining' && <TrendingDown className="w-4 h-4 text-amber-500" />}
                  {selected.conservation_status === 'critical' && <ShieldAlert className="w-4 h-4 text-red-500" />}
                  <span className="text-sm font-medium text-slate-700">Conservation Status:</span>
                  <span
                    className="text-sm font-semibold"
                    style={{ color: getColor(selected.conservation_status) }}
                  >
                    {titleCase(selected.conservation_status)}
                  </span>
                </div>
              </div>

              {/* Key Species */}
              {selected.key_species && selected.key_species.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Fish className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-semibold text-slate-900 text-sm">Key Protected Species</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selected.key_species.map((sp, i) => (
                      <span key={i} className="text-sm px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100">
                        {sp}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Management Plan */}
              {selected.management_plan && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-slate-500" />
                    <h3 className="font-semibold text-slate-900 text-sm">Management Plan</h3>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{selected.management_plan}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
