import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CatchRecord, Vessel, Fisher, LandingSite } from '../types';
import { formatNumber, formatDate } from '../lib/format';
import {
  Fish, Search, TrendingUp, Scale, DollarSign,
  MapPin, X, BarChart3,
} from 'lucide-react';

export default function CatchesView() {
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [fishers, setFishers] = useState<Fisher[]>([]);
  const [landingSites, setLandingSites] = useState<LandingSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSite, setFilterSite] = useState('all');
  const [filterVerified, setFilterVerified] = useState('all');
  const [selectedCatch, setSelectedCatch] = useState<CatchRecord | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [c, v, f, ls] = await Promise.all([
        supabase.from('catches').select('*').order('landing_date', { ascending: false }),
        supabase.from('vessels').select('*'),
        supabase.from('fishers').select('*'),
        supabase.from('landing_sites').select('*'),
      ]);
      setCatches(c.data || []);
      setVessels(v.data || []);
      setFishers(f.data || []);
      setLandingSites(ls.data || []);
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

  const getVessel = (id: string | null) => vessels.find(v => v.id === id);
  const getFisher = (id: string | null) => fishers.find(f => f.id === id);
  const getLandingSite = (id: string | null) => landingSites.find(ls => ls.id === id);

  const filtered = catches.filter(c => {
    const vessel = getVessel(c.vessel_id);
    const fisher = getFisher(c.fisher_id);
    const matchSearch = !search ||
      c.species_name?.toLowerCase().includes(search.toLowerCase()) ||
      vessel?.vessel_name.toLowerCase().includes(search.toLowerCase()) ||
      fisher?.full_name.toLowerCase().includes(search.toLowerCase());
    const matchSite = filterSite === 'all' || c.landing_site_id === filterSite;
    const matchVerified = filterVerified === 'all' ||
      (filterVerified === 'verified' && c.verified) ||
      (filterVerified === 'pending' && !c.verified);
    return matchSearch && matchSite && matchVerified;
  });

  const totalWeight = filtered.reduce((s, c) => s + c.weight_kg, 0);
  const totalValue = filtered.reduce((s, c) => s + (c.market_value_kes || 0), 0);
  const verifiedCount = filtered.filter(c => c.verified).length;
  const verificationRate = filtered.length > 0 ? Math.round((verifiedCount / filtered.length) * 100) : 0;

  // Species breakdown
  const speciesBreakdown: Record<string, { weight: number; value: number; count: number }> = {};
  filtered.forEach(c => {
    const name = c.species_name || 'Unknown';
    if (!speciesBreakdown[name]) speciesBreakdown[name] = { weight: 0, value: 0, count: 0 };
    speciesBreakdown[name].weight += c.weight_kg;
    speciesBreakdown[name].value += c.market_value_kes || 0;
    speciesBreakdown[name].count += 1;
  });
  const topSpecies = Object.entries(speciesBreakdown).sort((a, b) => b[1].weight - a[1].weight).slice(0, 8);

  // Gear breakdown
  const gearBreakdown: Record<string, number> = {};
  filtered.forEach(c => {
    const gear = c.gear_used || 'Unknown';
    gearBreakdown[gear] = (gearBreakdown[gear] || 0) + c.weight_kg;
  });

  // Landing site breakdown
  const siteBreakdown: Record<string, { weight: number; value: number }> = {};
  filtered.forEach(c => {
    const site = getLandingSite(c.landing_site_id)?.name || 'Unknown';
    if (!siteBreakdown[site]) siteBreakdown[site] = { weight: 0, value: 0 };
    siteBreakdown[site].weight += c.weight_kg;
    siteBreakdown[site].value += c.market_value_kes || 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Catch & Fisheries Monitoring</h1>
        <p className="text-sm text-slate-500">Catch landings, trends, fishing effort, and market value at Kilifi landing sites</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Scale className="w-4 h-4" />
            <span className="text-xs font-medium">Total Weight</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{formatNumber(totalWeight)} kg</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-medium">Market Value</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">KES {formatNumber(totalValue)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Fish className="w-4 h-4" />
            <span className="text-xs font-medium">Landings</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{filtered.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs font-medium">Verification Rate</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{verificationRate}%</div>
        </div>
      </div>

      {/* Species Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <BarChart3 className="w-5 h-5 text-cyan-500" />
            <h2 className="font-semibold text-slate-900">Top Species by Weight</h2>
          </div>
          <div className="p-5 space-y-3">
            {topSpecies.map(([name, data]) => {
              const pct = (data.weight / totalWeight) * 100;
              return (
                <div key={name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{name}</span>
                    <span className="text-slate-500">{formatNumber(data.weight)} kg</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-teal-500" />
            <h2 className="font-semibold text-slate-900">Landings by Site</h2>
          </div>
          <div className="p-5 space-y-3">
            {Object.entries(siteBreakdown).sort((a, b) => b[1].weight - a[1].weight).map(([site, data]) => {
              const pct = (data.weight / totalWeight) * 100;
              return (
                <div key={site}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium text-slate-700">{site}</span>
                    <span className="text-slate-500">{formatNumber(data.weight)} kg · KES {formatNumber(data.value)}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by species, vessel, or fisher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10 outline-none text-sm"
          />
        </div>
        <select
          value={filterSite}
          onChange={(e) => setFilterSite(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 focus:border-cyan-500 outline-none text-sm bg-white"
        >
          <option value="all">All Landing Sites</option>
          {landingSites.map(ls => (
            <option key={ls.id} value={ls.id}>{ls.name}</option>
          ))}
        </select>
        <select
          value={filterVerified}
          onChange={(e) => setFilterVerified(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 focus:border-cyan-500 outline-none text-sm bg-white"
        >
          <option value="all">All Catches</option>
          <option value="verified">Verified Only</option>
          <option value="pending">Pending Verification</option>
        </select>
      </div>

      {/* Catch Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Species</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Fisher</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vessel</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Landing Site</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Gear</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Weight</th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Value (KES)</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => {
              const vessel = getVessel(c.vessel_id);
              const fisher = getFisher(c.fisher_id);
              const site = getLandingSite(c.landing_site_id);
              return (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCatch(c)}
                  className="hover:bg-slate-50 cursor-pointer"
                >
                  <td className="px-5 py-3 text-sm text-slate-600">{formatDate(c.landing_date)}</td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">{c.species_name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{fisher?.full_name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{vessel?.vessel_name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{site?.name || '—'}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{c.gear_used || '—'}</td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-slate-900">{c.weight_kg} kg</td>
                  <td className="px-5 py-3 text-sm text-right text-slate-600">{formatNumber(c.market_value_kes || 0)}</td>
                  <td className="px-5 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: c.verified ? '#dcfce7' : '#fef3c7',
                        color: c.verified ? '#16a34a' : '#d97706',
                      }}
                    >
                      {c.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Catch Detail Modal */}
      {selectedCatch && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCatch(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Catch Detail</h2>
              <button onClick={() => setSelectedCatch(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Species</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedCatch.species_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Weight</div>
                  <div className="text-sm font-semibold text-slate-900">{selectedCatch.weight_kg} kg</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Gear Used</div>
                  <div className="text-sm text-slate-700">{selectedCatch.gear_used || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Market Value</div>
                  <div className="text-sm font-semibold text-slate-900">KES {formatNumber(selectedCatch.market_value_kes || 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Landing Date</div>
                  <div className="text-sm text-slate-700">{formatDate(selectedCatch.landing_date)} {selectedCatch.landing_time || ''}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Landing Site</div>
                  <div className="text-sm text-slate-700">{getLandingSite(selectedCatch.landing_site_id)?.name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Fisher</div>
                  <div className="text-sm text-slate-700">{getFisher(selectedCatch.fisher_id)?.full_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Vessel</div>
                  <div className="text-sm text-slate-700">{getVessel(selectedCatch.vessel_id)?.vessel_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Verification</div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: selectedCatch.verified ? '#dcfce7' : '#fef3c7',
                      color: selectedCatch.verified ? '#16a34a' : '#d97706',
                    }}
                  >
                    {selectedCatch.verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              {selectedCatch.notes && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1">Notes</div>
                  <div className="text-sm text-slate-700">{selectedCatch.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
