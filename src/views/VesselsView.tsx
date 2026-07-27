import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Vessel } from '../types';
import { formatNumber, formatDate, getColor } from '../lib/format';
import {
  Ship, Search, X, Calendar, Ruler, Weight, Flag, Radio,
  CheckCircle2, XCircle, Clock, AlertCircle, Filter,
} from 'lucide-react';

const VESSEL_TYPE_LABELS: Record<string, string> = {
  trawler: 'Trawler',
  longliner: 'Longliner',
  purse_seine: 'Purse Seine',
  gillnet: 'Gillnet',
  factory_ship: 'Factory Ship',
  research: 'Research Vessel',
  patrol: 'Patrol Vessel',
  cargo: 'Cargo',
  dhow: 'Dhow (Jahazi)',
  mashua: 'Mashua',
  canoe: 'Canoe (Mtumbwi)',
  ngalawa: 'Ngalawa (Outrigger Canoe)',
  other: 'Other',
};

const LICENSE_LABELS: Record<string, string> = {
  active: 'Active',
  suspended: 'Suspended',
  revoked: 'Revoked',
  expired: 'Expired',
  pending: 'Pending',
};

function LicenseIcon({ status }: { status: string }) {
  if (status === 'active') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'suspended') return <Clock className="w-4 h-4 text-amber-500" />;
  if (status === 'revoked') return <XCircle className="w-4 h-4 text-red-500" />;
  if (status === 'expired') return <AlertCircle className="w-4 h-4 text-slate-400" />;
  return <Clock className="w-4 h-4 text-cyan-500" />;
}

export default function VesselsView() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLicense, setFilterLicense] = useState('all');
  const [selected, setSelected] = useState<Vessel | null>(null);

  useEffect(() => {
    async function fetchVessels() {
      const { data } = await supabase.from('vessels').select('*').order('vessel_name');
      setVessels(data || []);
      setLoading(false);
    }
    fetchVessels();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = vessels.filter(v => {
    const matchesSearch = v.vessel_name.toLowerCase().includes(search.toLowerCase()) ||
      v.registration_id.toLowerCase().includes(search.toLowerCase()) ||
      v.flag_state.toLowerCase().includes(search.toLowerCase());
    const matchesLicense = filterLicense === 'all' || v.license_status === filterLicense;
    return matchesSearch && matchesLicense;
  });

  const active = vessels.filter(v => v.license_status === 'active').length;
  const suspended = vessels.filter(v => v.license_status === 'suspended').length;
  const revoked = vessels.filter(v => v.license_status === 'revoked').length;
  const withMonitoring = vessels.filter(v => v.monitoring_system !== 'none').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Ship className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Vessel Registry</h1>
            <p className="text-sm text-slate-500">Registered vessels at Kilifi Old Ferry hub and Kilifi County coast</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Ship className="w-3.5 h-3.5" /> Total Vessels
          </div>
          <div className="text-2xl font-bold text-slate-900">{vessels.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </div>
          <div className="text-2xl font-bold text-emerald-600">{active}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <AlertCircle className="w-3.5 h-3.5" /> Suspended/Revoked
          </div>
          <div className="text-2xl font-bold text-red-600">{suspended + revoked}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Radio className="w-3.5 h-3.5" /> Tracked
          </div>
          <div className="text-2xl font-bold text-blue-600">{withMonitoring}</div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, registration ID, or flag state..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
          />
        </div>
        <select
          value={filterLicense}
          onChange={(e) => setFilterLicense(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm bg-white"
        >
          <option value="all">All License Statuses</option>
          {Object.entries(LICENSE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Vessel Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Vessel</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Flag State</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">License</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Monitoring</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Last Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelected(v)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900 text-sm">{v.vessel_name}</div>
                    <div className="text-xs text-slate-400">{v.registration_id}</div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-sm text-slate-600">{VESSEL_TYPE_LABELS[v.vessel_type]}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-slate-600">{v.flag_state}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
                      style={{
                        backgroundColor: `${getColor(v.license_status)}15`,
                        color: getColor(v.license_status),
                      }}
                    >
                      <LicenseIcon status={v.license_status} />
                      {LICENSE_LABELS[v.license_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-slate-600 uppercase">{v.monitoring_system}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-slate-600">{formatDate(v.last_inspection)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No vessels match your filters.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2" style={{ backgroundColor: getColor(selected.license_status) }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selected.vessel_name}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{selected.registration_id}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="mb-5">
                <span
                  className="text-sm font-medium px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${getColor(selected.license_status)}15`,
                    color: getColor(selected.license_status),
                  }}
                >
                  <LicenseIcon status={selected.license_status} />
                  {LICENSE_LABELS[selected.license_status]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Ship className="w-3.5 h-3.5" /> Type
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{VESSEL_TYPE_LABELS[selected.vessel_type]}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Flag className="w-3.5 h-3.5" /> Flag State
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{selected.flag_state}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Ruler className="w-3.5 h-3.5" /> Length
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {selected.length_m ? `${selected.length_m} m` : '—'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Weight className="w-3.5 h-3.5" /> Gross Tonnage
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {selected.gross_tonnage ? `${formatNumber(selected.gross_tonnage)} t` : '—'}
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Radio className="w-3.5 h-3.5" /> Monitoring
                  </div>
                  <div className="font-semibold text-slate-900 text-sm uppercase">{selected.monitoring_system}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Last Inspection
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{formatDate(selected.last_inspection)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
