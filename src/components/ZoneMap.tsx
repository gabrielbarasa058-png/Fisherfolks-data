import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MarineZone, LandingSite } from '../types';
import { getZoneColor } from '../lib/format';

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

const ZONE_STATUS_STYLES: Record<string, { dashArray: string; fillOpacity: number }> = {
  open: { dashArray: '', fillOpacity: 0.2 },
  closed: { dashArray: '6 4', fillOpacity: 0.4 },
  seasonal_closure: { dashArray: '10 6', fillOpacity: 0.35 },
  under_review: { dashArray: '2 6', fillOpacity: 0.25 },
};

interface ZoneMapProps {
  zones: MarineZone[];
  landingSites?: LandingSite[];
  onZoneClick?: (zone: MarineZone) => void;
}

interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

function extractPolygonRings(geojson: unknown): number[][][] | null {
  if (!geojson || typeof geojson !== 'object') return null;
  const g = geojson as GeoJSONGeometry;
  if (g.type === 'Polygon' && Array.isArray(g.coordinates)) {
    return g.coordinates as number[][][];
  }
  if (g.type === 'MultiPolygon' && Array.isArray(g.coordinates)) {
    return (g.coordinates as unknown as number[][][][])[0];
  }
  return null;
}

function buildPopupContent(zone: MarineZone, color: string): string {
  const activities = zone.allowed_activities?.length
    ? zone.allowed_activities.map((a) => `&bull; ${a}`).join('<br>')
    : 'No activities listed';

  const restrictions = zone.restrictions?.length
    ? zone.restrictions.map((r) => `&bull; ${r}`).join('<br>')
    : 'None listed';

  const statusLabel = zone.zone_status
    ? zone.zone_status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Open';

  return `
    <div style="min-width: 260px; font-family: Inter, sans-serif;">
      <div style="background: ${color}; color: white; padding: 10px 14px; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: space-between;">
        <span>${zone.name}</span>
        <span style="font-size: 10px; background: rgba(255,255,255,0.25); padding: 2px 8px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px;">${statusLabel}</span>
      </div>
      <div style="padding: 12px 14px;">
        <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
          ${ZONE_TYPE_LABELS[zone.zone_type] || zone.zone_type} &middot; ${zone.area_km2.toLocaleString()} km&sup2;
        </div>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">Allowed Activities:</div>
        <div style="font-size: 11px; color: #475569; line-height: 1.7;">${activities}</div>
        <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 8px; margin-bottom: 4px;">Restrictions:</div>
        <div style="font-size: 11px; color: #b91c1c; line-height: 1.7;">${restrictions}</div>
        <div style="font-size: 11px; color: #64748b; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          <strong>Managing Authority:</strong> ${zone.managing_authority}
        </div>
        ${zone.established_date ? `<div style="font-size: 11px; color: #64748b; margin-top: 4px;"><strong>Established:</strong> ${new Date(zone.established_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>` : ''}
      </div>
    </div>
  `;
}

export default function ZoneMap({ zones, landingSites, onZoneClick }: ZoneMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-3.45, 40.0],
      zoom: 10,
      zoomControl: true,
      attributionControl: true,
    });

    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    const oceanLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ',
      maxZoom: 13,
    });

    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19,
    });

    satelliteLayer.addTo(map);

    L.control.layers({
      'Satellite': satelliteLayer,
      'Ocean (GEBCO/NOAA)': oceanLayer,
      'Street': streetLayer,
    }, undefined, { position: 'topright', collapsed: false }).addTo(map);

    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    mapRef.current = map;

    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    layersRef.current.forEach((l) => l.remove());
    layersRef.current = [];

    const fitBounds: L.LatLngBounds[] = [];

    // Draw zone boundaries
    zones.forEach((zone) => {
      if (!zone.coordinates) return;
      const { lat, lng } = zone.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const color = getZoneColor(zone.zone_type);
      const statusStyle = zone.zone_status
        ? (ZONE_STATUS_STYLES[zone.zone_status] || ZONE_STATUS_STYLES.open)
        : ZONE_STATUS_STYLES.open;

      const rings = extractPolygonRings(zone.boundary_geojson);
      const popupContent = buildPopupContent(zone, color);

      if (rings && rings.length > 0) {
        const outerRing = rings[0];
        const latlngs: L.LatLngExpression[] = outerRing.map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        );

        const polygon = L.polygon(latlngs, {
          fillColor: color,
          color: color,
          weight: 2.5,
          opacity: 0.9,
          fillOpacity: statusStyle.fillOpacity,
          dashArray: statusStyle.dashArray,
        }).addTo(map);

        polygon.bindPopup(popupContent, { maxWidth: 320 });

        polygon.on('mouseover', () => {
          polygon.setStyle({ weight: 4, fillOpacity: Math.min(statusStyle.fillOpacity + 0.15, 0.5) });
        });
        polygon.on('mouseout', () => {
          polygon.setStyle({ weight: 2.5, fillOpacity: statusStyle.fillOpacity });
        });

        if (onZoneClick) {
          polygon.on('click', () => onZoneClick(zone));
        }

        // Add permanent zone name label
        const labelCenter = polygon.getBounds().getCenter();
        const label = L.marker(labelCenter, {
          icon: L.divIcon({
            className: 'zone-label',
            html: `<div style="background: rgba(255,255,255,0.85); padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; color: ${color}; white-space: nowrap; border: 1px solid ${color}40; box-shadow: 0 1px 3px rgba(0,0,0,0.15);">${zone.name}</div>`,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          interactive: false,
          keyboard: false,
        }).addTo(map);

        layersRef.current.push(polygon, label);
        fitBounds.push(polygon.getBounds());
      } else {
        const radius = Math.max(8, Math.min(20, Math.sqrt(zone.area_km2) / 3));
        const marker = L.circleMarker([lat, lng], {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(map);

        marker.bindPopup(popupContent, { maxWidth: 320 });

        if (onZoneClick) {
          marker.on('click', () => onZoneClick(zone));
        }

        layersRef.current.push(marker);
        fitBounds.push(L.latLngBounds([lat, lng], [lat, lng]));
      }
    });

    // Draw landing site markers
    if (landingSites && landingSites.length > 0) {
      landingSites.forEach((site) => {
        if (!site.coordinates) return;
        const { lat, lng } = site.coordinates;
        if (typeof lat !== 'number' || typeof lng !== 'number') return;

        const icon = L.divIcon({
          className: 'landing-site-marker',
          html: `<div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:12px;height:12px;background:#f59e0b;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
            <div style="font-size:9px;font-weight:600;color:#92400e;background:rgba(255,255,255,0.9);padding:1px 5px;border-radius:3px;margin-top:2px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.15);">${site.name}</div>
          </div>`,
          iconSize: [0, 0],
          iconAnchor: [6, 6],
        });

        const marker = L.marker([lat, lng], { icon }).addTo(map);

        const sitePopup = `
          <div style="min-width:180px;font-family:Inter,sans-serif;">
            <div style="background:#f59e0b;color:white;padding:8px 12px;border-radius:8px 8px 0 0;font-weight:600;font-size:13px;">${site.name}</div>
            <div style="padding:10px 12px;">
              <div style="font-size:11px;color:#64748b;margin-bottom:4px;">Landing Site &middot; ${site.county}</div>
              ${site.beach ? `<div style="font-size:11px;color:#475569;margin-bottom:3px;"><strong>Beach:</strong> ${site.beach}</div>` : ''}
              ${site.bmu ? `<div style="font-size:11px;color:#475569;margin-bottom:3px;"><strong>BMU:</strong> ${site.bmu}</div>` : ''}
              <div style="font-size:11px;color:#475569;margin-bottom:3px;"><strong>Type:</strong> ${site.landing_site_type}</div>
              <div style="font-size:11px;color:${site.active ? '#16a34a' : '#dc2626'};font-weight:600;margin-top:4px;">${site.active ? '● Active' : '● Inactive'}</div>
            </div>
          </div>
        `;
        marker.bindPopup(sitePopup, { maxWidth: 250 });

        layersRef.current.push(marker);
        fitBounds.push(L.latLngBounds([lat, lng], [lat, lng]));
      });
    }

    if (fitBounds.length > 0) {
      const combined = fitBounds.reduce((acc, b) => acc.extend(b), fitBounds[0]);
      map.fitBounds(combined.pad(0.15), { maxZoom: 12 });
    }
  }, [zones, landingSites, onZoneClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] rounded-xl overflow-hidden border border-slate-200 z-0"
    />
  );
}
