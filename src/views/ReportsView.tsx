import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  MarineZone, ConservationArea, SpeciesRecord, ComplianceIncident,
  Vessel, CatchRecord, Fisher, Inspection, GeofenceAlert,
  HabitatHealth, RestorationProject, FishingLicense,
} from '../types';
import { formatNumber, formatArea, formatDate, titleCase } from '../lib/format';
import {
  FileBarChart, FileText, Fish, Shield, Waves,
  TrendingUp, FileSpreadsheet, Scale,
} from 'lucide-react';

type ReportType = 'monthly_fisheries' | 'compliance' | 'catch' | 'biodiversity' | 'county_performance';

export default function ReportsView() {
  const [zones, setZones] = useState<MarineZone[]>([]);
  const [conservationAreas, setConservationAreas] = useState<ConservationArea[]>([]);
  const [species, setSpecies] = useState<SpeciesRecord[]>([]);
  const [incidents, setIncidents] = useState<ComplianceIncident[]>([]);
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [catches, setCatches] = useState<CatchRecord[]>([]);
  const [fishers, setFishers] = useState<Fisher[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [licenses, setLicenses] = useState<FishingLicense[]>([]);
  const [habitats, setHabitats] = useState<HabitatHealth[]>([]);
  const [projects, setProjects] = useState<RestorationProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeReport, setActiveReport] = useState<ReportType>('monthly_fisheries');

  useEffect(() => {
    async function fetchData() {
      const [z, c, s, i, v, ca, f, ins, al, hab, proj, lic] = await Promise.all([
        supabase.from('marine_zones').select('*'),
        supabase.from('conservation_areas').select('*'),
        supabase.from('species_records').select('*'),
        supabase.from('compliance_incidents').select('*').order('date', { ascending: false }),
        supabase.from('vessels').select('*'),
        supabase.from('catches').select('*').order('landing_date', { ascending: false }),
        supabase.from('fishers').select('*'),
        supabase.from('inspections').select('*').order('date', { ascending: false }),
        supabase.from('geofence_alerts').select('*').order('timestamp', { ascending: false }),
        supabase.from('habitat_health').select('*'),
        supabase.from('restoration_projects').select('*'),
        supabase.from('fishing_licenses').select('*'),
      ]);
      setZones(z.data || []);
      setConservationAreas(c.data || []);
      setSpecies(s.data || []);
      setIncidents(i.data || []);
      setVessels(v.data || []);
      setCatches(ca.data || []);
      setFishers(f.data || []);
      setInspections(ins.data || []);
      setAlerts(al.data || []);
      setHabitats(hab.data || []);
      setProjects(proj.data || []);
      setLicenses(lic.data || []);
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

  const reports: { key: ReportType; label: string; icon: typeof FileText; description: string }[] = [
    { key: 'monthly_fisheries', label: 'Monthly Fisheries Report', icon: Fish, description: 'Catch volumes, landing site summaries, and fishing effort' },
    { key: 'compliance', label: 'Compliance Report', icon: Shield, description: 'Violations, inspections, geofence alerts, and enforcement actions' },
    { key: 'catch', label: 'Catch Report', icon: Scale, description: 'Species breakdown, gear analysis, and market value trends' },
    { key: 'biodiversity', label: 'Biodiversity Report', icon: Waves, description: 'Species status, habitat health, and conservation projects' },
    { key: 'county_performance', label: 'County Performance Indicators', icon: TrendingUp, description: 'Key performance metrics for Kilifi County fisheries' },
  ];

  const exportCSV = () => {
    let csv = '';
    let filename = '';

    if (activeReport === 'monthly_fisheries' || activeReport === 'catch') {
      csv = 'Date,Species,Fisher,Vessel,Landing Site,Gear,Weight (kg),Market Value (KES),Verified\n';
      filename = 'catch_report.csv';
      catches.forEach(c => {
        csv += `${c.landing_date},${c.species_name || ''},${c.fisher_id || ''},${c.vessel_id || ''},${c.landing_site_id || ''},${c.gear_used || ''},${c.weight_kg},${c.market_value_kes || 0},${c.verified}\n`;
      });
    } else if (activeReport === 'compliance') {
      csv = 'Date,Type,Vessel,Severity,Status,Penalty (KES),Description\n';
      filename = 'compliance_report.csv';
      incidents.forEach(i => {
        csv += `${i.date},${i.incident_type},${i.vessel_name || ''},${i.severity},${i.status},${i.penalty_amount},"${(i.description || '').replace(/"/g, '""')}"\n`;
      });
    } else if (activeReport === 'biodiversity') {
      csv = 'Species,Scientific Name,Trend,Exploitation,Stock Status,Threat Category,Catch (t),MSY (t),Region\n';
      filename = 'biodiversity_report.csv';
      species.forEach(s => {
        csv += `${s.species_name},${s.scientific_name || ''},${s.population_trend},${s.exploitation_level},${s.stock_status},${s.threat_category},${s.catch_tonnage || 0},${s.max_sustainable_yield || 0},${s.region || ''}\n`;
      });
    } else if (activeReport === 'county_performance') {
      csv = 'Indicator,Value\n';
      filename = 'county_performance.csv';
      csv += `Active Vessels,${vessels.filter(v => v.license_status === 'active').length}\n`;
      csv += `Registered Fishers,${fishers.length}\n`;
      csv += `Marine Zones,${zones.length}\n`;
      csv += `Protected Areas,${conservationAreas.length}\n`;
      csv += `Total Catch (kg),${catches.reduce((s, c) => s + c.weight_kg, 0)}\n`;
      csv += `Total Catch Value (KES),${catches.reduce((s, c) => s + (c.market_value_kes || 0), 0)}\n`;
      csv += `Compliance Incidents,${incidents.length}\n`;
      csv += `Resolved Cases,${incidents.filter(i => ['resolved', 'prosecuted'].includes(i.status)).length}\n`;
      csv += `Geofence Alerts,${alerts.length}\n`;
      csv += `Active Alerts,${alerts.filter(a => !a.acknowledged).length}\n`;
      csv += `Inspections,${inspections.length}\n`;
      csv += `Active Licenses,${licenses.filter(l => l.status === 'active').length}\n`;
      csv += `Restoration Projects,${projects.length}\n`;
      csv += `Habitat Health Sites,${habitats.length}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const reportData = generateReportData();
    const html = generatePDFHTML(reportData);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onload = () => {
        setTimeout(() => win.print(), 500);
      };
    }
  };

  const generateReportData = () => {
    const data: Record<string, unknown> = {
      reportType: reports.find(r => r.key === activeReport)?.label || '',
      generatedAt: new Date().toISOString(),
      location: 'Kilifi Old Ferry Fishing Hub, Kilifi County, Kenya',
    };

    if (activeReport === 'monthly_fisheries' || activeReport === 'catch') {
      data.totalCatch = catches.reduce((s, c) => s + c.weight_kg, 0);
      data.totalValue = catches.reduce((s, c) => s + (c.market_value_kes || 0), 0);
      data.verifiedRate = catches.length > 0 ? Math.round((catches.filter(c => c.verified).length / catches.length) * 100) : 0;
      data.speciesBreakdown = Object.entries(
        catches.reduce((acc, c) => {
          const name = c.species_name || 'Unknown';
          if (!acc[name]) acc[name] = { weight: 0, value: 0, count: 0 };
          acc[name].weight += c.weight_kg;
          acc[name].value += c.market_value_kes || 0;
          acc[name].count += 1;
          return acc;
        }, {} as Record<string, { weight: number; value: number; count: number }>)
      ).sort((a, b) => b[1].weight - a[1].weight);
    }

    if (activeReport === 'compliance') {
      data.totalIncidents = incidents.length;
      data.resolved = incidents.filter(i => ['resolved', 'prosecuted'].includes(i.status)).length;
      data.pending = incidents.filter(i => ['open', 'under_investigation'].includes(i.status)).length;
      data.totalPenalties = incidents.reduce((s, i) => s + i.penalty_amount, 0);
      data.totalAlerts = alerts.length;
      data.activeAlerts = alerts.filter(a => !a.acknowledged).length;
      data.totalInspections = inspections.length;
      data.passedInspections = inspections.filter(i => i.result === 'pass').length;
      data.failedInspections = inspections.filter(i => i.result === 'fail').length;
      data.recentIncidents = incidents.slice(0, 10);
    }

    if (activeReport === 'biodiversity') {
      data.totalSpecies = species.length;
      data.decliningSpecies = species.filter(s => s.population_trend === 'decreasing').length;
      data.recoveringSpecies = species.filter(s => s.stock_status === 'recovering').length;
      data.endangeredSpecies = species.filter(s => ['endangered', 'critically_endangered'].includes(s.threat_category)).length;
      data.habitats = habitats;
      data.projects = projects;
    }

    if (activeReport === 'county_performance') {
      data.activeVessels = vessels.filter(v => v.license_status === 'active').length;
      data.registeredFishers = fishers.length;
      data.marineZones = zones.length;
      data.protectedAreas = conservationAreas.length;
      data.totalCatch = catches.reduce((s, c) => s + c.weight_kg, 0);
      data.totalCatchValue = catches.reduce((s, c) => s + (c.market_value_kes || 0), 0);
      data.complianceIncidents = incidents.length;
      data.resolvedCases = incidents.filter(i => ['resolved', 'prosecuted'].includes(i.status)).length;
      data.geofenceAlerts = alerts.length;
      data.activeAlerts = alerts.filter(a => !a.acknowledged).length;
      data.inspections = inspections.length;
      data.activeLicenses = licenses.filter(l => l.status === 'active').length;
      data.restorationProjects = projects.length;
    }

    return data;
  };

  const generatePDFHTML = (data: Record<string, unknown>) => {
    return `<!DOCTYPE html>
<html>
<head>
<title>${data.reportType}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1e293b; }
  .header { border-bottom: 3px solid #0891b2; padding-bottom: 20px; margin-bottom: 30px; }
  .header h1 { font-size: 24px; color: #0f172a; margin: 0; }
  .header .subtitle { color: #64748b; font-size: 14px; margin-top: 5px; }
  .section { margin-bottom: 30px; }
  .section h2 { font-size: 18px; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 15px 0; }
  .stat-card { background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
  .stat-card .label { font-size: 12px; color: #64748b; }
  .stat-card .value { font-size: 22px; font-weight: bold; color: #0f172a; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; }
  th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; color: #475569; }
  td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <h1>${data.reportType}</h1>
    <div class="subtitle">${data.location} · Generated ${formatDate(data.generatedAt as string)}</div>
  </div>
  ${renderReportContent(data)}
  <div class="footer">
    Kilifi County Ocean Governance System · Old Ferry Hub · Kenya
    <br />This report was automatically generated by the Marine Compliance Dashboard.
  </div>
</body>
</html>`;
  };

  const renderReportContent = (data: Record<string, unknown>): string => {
    let html = '';
    if (activeReport === 'monthly_fisheries' || activeReport === 'catch') {
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Total Catch</div><div class="value">${formatNumber(data.totalCatch as number)} kg</div></div>
        <div class="stat-card"><div class="label">Market Value</div><div class="value">KES ${formatNumber(data.totalValue as number)}</div></div>
        <div class="stat-card"><div class="label">Verification Rate</div><div class="value">${data.verifiedRate}%</div></div>
      </div>`;
      const breakdown = data.speciesBreakdown as [string, { weight: number; value: number; count: number }][];
      if (breakdown) {
        html += `<div class="section"><h2>Species Breakdown</h2><table><thead><tr><th>Species</th><th>Weight (kg)</th><th>Value (KES)</th><th>Landings</th></tr></thead><tbody>`;
        breakdown.forEach(([name, d]) => {
          html += `<tr><td>${name}</td><td>${formatNumber(d.weight)}</td><td>${formatNumber(d.value)}</td><td>${d.count}</td></tr>`;
        });
        html += `</tbody></table></div>`;
      }
    } else if (activeReport === 'compliance') {
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Total Incidents</div><div class="value">${data.totalIncidents}</div></div>
        <div class="stat-card"><div class="label">Resolved Cases</div><div class="value">${data.resolved}</div></div>
        <div class="stat-card"><div class="label">Total Penalties</div><div class="value">KES ${formatNumber(data.totalPenalties as number)}</div></div>
      </div>`;
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Geofence Alerts</div><div class="value">${data.totalAlerts}</div></div>
        <div class="stat-card"><div class="label">Active Alerts</div><div class="value">${data.activeAlerts}</div></div>
        <div class="stat-card"><div class="label">Inspections</div><div class="value">${data.totalInspections}</div></div>
      </div>`;
      const recent = data.recentIncidents as ComplianceIncident[];
      if (recent) {
        html += `<div class="section"><h2>Recent Incidents</h2><table><thead><tr><th>Date</th><th>Type</th><th>Vessel</th><th>Severity</th><th>Status</th><th>Penalty (KES)</th></tr></thead><tbody>`;
        recent.forEach(i => {
          html += `<tr><td>${formatDate(i.date)}</td><td>${titleCase(i.incident_type)}</td><td>${i.vessel_name || 'Unknown'}</td><td>${titleCase(i.severity)}</td><td>${titleCase(i.status)}</td><td>${formatNumber(i.penalty_amount)}</td></tr>`;
        });
        html += `</tbody></table></div>`;
      }
    } else if (activeReport === 'biodiversity') {
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Total Species</div><div class="value">${data.totalSpecies}</div></div>
        <div class="stat-card"><div class="label">Declining</div><div class="value">${data.decliningSpecies}</div></div>
        <div class="stat-card"><div class="label">Endangered</div><div class="value">${data.endangeredSpecies}</div></div>
      </div>`;
      const habitats = data.habitats as HabitatHealth[];
      if (habitats) {
        html += `<div class="section"><h2>Habitat Health</h2><table><thead><tr><th>Habitat</th><th>Location</th><th>Status</th><th>Score</th><th>Coverage (km²)</th><th>Trend</th></tr></thead><tbody>`;
        habitats.forEach(h => {
          html += `<tr><td>${titleCase(h.habitat_type)}</td><td>${h.location_name}</td><td style="text-transform:uppercase;color:${h.health_status === 'green' ? '#16a34a' : h.health_status === 'yellow' ? '#d97706' : '#dc2626'};font-weight:bold">${h.health_status}</td><td>${h.health_score || '—'}</td><td>${h.coverage_km2 || '—'}</td><td>${titleCase(h.trend || '')}</td></tr>`;
        });
        html += `</tbody></table></div>`;
      }
    } else if (activeReport === 'county_performance') {
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Active Vessels</div><div class="value">${data.activeVessels}</div></div>
        <div class="stat-card"><div class="label">Registered Fishers</div><div class="value">${data.registeredFishers}</div></div>
        <div class="stat-card"><div class="label">Marine Zones</div><div class="value">${data.marineZones}</div></div>
      </div>`;
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Total Catch (kg)</div><div class="value">${formatNumber(data.totalCatch as number)}</div></div>
        <div class="stat-card"><div class="label">Catch Value (KES)</div><div class="value">${formatNumber(data.totalCatchValue as number)}</div></div>
        <div class="stat-card"><div class="label">Active Licenses</div><div class="value">${data.activeLicenses}</div></div>
      </div>`;
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Compliance Incidents</div><div class="value">${data.complianceIncidents}</div></div>
        <div class="stat-card"><div class="label">Resolved Cases</div><div class="value">${data.resolvedCases}</div></div>
        <div class="stat-card"><div class="label">Geofence Alerts</div><div class="value">${data.geofenceAlerts}</div></div>
      </div>`;
      html += `<div class="stat-grid">
        <div class="stat-card"><div class="label">Active Alerts</div><div class="value">${data.activeAlerts}</div></div>
        <div class="stat-card"><div class="label">Inspections</div><div class="value">${data.inspections}</div></div>
        <div class="stat-card"><div class="label">Restoration Projects</div><div class="value">${data.restorationProjects}</div></div>
      </div>`;
    }
    return html;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-sm text-slate-500">Automatic report generation and data export for Kilifi County fisheries</p>
      </div>

      {/* Report Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map(r => {
          const Icon = r.icon;
          const isActive = activeReport === r.key;
          return (
            <button
              key={r.key}
              onClick={() => setActiveReport(r.key)}
              className={`text-left p-5 rounded-xl border transition-all ${
                isActive
                  ? 'border-cyan-500 bg-cyan-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                isActive ? 'bg-cyan-500' : 'bg-slate-100'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-600'}`} />
              </div>
              <div className="font-semibold text-slate-900 text-sm mb-1">{r.label}</div>
              <div className="text-xs text-slate-500">{r.description}</div>
            </button>
          );
        })}
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button
          onClick={exportPDF}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Export as PDF
        </button>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export as Excel (CSV)
        </button>
      </div>

      {/* Report Preview */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
          <FileBarChart className="w-5 h-5 text-cyan-500" />
          <h2 className="font-semibold text-slate-900">
            {reports.find(r => r.key === activeReport)?.label} — Preview
          </h2>
        </div>
        <div className="p-6">
          <ReportPreview activeReport={activeReport} catches={catches} incidents={incidents} species={species} habitats={habitats} projects={projects} vessels={vessels} fishers={fishers} zones={zones} conservationAreas={conservationAreas} alerts={alerts} inspections={inspections} licenses={licenses} />
        </div>
      </div>
    </div>
  );
}

function ReportPreview({
  activeReport, catches, incidents, species, habitats, projects, vessels, fishers, zones, conservationAreas, alerts, inspections, licenses,
}: {
  activeReport: ReportType;
  catches: CatchRecord[];
  incidents: ComplianceIncident[];
  species: SpeciesRecord[];
  habitats: HabitatHealth[];
  projects: RestorationProject[];
  vessels: Vessel[];
  fishers: Fisher[];
  zones: MarineZone[];
  conservationAreas: ConservationArea[];
  alerts: GeofenceAlert[];
  inspections: Inspection[];
  licenses: FishingLicense[];
}) {
  const totalCatch = catches.reduce((s, c) => s + c.weight_kg, 0);
  const totalValue = catches.reduce((s, c) => s + (c.market_value_kes || 0), 0);

  if (activeReport === 'monthly_fisheries' || activeReport === 'catch') {
    const breakdown: Record<string, { weight: number; value: number; count: number }> = {};
    catches.forEach(c => {
      const name = c.species_name || 'Unknown';
      if (!breakdown[name]) breakdown[name] = { weight: 0, value: 0, count: 0 };
      breakdown[name].weight += c.weight_kg;
      breakdown[name].value += c.market_value_kes || 0;
      breakdown[name].count += 1;
    });
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <PreviewStat label="Total Catch" value={`${formatNumber(totalCatch)} kg`} />
          <PreviewStat label="Market Value" value={`KES ${formatNumber(totalValue)}`} />
          <PreviewStat label="Verification Rate" value={`${catches.length > 0 ? Math.round((catches.filter(c => c.verified).length / catches.length) * 100) : 0}%`} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Species</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Weight (kg)</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Value (KES)</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Landings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(breakdown).sort((a, b) => b[1].weight - a[1].weight).map(([name, d]) => (
                <tr key={name}>
                  <td className="px-4 py-2 font-medium text-slate-900">{name}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{formatNumber(d.weight)}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{formatNumber(d.value)}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeReport === 'compliance') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <PreviewStat label="Total Incidents" value={incidents.length} />
          <PreviewStat label="Resolved" value={incidents.filter(i => ['resolved', 'prosecuted'].includes(i.status)).length} />
          <PreviewStat label="Total Penalties" value={`KES ${formatNumber(incidents.reduce((s, i) => s + i.penalty_amount, 0))}`} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <PreviewStat label="Geofence Alerts" value={alerts.length} />
          <PreviewStat label="Active Alerts" value={alerts.filter(a => !a.acknowledged).length} />
          <PreviewStat label="Inspections" value={inspections.length} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Date</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Vessel</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Penalty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {incidents.slice(0, 10).map(i => (
                <tr key={i.id}>
                  <td className="px-4 py-2 text-slate-600">{formatDate(i.date)}</td>
                  <td className="px-4 py-2 font-medium text-slate-900">{titleCase(i.incident_type)}</td>
                  <td className="px-4 py-2 text-slate-600">{i.vessel_name || 'Unknown'}</td>
                  <td className="px-4 py-2 text-slate-600">{titleCase(i.status)}</td>
                  <td className="px-4 py-2 text-right text-slate-600">{formatNumber(i.penalty_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (activeReport === 'biodiversity') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <PreviewStat label="Total Species" value={species.length} />
          <PreviewStat label="Declining" value={species.filter(s => s.population_trend === 'decreasing').length} />
          <PreviewStat label="Endangered" value={species.filter(s => ['endangered', 'critically_endangered'].includes(s.threat_category)).length} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Habitat</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Location</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-2 font-semibold text-slate-600">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {habitats.map(h => (
                <tr key={h.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{titleCase(h.habitat_type)}</td>
                  <td className="px-4 py-2 text-slate-600">{h.location_name}</td>
                  <td className="px-4 py-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: h.health_status === 'green' ? '#dcfce7' : h.health_status === 'yellow' ? '#fef3c7' : '#fee2e2',
                        color: h.health_status === 'green' ? '#16a34a' : h.health_status === 'yellow' ? '#d97706' : '#dc2626',
                      }}
                    >
                      {h.health_status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-slate-600">{h.health_score || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-2">Restoration Projects</h3>
          <div className="space-y-2">
            {projects.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2 text-sm">
                <span className="font-medium text-slate-900">{p.project_name}</span>
                <span className="text-slate-500">{p.progress_percentage}% complete</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // county_performance
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <PreviewStat label="Active Vessels" value={vessels.filter(v => v.license_status === 'active').length} />
        <PreviewStat label="Registered Fishers" value={fishers.length} />
        <PreviewStat label="Marine Zones" value={zones.length} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <PreviewStat label="Total Catch" value={`${formatNumber(totalCatch)} kg`} />
        <PreviewStat label="Catch Value" value={`KES ${formatNumber(totalValue)}`} />
        <PreviewStat label="Active Licenses" value={licenses.filter(l => l.status === 'active').length} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <PreviewStat label="Compliance Incidents" value={incidents.length} />
        <PreviewStat label="Resolved Cases" value={incidents.filter(i => ['resolved', 'prosecuted'].includes(i.status)).length} />
        <PreviewStat label="Geofence Alerts" value={alerts.length} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <PreviewStat label="Active Alerts" value={alerts.filter(a => !a.acknowledged).length} />
        <PreviewStat label="Inspections" value={inspections.length} />
        <PreviewStat label="Protected Areas" value={conservationAreas.length} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <PreviewStat label="Restoration Projects" value={projects.length} />
        <PreviewStat label="Habitat Sites" value={habitats.length} />
        <PreviewStat label="Total Protected Area" value={formatArea(conservationAreas.reduce((s, c) => s + c.area_km2, 0))} />
      </div>
    </div>
  );
}

function PreviewStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
