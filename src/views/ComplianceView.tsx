import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '../lib/supabase';
import type { ComplianceIncident, MarineZone, Vessel, VesselTrack, GeofenceAlert, Inspection } from '../types';
import { formatNumber, formatDate, titleCase, getColor, getZoneColor } from '../lib/format';
import type { FeatureCollection as GeoJSONFeatureCollection } from 'geojson';
import {
  AlertTriangle, Search, X, Calendar, DollarSign, Ship,
  ShieldAlert, CheckCircle2, Clock, Gavel, Activity,
  Navigation, MapPin, FileText, Crosshair, Radio, Bell,
} from 'lucide-react';

const INCIDENT_LABELS: Record<string, string> = {
  illegal_fishing: 'Illegal Fishing',
  zone_violation: 'Zone Violation',
  pollution: 'Pollution',
  poaching: 'Poaching',
  exceeding_quota: 'Exceeding Quota',
  unauthorized_vessel: 'Unauthorized Vessel',
  habitat_damage: 'Habitat Damage',
  bycatch_violation: 'Bycatch Violation',
};

const ALERT_LABELS: Record<string, string> = {
  restricted_zone_entry: 'Restricted Zone Entry',
  seasonal_closure_violation: 'Seasonal Closure Violation',
  speed_violation: 'Speed Violation',
  unauthorized_vessel: 'Unauthorized Vessel',
  zone_entry: 'Zone Entry',
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'resolved') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
  if (status === 'open') return <AlertTriangle className="w-4 h-4 text-blue-500" />;
  if (status === 'under_investigation') return <Clock className="w-4 h-4 text-amber-500" />;
  if (status === 'prosecuted') return <Gavel className="w-4 h-4 text-red-500" />;
  return <ShieldAlert className="w-4 h-4 text-slate-400" />;
}

type Tab = 'vessel_tracking' | 'geofence' | 'incidents' | 'inspections' | 'heatmap';

function isValidCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getZoneCentroid(zone: MarineZone): { lat: number; lng: number } | null {
  if (zone.coordinates && isValidCoordinate(zone.coordinates.lat) && isValidCoordinate(zone.coordinates.lng)) {
    return { lat: zone.coordinates.lat, lng: zone.coordinates.lng };
  }

  if (!zone.boundary_geojson || typeof zone.boundary_geojson !== 'object') {
    return null;
  }

  const boundary = zone.boundary_geojson as {
    type?: string;
    geometry?: {
      type?: string;
      coordinates?: number[][][] | number[][][][];
    };
  };

  const geometry = boundary.geometry;
  if (!geometry?.coordinates) return null;

  const firstRing = geometry.type === 'Polygon'
    ? (geometry.coordinates as number[][][])[0]
    : geometry.type === 'MultiPolygon'
      ? (geometry.coordinates as number[][][][])[0]?.[0]
      : null;

  if (!firstRing || firstRing.length === 0) return null;

  const validPoints = firstRing.filter((point): point is [number, number] => Array.isArray(point) && isValidCoordinate(point[1]) && isValidCoordinate(point[0]));
  if (validPoints.length === 0) return null;

  const lat = validPoints.reduce((sum, point) => sum + point[1], 0) / validPoints.length;
  const lng = validPoints.reduce((sum, point) => sum + point[0], 0) / validPoints.length;

  return { lat, lng };
}

export default function ComplianceView() {
  const [incidents, setIncidents] = useState<ComplianceIncident[]>([]);
  const [zones, setZones] = useState<MarineZone[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [tracks, setTracks] = useState<VesselTrack[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('vessel_tracking');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selected, setSelected] = useState<ComplianceIncident | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [inc, zn, v, tr, al, ins] = await Promise.all([
        supabase.from('compliance_incidents').select('*').order('date', { ascending: false }),
        supabase.from('marine_zones').select('*'),
        supabase.from('vessels').select('*'),
        supabase.from('vessel_tracks').select('*').order('timestamp', { ascending: true }),
        supabase.from('geofence_alerts').select('*').order('timestamp', { ascending: false }),
        supabase.from('inspections').select('*').order('date', { ascending: false }),
      ]);
      setIncidents(inc.data || []);
      setZones(zn.data || []);
      setVessels(v.data || []);
      setTracks(tr.data || []);
      setAlerts(al.data || []);
      setInspections(ins.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const acknowledgeAlert = async (id: string) => {
    await supabase.from('geofence_alerts').update({
      acknowledged: true,
      acknowledged_by: 'Dashboard Officer',
      acknowledged_at: new Date().toISOString(),
    }).eq('id', id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true, acknowledged_by: 'Dashboard Officer' } : a));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    );
  }

  const zoneMap = new Map(zones.map(z => [z.id, z.name]));
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const openCount = incidents.filter(i => ['open', 'under_investigation'].includes(i.status)).length;
  const prosecutedCount = incidents.filter(i => i.status === 'prosecuted').length;
  const totalPenalties = incidents.reduce((sum, i) => sum + i.penalty_amount, 0);
  const passedInspections = inspections.filter(i => i.result === 'pass').length;
  const failedInspections = inspections.filter(i => i.result === 'fail').length;

  const tabs: { key: Tab; label: string; icon: typeof Navigation; badge?: number }[] = [
    { key: 'vessel_tracking', label: 'Vessel Tracking', icon: Navigation },
    { key: 'geofence', label: 'Geofence Alerts', icon: Bell, badge: activeAlerts.length },
    { key: 'incidents', label: 'Violations', icon: ShieldAlert, badge: openCount },
    { key: 'inspections', label: 'Inspections', icon: FileText },
    { key: 'heatmap', label: 'Compliance Heat Map', icon: Crosshair },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Compliance & Enforcement</h1>
            <p className="text-sm text-slate-500">Vessel tracking, geofencing, violations, inspections, and enforcement along the Kilifi coast</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Bell className="w-3.5 h-3.5 text-red-500" /> Active Alerts
          </div>
          <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Clock className="w-3.5 h-3.5" /> Open Cases
          </div>
          <div className="text-2xl font-bold text-amber-600">{openCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <Gavel className="w-3.5 h-3.5" /> Prosecuted
          </div>
          <div className="text-2xl font-bold text-red-600">{prosecutedCount}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Total Penalties
          </div>
          <div className="text-2xl font-bold text-slate-900">KES {formatNumber(totalPenalties)}</div>
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
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Vessel Tracking */}
      {activeTab === 'vessel_tracking' && (
        <VesselTrackingMap vessels={vessels} tracks={tracks} zones={zones} alerts={alerts} />
      )}

      {/* Geofence Alerts */}
      {activeTab === 'geofence' && (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 ${alert.acknowledged ? 'bg-white border-slate-200' : 'bg-red-50 border-red-200'}`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${getColor(alert.severity)}15` }}
                >
                  <AlertTriangle className="w-5 h-5" style={{ color: getColor(alert.severity) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {ALERT_LABELS[alert.alert_type] || titleCase(alert.alert_type)}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${getColor(alert.severity)}15`, color: getColor(alert.severity) }}
                      >
                        {titleCase(alert.severity)}
                      </span>
                    </div>
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{alert.notes}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Ship className="w-3.5 h-3.5" /> {alert.vessel_name || 'Unknown'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {alert.zone_name || 'Unknown Zone'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(alert.timestamp)}
                    </span>
                    {alert.latitude && alert.longitude && (
                      <span className="flex items-center gap-1">
                        <Navigation className="w-3.5 h-3.5" /> {alert.latitude.toFixed(4)}°, {alert.longitude.toFixed(4)}°
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Incidents / Violations */}
      {activeTab === 'incidents' && (
        <>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by vessel, description, or incident type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="resolved">Resolved</option>
              <option value="prosecuted">Prosecuted</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-sm bg-white"
            >
              <option value="all">All Severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="space-y-3">
            {incidents.filter(inc => {
              const ms = !search || inc.vessel_name?.toLowerCase().includes(search.toLowerCase()) || inc.description?.toLowerCase().includes(search.toLowerCase());
              const mst = filterStatus === 'all' || inc.status === filterStatus;
              const msv = filterSeverity === 'all' || inc.severity === filterSeverity;
              return ms && mst && msv;
            }).map(inc => (
              <button
                key={inc.id}
                onClick={() => setSelected(inc)}
                className="group w-full bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all text-left overflow-hidden"
              >
                <div className="flex items-stretch">
                  <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: getColor(inc.severity) }} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-md" style={{ backgroundColor: `${getColor(inc.severity)}15`, color: getColor(inc.severity) }}>
                            {titleCase(inc.severity)}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {INCIDENT_LABELS[inc.incident_type] || titleCase(inc.incident_type)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-1">{inc.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Ship className="w-3.5 h-3.5" /> {inc.vessel_name || 'Unknown'}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {formatDate(inc.date)}</span>
                          {inc.zone_id && <span className="flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {zoneMap.get(inc.zone_id) || 'Unknown'}</span>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5" style={{ backgroundColor: `${getColor(inc.status)}15`, color: getColor(inc.status) }}>
                          <StatusIcon status={inc.status} /> {titleCase(inc.status)}
                        </span>
                        {inc.penalty_amount > 0 && <span className="text-sm font-semibold text-slate-700">KES {formatNumber(inc.penalty_amount)}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Inspections */}
      {activeTab === 'inspections' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Passed
              </div>
              <div className="text-2xl font-bold text-emerald-600">{passedInspections}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Warnings
              </div>
              <div className="text-2xl font-bold text-amber-600">{inspections.filter(i => i.result === 'warning').length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-slate-200">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1">
                <X className="w-3.5 h-3.5 text-red-500" /> Failed
              </div>
              <div className="text-2xl font-bold text-red-600">{failedInspections}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Inspection #</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Vessel</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Inspector</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Result</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Catch Verified</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Violations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map(ins => (
                  <tr key={ins.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{ins.inspection_number}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{formatDate(ins.date)}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{ins.vessel_name || '—'}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{ins.inspector_name}</td>
                    <td className="px-5 py-3 text-sm text-slate-600">{titleCase(ins.inspection_type)}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{
                        backgroundColor: ins.result === 'pass' ? '#dcfce7' : ins.result === 'warning' ? '#fef3c7' : '#fee2e2',
                        color: ins.result === 'pass' ? '#16a34a' : ins.result === 'warning' ? '#d97706' : '#dc2626',
                      }}>
                        {titleCase(ins.result)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {ins.catch_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <X className="w-4 h-4 text-slate-300" />}
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-600">
                      {ins.violations_found && ins.violations_found.length > 0 ? ins.violations_found.length : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Heat Map */}
      {activeTab === 'heatmap' && <HeatMap incidents={incidents} zones={zones} alerts={alerts} />}

      {/* Incident Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="h-2" style={{ backgroundColor: getColor(selected.severity) }} />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{INCIDENT_LABELS[selected.incident_type] || titleCase(selected.incident_type)}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{formatDate(selected.date)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ backgroundColor: `${getColor(selected.severity)}15`, color: getColor(selected.severity) }}>{titleCase(selected.severity)} Severity</span>
                <span className="text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5" style={{ backgroundColor: `${getColor(selected.status)}15`, color: getColor(selected.status) }}><StatusIcon status={selected.status} /> {titleCase(selected.status)}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="bg-slate-50 rounded-lg p-3"><div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Ship className="w-3.5 h-3.5" /> Vessel</div><div className="font-semibold text-slate-900 text-sm">{selected.vessel_name || 'Unknown'}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><Activity className="w-3.5 h-3.5" /> Zone</div><div className="font-semibold text-slate-900 text-sm">{selected.zone_id ? zoneMap.get(selected.zone_id) || 'Unknown' : 'N/A'}</div></div>
                <div className="bg-slate-50 rounded-lg p-3"><div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1"><DollarSign className="w-3.5 h-3.5" /> Penalty</div><div className="font-semibold text-slate-900 text-sm">{selected.penalty_amount > 0 ? `KES ${formatNumber(selected.penalty_amount)}` : 'No penalty'}</div></div>
              </div>
              {selected.description && <div className="mb-4"><div className="text-xs text-slate-500 mb-1">Description</div><p className="text-sm text-slate-700">{selected.description}</p></div>}
              {selected.resolution && <div className="bg-emerald-50 rounded-lg p-3"><div className="text-xs text-emerald-700 font-medium mb-1">Resolution</div><p className="text-sm text-emerald-800">{selected.resolution}</p></div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VesselTrackingMap({ vessels, tracks, zones, alerts }: { vessels: Vessel[]; tracks: VesselTrack[]; zones: MarineZone[]; alerts: GeofenceAlert[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { center: [-3.5, 40.0], zoom: 11, zoomControl: true });
    mapRef.current = map;

    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri', maxZoom: 19,
    });
    const ocean = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — GEBCO, NOAA', maxZoom: 13,
    });
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19,
    });

    satellite.addTo(map);
    L.control.layers({ Satellite: satellite, 'Ocean (GEBCO/NOAA)': ocean, Street: street }, undefined, { position: 'topright', collapsed: false }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    // Zone polygons or markers
    zones.forEach(zone => {
      const hasBoundary = zone.boundary_geojson && (zone.boundary_geojson as { type?: string }).type === 'Feature';
      if (hasBoundary) {
        const geojsonFeature = zone.boundary_geojson as unknown as GeoJSONFeatureCollection['features'][number];
        const featureCollection: GeoJSONFeatureCollection = {
          type: 'FeatureCollection',
          features: [geojsonFeature],
        };

        L.geoJSON(featureCollection, {
          style: () => ({
            fillColor: getZoneColor(zone.zone_type),
            color: '#fff',
            weight: 2,
            opacity: 0.7,
            fillOpacity: 0.2,
          }),
          onEachFeature: (_feature, lyr) => {
            lyr.bindPopup(`<b>${zone.name}</b><br>${zone.zone_type}<br>Status: ${zone.zone_status || 'open'}<br>Area: ${zone.area_km2} km²`);
          },
        }).addTo(map);
      } else {
        const centroid = getZoneCentroid(zone);
        if (!centroid) return;

        L.circleMarker([centroid.lat, centroid.lng], {
          radius: Math.max(8, Math.min(20, Math.sqrt(zone.area_km2) / 3)),
          fillColor: getZoneColor(zone.zone_type), color: '#fff', weight: 2, opacity: 0.6, fillOpacity: 0.2,
        }).addTo(map).bindPopup(`<b>${zone.name}</b><br>${zone.zone_type}<br>Status: ${zone.zone_status || 'open'}`);
      }
    });

    // Vessel tracks
    const vesselsWithTracks = vessels.filter(v => tracks.some(t => t.vessel_id === v.id));
    vesselsWithTracks.forEach(vessel => {
      const vesselTracks = tracks
        .filter(t => t.vessel_id === vessel.id)
        .filter(t => isValidCoordinate(t.latitude) && isValidCoordinate(t.longitude))
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (vesselTracks.length === 0) return;

      const latest = vesselTracks[vesselTracks.length - 1];
      const hasAlert = alerts.some(a => a.vessel_id === vessel.id && !a.acknowledged);
      const color = hasAlert ? '#dc2626' : vessel.license_status === 'active' ? '#16a34a' : '#f59e0b';

      // Track line
      const latlngs = vesselTracks.map(t => [t.latitude, t.longitude] as [number, number]);
      L.polyline(latlngs, { color, weight: 2, opacity: 0.6, dashArray: '5,5' }).addTo(map);

      // Vessel marker
      const marker = L.circleMarker([latest.latitude, latest.longitude], {
        radius: 8, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9,
      }).addTo(map);

      const popupContent = `
        <div style="min-width:200px;font-family:Inter,sans-serif">
          <div style="background:${color};color:white;padding:6px 10px;border-radius:6px 6px 0 0;font-weight:600;font-size:13px">${vessel.vessel_name}</div>
          <div style="padding:8px 10px;font-size:12px;color:#475569">
            <div>Reg: ${vessel.registration_id}</div>
            <div>Type: ${vessel.vessel_type}</div>
            <div>License: ${vessel.license_status}</div>
            <div>GPS: ${vessel.gps_device_id || 'No GPS'}</div>
            <div>Speed: ${latest.speed_knots || '—'} knots</div>
            <div>Heading: ${latest.heading || '—'}°</div>
            <div style="margin-top:4px;font-size:11px;color:#94a3b8">Updated: ${formatDate(latest.timestamp)}</div>
          </div>
        </div>
      `;
      marker.bindPopup(popupContent, { maxWidth: 250 });
    });

    // Alert markers
    alerts
      .filter(a => !a.acknowledged && isValidCoordinate(a.latitude) && isValidCoordinate(a.longitude))
      .forEach(alert => {
        const latitude = alert.latitude as number;
        const longitude = alert.longitude as number;

        L.circleMarker([latitude, longitude], {
          radius: 12, fillColor: getColor(alert.severity), color: '#fff', weight: 3, opacity: 1, fillOpacity: 0.4,
        }).addTo(map).bindPopup(`<b>ALERT: ${alert.vessel_name || 'Unknown'}</b><br>${alert.alert_type}<br>${alert.zone_name || ''}`);
      });

    return () => { map.remove(); mapRef.current = null; };
  }, [vessels, tracks, zones, alerts]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full h-[550px] rounded-xl overflow-hidden border border-slate-200 z-0" />
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Active vessel (GPS tracked)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500" /> Vessel with active alert</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500" /> Suspended/inactive license</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-emerald-500" style={{ borderTop: '2px dashed' }} /> GPS track history</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex items-start gap-2 text-xs text-slate-600">
        <Radio className="w-4 h-4 text-cyan-600 flex-shrink-0 mt-0.5" />
        <span>Waterproof GPS tracking devices transmit vessel positions in real-time. The system automatically triggers geofence alerts when vessels enter restricted or seasonally closed zones. Track lines show recent movement history.</span>
      </div>
    </div>
  );
}

function HeatMap({ incidents, zones, alerts }: { incidents: ComplianceIncident[]; zones: MarineZone[]; alerts: GeofenceAlert[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { center: [-3.5, 40.0], zoom: 11 });
    mapRef.current = map;

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — GEBCO, NOAA', maxZoom: 13,
    }).addTo(map);
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}', {
      attribution: '', maxZoom: 13,
    }).addTo(map);

    // Count incidents per zone
    const zoneIncidentCounts: Record<string, number> = {};
    incidents.forEach(inc => {
      if (inc.zone_id) zoneIncidentCounts[inc.zone_id] = (zoneIncidentCounts[inc.zone_id] || 0) + 1;
    });

    // Count alerts per zone
    const zoneAlertCounts: Record<string, number> = {};
    alerts.forEach(a => {
      if (a.zone_id) zoneAlertCounts[a.zone_id] = (zoneAlertCounts[a.zone_id] || 0) + 1;
    });

    // Draw heat circles for each zone — use centroid from polygon or coordinates
    zones.forEach(zone => {
      const centroid = getZoneCentroid(zone);
      if (!centroid) return;

      const incCount = zoneIncidentCounts[zone.id] || 0;
      const alertCount = zoneAlertCounts[zone.id] || 0;
      const total = incCount + alertCount;
      if (total === 0) return;

      const intensity = Math.min(1, total / 5);
      const color = total >= 4 ? '#dc2626' : total >= 2 ? '#f59e0b' : '#fbbf24';
      const radius = 20 + total * 10;

      L.circle([centroid.lat, centroid.lng], {
        radius,
        fillColor: color, color: color, weight: 1, opacity: 0.4, fillOpacity: intensity * 0.5,
      }).addTo(map).bindPopup(`
        <div style="min-width:180px;font-family:Inter,sans-serif">
          <div style="font-weight:600;font-size:14px;color:#0f172a;margin-bottom:4px">${zone.name}</div>
          <div style="font-size:12px;color:#475569">
            <div>Compliance Incidents: <b>${incCount}</b></div>
            <div>Geofence Alerts: <b>${alertCount}</b></div>
            <div>Total Events: <b>${total}</b></div>
          </div>
        </div>
      `);
    });

    // Also show zone center markers
    zones.forEach(zone => {
      const centroid = getZoneCentroid(zone);
      if (!centroid) return;
      L.circleMarker([centroid.lat, centroid.lng], {
        radius: 4, fillColor: '#1e293b', color: '#fff', weight: 1, opacity: 1, fillOpacity: 1,
      }).addTo(map).bindTooltip(zone.name, { permanent: false });
    });

    return () => { map.remove(); mapRef.current = null; };
  }, [incidents, zones, alerts]);

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="w-full h-[550px] rounded-xl overflow-hidden border border-slate-200 z-0" />
      <div className="flex flex-wrap gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500 opacity-60" /> High compliance risk (4+ events)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500 opacity-60" /> Moderate risk (2-3 events)</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-yellow-400 opacity-60" /> Low risk (1 event)</div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3 flex items-start gap-2 text-xs text-slate-600">
        <Crosshair className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <span>Heat map shows compliance hotspots by combining violation incidents and geofence alerts per zone. Larger, darker circles indicate areas requiring increased enforcement attention.</span>
      </div>
    </div>
  );
}
