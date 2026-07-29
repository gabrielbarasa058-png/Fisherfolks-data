import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MarineZone } from '../types';
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

interface ZoneMapProps {
  zones: MarineZone[];
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

export default function ZoneMap({ zones, onZoneClick }: ZoneMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-3.5, 40.0],
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

    zones.forEach((zone) => {
      if (!zone.coordinates) return;
      const { lat, lng } = zone.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const color = getZoneColor(zone.zone_type);
      const rings = extractPolygonRings(zone.boundary_geojson);

      if (rings && rings.length > 0) {
        const outerRing = rings[0];
        const latlngs: L.LatLngExpression[] = outerRing.map(
          (c: number[]) => [c[1], c[0]] as [number, number]
        );

        const polygon = L.polygon(latlngs, {
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.9,
          fillOpacity: 0.25,
          dashArray: '4 4',
        }).addTo(map);

        const activities = zone.allowed_activities?.length
          ? zone.allowed_activities.map((a) => `• ${a}`).join('<br>')
          : 'No activities listed';

        const popupContent = `
          <div style="min-width: 220px; font-family: Inter, sans-serif;">
            <div style="background: ${color}; color: white; padding: 8px 12px; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px;">
              ${zone.name}
            </div>
            <div style="padding: 10px 12px;">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                ${ZONE_TYPE_LABELS[zone.zone_type] || zone.zone_type} · ${zone.area_km2.toLocaleString()} km²
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">Allowed Activities:</div>
              <div style="font-size: 11px; color: #475569; line-height: 1.6;">${activities}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
                ${zone.managing_authority}
              </div>
            </div>
          </div>
        `;

        polygon.bindPopup(popupContent, { maxWidth: 300 });

        if (onZoneClick) {
          polygon.on('click', () => onZoneClick(zone));
        }

        layersRef.current.push(polygon);
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

        const activities = zone.allowed_activities?.length
          ? zone.allowed_activities.map((a) => `• ${a}`).join('<br>')
          : 'No activities listed';

        const popupContent = `
          <div style="min-width: 220px; font-family: Inter, sans-serif;">
            <div style="background: ${color}; color: white; padding: 8px 12px; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px;">
              ${zone.name}
            </div>
            <div style="padding: 10px 12px;">
              <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">
                ${ZONE_TYPE_LABELS[zone.zone_type] || zone.zone_type} · ${zone.area_km2.toLocaleString()} km²
              </div>
              <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-bottom: 4px;">Allowed Activities:</div>
              <div style="font-size: 11px; color: #475569; line-height: 1.6;">${activities}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
                ${zone.managing_authority}
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 300 });

        if (onZoneClick) {
          marker.on('click', () => onZoneClick(zone));
        }

        layersRef.current.push(marker);
        fitBounds.push(L.latLngBounds([lat, lng], [lat, lng]));
      }
    });

    if (fitBounds.length > 0) {
      const combined = fitBounds.reduce((acc, b) => acc.extend(b), fitBounds[0]);
      map.fitBounds(combined.pad(0.2), { maxZoom: 12 });
    }
  }, [zones, onZoneClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] rounded-xl overflow-hidden border border-slate-200 z-0"
    />
  );
}
