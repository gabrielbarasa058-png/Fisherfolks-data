import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import type { FeatureCollection } from 'geojson';
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

const ZONE_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  closed: 'Closed',
  seasonal_closure: 'Seasonal Closure',
  under_review: 'Under Review',
};

interface ZoneMapProps {
  zones: MarineZone[];
  onZoneClick?: (zone: MarineZone) => void;
  showBoundaries?: boolean;
}

interface PolygonGeometry {
  type: 'Polygon';
  coordinates: number[][][];
}

interface MultiPolygonGeometry {
  type: 'MultiPolygon';
  coordinates: number[][][][];
}

interface PointGeometry {
  type: 'Point';
  coordinates: number[];
}

interface GeoJSONBoundaryFeature {
  type: 'Feature';
  properties: {
    name: string;
    zone_type: string;
    designation?: string;
    area_km2?: number;
    num_boundary_points?: number;
  };
  geometry: PolygonGeometry | MultiPolygonGeometry | PointGeometry;
}

function isPolygonFeature(boundary: unknown): boundary is GeoJSONBoundaryFeature {
  if (!boundary || typeof boundary !== 'object') return false;
  const b = boundary as Record<string, unknown>;
  if (b.type !== 'Feature') return false;
  const geom = b.geometry as Record<string, unknown> | undefined;
  if (!geom) return false;
  return geom.type === 'Polygon' || geom.type === 'MultiPolygon';
}

export default function ZoneMap({ zones, onZoneClick, showBoundaries = true }: ZoneMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<L.CircleMarker[]>([]);
  const polygonLayersRef = useRef<L.GeoJSON[]>([]);

  const buildPolygonStyle = useCallback((zone: MarineZone) => {
    const color = getZoneColor(zone.zone_type);
    return {
      fillColor: color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.35,
    };
  }, []);

  const buildPolygonHoverStyle = useCallback((zone: MarineZone) => {
    const color = getZoneColor(zone.zone_type);
    return {
      fillColor: color,
      color: '#ffffff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.55,
    };
  }, []);

  const buildPolygonPopup = useCallback((zone: MarineZone) => {
    const color = getZoneColor(zone.zone_type);
    const activities = zone.allowed_activities?.length
      ? zone.allowed_activities.map(a => `&bull; ${a}`).join('<br>')
      : 'No activities listed';
    const restrictions = zone.restrictions?.length
      ? zone.restrictions.map(r => `&bull; ${r}`).join('<br>')
      : 'No restrictions listed';
    const statusLabel = zone.zone_status ? ZONE_STATUS_LABELS[zone.zone_status] || zone.zone_status : 'Open';
    const typeLabel = ZONE_TYPE_LABELS[zone.zone_type] || zone.zone_type;

    // Count boundary points if available
    let boundaryInfo = '';
    if (zone.boundary_geojson && isPolygonFeature(zone.boundary_geojson)) {
      const n = (zone.boundary_geojson as GeoJSONBoundaryFeature).properties.num_boundary_points;
      if (n) {
        boundaryInfo = `<div style="font-size: 11px; color: #64748b; margin-top: 4px;">Boundary: ${n} vertices</div>`;
      }
    }

    return `
      <div style="min-width: 260px; font-family: Inter, sans-serif;">
        <div style="background: ${color}; color: white; padding: 10px 14px; border-radius: 8px 8px 0 0; font-weight: 600; font-size: 14px;">
          ${zone.name}
        </div>
        <div style="padding: 12px 14px;">
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${typeLabel} &middot; ${zone.area_km2.toLocaleString()} km&sup2; &middot; ${statusLabel}
          </div>
          ${zone.designation ? `<div style="font-size: 12px; color: #334155; margin-bottom: 8px; font-style: italic;">${zone.designation}</div>` : ''}
          <div style="font-size: 11px; color: #0f172a; margin-bottom: 4px; font-weight: 600;">Allowed Activities:</div>
          <div style="font-size: 11px; color: #475569; line-height: 1.6; margin-bottom: 8px;">${activities}</div>
          <div style="font-size: 11px; color: #0f172a; margin-bottom: 4px; font-weight: 600;">Restrictions:</div>
          <div style="font-size: 11px; color: #dc2626; line-height: 1.6; margin-bottom: 8px;">${restrictions}</div>
          <div style="font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            ${zone.managing_authority}
          </div>
          ${boundaryInfo}
        </div>
      </div>
    `;
  }, []);

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

  // Update markers/polygons when zones change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers and polygon layers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    polygonLayersRef.current.forEach(layer => map.removeLayer(layer));
    polygonLayersRef.current = [];

    if (showBoundaries) {
      // Render polygons for zones with boundary_geojson
      const zonesWithBoundaries = zones.filter(z => z.boundary_geojson && isPolygonFeature(z.boundary_geojson));
      const zonesWithoutBoundaries = zones.filter(z => !z.boundary_geojson || !isPolygonFeature(z.boundary_geojson));

      // Draw polygon boundaries
      zonesWithBoundaries.forEach((zone) => {
        const geojsonFeature = zone.boundary_geojson as GeoJSONBoundaryFeature;
        const style = buildPolygonStyle(zone);

        const featureCollection: FeatureCollection = {
          type: 'FeatureCollection',
          features: [geojsonFeature],
        };

        const geojsonLayer = L.geoJSON(
          featureCollection,
          {
            style: () => style,
            onEachFeature: (_feature, layer) => {
              const popupContent = buildPolygonPopup(zone);
              layer.bindPopup(popupContent, { maxWidth: 320 });

              // Tooltip with zone name (permanent label)
              layer.bindTooltip(zone.name, {
                permanent: true,
                direction: 'center',
                className: 'zone-label-tooltip',
              });

              // Hover effect
              layer.on('mouseover', (e) => {
                const hoverStyle = buildPolygonHoverStyle(zone);
                (e.target as L.Path).setStyle(hoverStyle);
              });
              layer.on('mouseout', (e) => {
                (e.target as L.Path).setStyle(style);
              });

              if (onZoneClick) {
                layer.on('click', () => onZoneClick(zone));
              }
            },
          }
        ).addTo(map);

        polygonLayersRef.current.push(geojsonLayer);
      });

      // Draw point markers for zones without boundaries
      zonesWithoutBoundaries.forEach((zone) => {
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

        const popupContent = buildPolygonPopup(zone);
        marker.bindPopup(popupContent, { maxWidth: 300 });

        // Tooltip for point markers too
        marker.bindTooltip(zone.name, { permanent: false, direction: 'top' });

        if (onZoneClick) {
          marker.on('click', () => onZoneClick(zone));
        }

        markersRef.current.push(marker);
      });
    } else {
      // Point markers only mode — render all zones as circle markers
      zones.forEach((zone) => {
        // Prefer centroid from boundary_geojson if no explicit coordinates
        let lat: number | undefined;
        let lng: number | undefined;

        if (zone.coordinates) {
          lat = zone.coordinates.lat;
          lng = zone.coordinates.lng;
        } else if (zone.boundary_geojson && isPolygonFeature(zone.boundary_geojson)) {
          const geom = zone.boundary_geojson.geometry;
          if (geom.type === 'Polygon') {
            const ring = geom.coordinates[0];
            lat = ring.reduce((s, p) => s + p[1], 0) / ring.length;
            lng = ring.reduce((s, p) => s + p[0], 0) / ring.length;
          }
        }

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

        const popupContent = buildPolygonPopup(zone);
        marker.bindPopup(popupContent, { maxWidth: 300 });

        if (onZoneClick) {
          marker.on('click', () => onZoneClick(zone));
        }

        markersRef.current.push(marker);
      });
    }

    // Fit bounds to show all zones
    const allLayers = [...markersRef.current, ...polygonLayersRef.current];
    if (allLayers.length > 0) {
      const group = L.featureGroup(allLayers);
      map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 12 });
    }
  }, [zones, onZoneClick, showBoundaries, buildPolygonStyle, buildPolygonHoverStyle, buildPolygonPopup]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] rounded-xl overflow-hidden border border-slate-200 z-0"
    />
  );
}
