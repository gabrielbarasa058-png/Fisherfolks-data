import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { MarineZone } from '../types';
import { formatArea, formatDate, titleCase, getZoneColor } from '../lib/format';
import ZoneMap from '../components/ZoneMap';
import {
  Waves, MapPin, Shield, Calendar, Building2, CheckCircle2, XCircle,
  AlertCircle, Search, X, Layers, Map as MapIcon, Navigation,
  Award, Download, Lock,
} from 'lucide-react';

const ZONE_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: '#16a34a', bg: '#dcfce7' },
  closed: { label: 'Closed', color: '#dc2626', bg: '#fee2e2' },
  seasonal_closure: { label: 'Seasonal Closure', color: '#d97706', bg: '#fef3c7' },
  under_review: { label: 'Under Review', color: '#6366f1', bg: '#e0e7ff' },
};

const ZONE_TYPE_LABELS: Record<string, string> = {
  commercial_fishing: 'Commercial Fishing',
  industrial: 'Industrial',
  recreational: 'Recreational',
  no_take: 'No-Take Reserve',
  restricted_use: 'Restricted Use',
  multi_use: 'Multi-Use',
  conservation: 'Conservation',
  shipping_lane: 'Shipping Lane',
  artisanal_fishing: 'Artisanal Fishing',
  mangrove_reserve: 'Mangrove Reserve',
  coral_garden: 'Coral Garden',
  reef_protected: 'Reef Protected',
};

export default function ZoningView() {
  const [zones, setZones] = useState<MarineZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<MarineZone | null>(null);

  useEffect(() => {
    async function fetchZones() {
      const { data } = await supabase.from('marine_zones').select('*').order('area_km2', { ascending: false });
      setZones(data || []);
      setLoading(false);
    }
    fetchZones();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = zones.filter(z => {
    const matchesSearch = z.name.toLowerCase().includes(search.toLowerCase()) ||
      z.designation.toLowerCase().includes(search.toLowerCase()) ||
      z.managing_authority.toLowerCase().includes(search.toLowerCase()) ||
      (z.coordinates && `${z.coordinates.lat},${z.coordinates.lng}`.includes(search.toLowerCase())) ||
      (z.coordinates && `${z.coordinates.lat.toFixed(4)} ${z.coordinates.lng.toFixed(4)}`.includes(search.toLowerCase()));
    const matchesType = filterType === 'all' || z.zone_type === filterType;
    return matchesSearch && matchesType;
  });

  const totalArea = zones.reduce((sum, z) => sum + z.area_km2, 0);

  const downloadBoundary = (zone: MarineZone) => {
    const geojson = {
      type: 'Feature',
      properties: {
        name: zone.name,
        zone_type: zone.zone_type,
        designation: zone.designation,
        zone_status: zone.zone_status,
        area_km2: zone.area_km2,
        managing_authority: zone.managing_authority,
        allowed_activities: zone.allowed_activities,
        restrictions: zone.restrictions,
        licensing_requirements: zone.licensing_requirements,
      },
      geometry: (zone.boundary_geojson as { type: string; coordinates: number[] } | null) ?? {
        type: 'Point',
        coordinates: zone.coordinates ? [zone.coordinates.lng, zone.coordinates.lat] : null,
      },
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${zone.name.replace(/\s+/g, '_').toLowerCase()}_boundary.geojson`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Waves className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Marine Zoning</h1>
            <p className="text-sm text-slate-500">Spatial management of marine areas along the Kilifi County coastline</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Zones</div>
          <div className="text-2xl font-bold text-slate-900">{zones.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Total Area</div>
          <div className="text-2xl font-bold text-slate-900">{formatArea(totalArea)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Open Zones</div>
          <div className="text-2xl font-bold text-emerald-600">{zones.filter(z => z.zone_status === 'open').length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium mb-1">Closed/Seasonal</div>
          <div className="text-2xl font-bold text-amber-600">{zones.filter(z => z.zone_status === 'closed' || z.zone_status === 'seasonal_closure').length}</div>
        </div>
      </div>

      {/* Zone Type Legend */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700">Zone Type Legend</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(ZONE_TYPE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getZoneColor(key) }} />
              <span className="text-xs text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <MapIcon className="w-5 h-5 text-cyan-500" />
          <h2 className="font-semibold text-slate-900">Interactive Zone Map</h2>
          <span className="text-xs text-slate-400 ml-2">Switch layers (top-right): Satellite, Ocean (GEBCO/NOAA), Street</span>
        </div>
        <div className="p-4">
          <ZoneMap zones={zones} onZoneClick={(z) => setSelectedZone(z)} />
          <div className="mt-3 text-xs text-slate-500 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Click any zone boundary to view details. Boundaries sourced from KWS, KMA, KFS, NEMA, Kilifi County Fisheries & BMUs.
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by zone name, beach, or GPS coordinates (lat, lng)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm bg-white"
        >
          <option value="all">All Zone Types</option>
          {Object.entries(ZONE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((zone) => (
          <button
            key={zone.id}
            onClick={() => setSelectedZone(zone)}
            className="group bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 text-left overflow-hidden"
          >
            {/* Color Bar */}
            <div className="h-1.5" style={{ backgroundColor: getZoneColor(zone.zone_type) }} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                {zone.zone_status && ZONE_STATUS_CONFIG[zone.zone_status] && (
                  <span
                    className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: ZONE_STATUS_CONFIG[zone.zone_status].bg,
                      color: ZONE_STATUS_CONFIG[zone.zone_status].color,
                    }}
                  >
                    {zone.zone_status === 'closed' || zone.zone_status === 'seasonal_closure' ? <Lock className="w-3 h-3 inline mr-1" /> : null}
                    {ZONE_STATUS_CONFIG[zone.zone_status].label}
                  </span>
                )}
                <span
                  className="text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-auto"
                  style={{
                    backgroundColor: `${getZoneColor(zone.zone_type)}15`,
                    color: getZoneColor(zone.zone_type),
                  }}
                >
                  {ZONE_TYPE_LABELS[zone.zone_type]}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="text-xs text-slate-400">Area</div>
                  <div className="text-sm font-semibold text-slate-700">{formatArea(zone.area_km2)}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Established</div>
                  <div className="text-sm font-semibold text-slate-700">{formatDate(zone.established_date)}</div>
                </div>
              </div>

              {zone.licensing_requirements && zone.licensing_requirements.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Award className="w-3.5 h-3.5" /> Licensing
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {zone.licensing_requirements.slice(0, 3).map((req, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{req}</span>
                    ))}
                    {zone.licensing_requirements.length > 3 && (
                      <span className="text-xs text-slate-400">+{zone.licensing_requirements.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Building2 className="w-3.5 h-3.5" />
                <span className="truncate">{zone.managing_authority}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {zone.status === 'active' && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active
                  </span>
                )}
                {zone.status === 'under_review' && (
                  <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Under Review
                  </span>
                )}
                {zone.status === 'proposed' && (
                  <span className="flex items-center gap-1 text-xs text-cyan-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Proposed
                  </span>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  {zone.allowed_activities?.length || 0} activities
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No zones match your search.</p>
        </div>
      )}

      {/* Zone Detail Modal */}
      {selectedZone && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setSelectedZone(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-2" style={{ backgroundColor: getZoneColor(selectedZone.zone_type) }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedZone.name}</h2>
                  <p className="text-sm text-slate-500 mt-1">{selectedZone.designation}</p>
                </div>
                <button
                  onClick={() => setSelectedZone(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <MapPin className="w-3.5 h-3.5" /> Area
                  </div>
                  <div className="font-semibold text-slate-900">{formatArea(selectedZone.area_km2)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Established
                  </div>
                  <div className="font-semibold text-slate-900">{formatDate(selectedZone.established_date)}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Building2 className="w-3.5 h-3.5" /> Authority
                  </div>
                  <div className="font-semibold text-slate-900 text-sm">{selectedZone.managing_authority}</div>
                </div>
              </div>

              <div className="mb-5 flex items-center gap-3">
                <span
                  className="inline-block text-sm font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: `${getZoneColor(selectedZone.zone_type)}15`,
                    color: getZoneColor(selectedZone.zone_type),
                  }}
                >
                  {ZONE_TYPE_LABELS[selectedZone.zone_type]}
                </span>
                {selectedZone.zone_status && ZONE_STATUS_CONFIG[selectedZone.zone_status] && (
                  <span
                    className="inline-block text-sm font-medium px-3 py-1.5 rounded-lg"
                    style={{
                      backgroundColor: ZONE_STATUS_CONFIG[selectedZone.zone_status].bg,
                      color: ZONE_STATUS_CONFIG[selectedZone.zone_status].color,
                    }}
                  >
                    {ZONE_STATUS_CONFIG[selectedZone.zone_status].label}
                  </span>
                )}
              </div>

              {/* Licensing Requirements */}
              {selectedZone.licensing_requirements && selectedZone.licensing_requirements.length > 0 && (
                <div className="mb-5 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-slate-900 text-sm">Licensing Requirements</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedZone.licensing_requirements.map((req, i) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-blue-700 border border-blue-200">{req}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* GPS Coordinates */}
              {selectedZone.coordinates && (
                <div className="mb-5 bg-slate-50 rounded-lg p-3 flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-500">GPS:</span>
                  <span className="font-mono font-medium text-slate-700">{selectedZone.coordinates.lat.toFixed(4)}°, {selectedZone.coordinates.lng.toFixed(4)}°</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-semibold text-slate-900 text-sm">Allowed Activities</h3>
                  </div>
                  <ul className="space-y-2">
                    {selectedZone.allowed_activities?.map((act, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        {act}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <XCircle className="w-4 h-4 text-red-500" />
                    <h3 className="font-semibold text-slate-900 text-sm">Restrictions</h3>
                  </div>
                  <ul className="space-y-2">
                    {selectedZone.restrictions?.map((res, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        {res}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Status: </span>
                  <span className="text-sm font-semibold" style={{ color: getZoneColor(selectedZone.status) }}>
                    {titleCase(selectedZone.status)}
                  </span>
                </div>
                {/* Download Boundary */}
                <button
                  onClick={() => downloadBoundary(selectedZone)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium text-slate-700 transition-colors w-full"
                >
                  <Download className="w-4 h-4" />
                  Download Boundary (GeoJSON)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
