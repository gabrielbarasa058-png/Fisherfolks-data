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

export default function ZoneMap({ zones, onZoneClick }: ZoneMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [-3.5, 40.0],
      zoom: 10,
      zoomControl: true,
      attributionControl: true,
    });

    // Layer 1: Street (OpenStreetMap)
    const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    });

    // Layer 2: Ocean (Esri Ocean Basemap)
    const oceanLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ',
      maxZoom: 13,
    });

    // Layer 3: Satellite (Esri World Imagery)
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
      maxZoom: 19,
    });

    // Default layer
    satelliteLayer.addTo(map);

    // Layer control
    L.control.layers({
      'Satellite': satelliteLayer,
      'Ocean (GEBCO/NOAA)': oceanLayer,
      'Street': streetLayer,
    }, undefined, { position: 'topright', collapsed: false }).addTo(map);

    // Scale bar
    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    mapRef.current = map;

    // Fix for Leaflet default icon paths
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

  // Update markers when zones change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    zones.forEach((zone) => {
      if (!zone.coordinates) return;
      const { lat, lng } = zone.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') return;

      const color = getZoneColor(zone.zone_type);
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
        ? zone.allowed_activities.map(a => `• ${a}`).join('<br>')
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

      markersRef.current.push(marker);
    });

    // Fit bounds to markers if any
    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 12 });
    }
  }, [zones, onZoneClick]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] rounded-xl overflow-hidden border border-slate-200 z-0"
    />
  );
}
