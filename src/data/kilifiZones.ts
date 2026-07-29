/**
 * Kilifi County Marine Zone Boundary Data
 *
 * This module provides GeoJSON polygon boundaries for Kilifi County marine fishing zones.
 * Data sources:
 * - Kenya Wildlife Service (KWS) — Marine Protected Areas
 * - Kenya Marine and Fisheries Research Institute (KMFRI) — Fishing Zones
 * - County Government of Kilifi — Fisheries Department
 *
 * Coordinate system: WGS84 (EPSG:4326)
 */

import kilifiGeoJSON from './kilifi_marine_zones.geojson';
import type { MarineZone } from '../types';

export interface KilifiZoneFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    zone_type: string;
    designation: string;
    area_km2: number;
    zone_status: string;
    status: string;
    managing_authority: string;
    allowed_activities: string[];
    restrictions: string[];
    licensing_requirements: string[];
    established_date: string;
  };
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
}

export interface KilifiZoneFeatureCollection {
  type: 'FeatureCollection';
  name: string;
  description: string;
  features: KilifiZoneFeature[];
}

// Map of original IDs to new UUIDs
const ID_MAP: Record<string, string> = {
  'kilifi_mp_001': '81bedce1-04ce-4a4c-9c2e-fc62ff37f837',
  'kilifi_mp_002': '443ae7f5-7d71-4a6c-b969-c32a8166093c',
  'kilifi_mp_003': 'd62e0ce6-1662-4d01-b20c-b9ee8aca2bc2',
  'kilifi_mp_004': '315e6a98-d8cc-4e9d-af1a-68ae6f62cf93',
  'kilifi_mp_005': '1ba7f629-fdca-48bc-9ccb-0f593ca4508c',
  'kilifi_mp_006': '17708703-c47b-46f7-b99d-6d3e4650d4bb',
  'kilifi_mp_007': '82a0f6e8-633f-42e8-bddd-d76e9f479135',
  'kilifi_mp_008': 'bcad29ae-6674-40d3-baba-3b013859b730',
  'kilifi_mp_009': 'ed78643d-1b49-4006-b718-647273059e78',
  'kilifi_mp_010': '39d4df6d-b96f-4d1b-a0d8-c960512b54c2',
  'kilifi_mp_011': '47b9674c-e5be-4796-aacc-ee91a273a3d3',
  'kilifi_mp_012': 'dfadb11e-208d-430d-997f-6269c87488f1',
  'kilifi_mp_013': '44319bec-1f5c-45cc-9478-f193fdf1c3e8',
};

/**
 * Returns the raw GeoJSON FeatureCollection for Kilifi marine zones.
 */
export function getKilifiZoneGeoJSON(): KilifiZoneFeatureCollection {
  const collection = kilifiGeoJSON as unknown as KilifiZoneFeatureCollection;
  // Apply ID mapping to ensure consistency with database UUIDs
  return {
    ...collection,
    features: collection.features.map(f => ({
      ...f,
      id: ID_MAP[f.id] || f.id
    }))
  };
}

/**
 * Converts the Kilifi GeoJSON zones into MarineZone-compatible objects.
 * Each zone gets a computed centroid from its polygon for the `coordinates` field.
 */
export function getKilifiZonesAsMarineZones(): MarineZone[] {
  const collection = getKilifiZoneGeoJSON();
  return collection.features.map((feature) => {
    const coords = feature.geometry.coordinates[0];
    const centroid = computeCentroid(coords);
    const numPoints = coords.length;

    return {
      id: feature.id,
      name: feature.properties.name,
      zone_type: feature.properties.zone_type,
      designation: feature.properties.designation,
      area_km2: feature.properties.area_km2,
      allowed_activities: feature.properties.allowed_activities,
      restrictions: feature.properties.restrictions,
      status: feature.properties.status,
      zone_status: feature.properties.zone_status,
      licensing_requirements: feature.properties.licensing_requirements,
      established_date: feature.properties.established_date,
      managing_authority: feature.properties.managing_authority,
      coordinates: centroid,
      landing_site_id: null,
      boundary_geojson: {
        type: 'Feature' as const,
        properties: {
          name: feature.properties.name,
          zone_type: feature.properties.zone_type,
          designation: feature.properties.designation,
          area_km2: feature.properties.area_km2,
          num_boundary_points: numPoints,
        },
        geometry: feature.geometry,
      },
    };
  });
}

/**
 * Computes the centroid of a polygon ring (array of [lng, lat] pairs).
 */
function computeCentroid(ring: number[][]): { lat: number; lng: number } {
  let sumLng = 0;
  let sumLat = 0;
  const n = ring.length;
  // The last point is the same as the first (closed ring), so use n-1 points.
  const count = n - 1;
  for (let i = 0; i < count; i++) {
    sumLng += ring[i][0]; // lng
    sumLat += ring[i][1]; // lat
  }
  return {
    lat: sumLat / count,
    lng: sumLng / count,
  };
}

/**
 * Gets a single zone by ID from the Kilifi dataset.
 */
export function getKilifiZoneById(id: string): KilifiZoneFeature | undefined {
  const collection = getKilifiZoneGeoJSON();
  return collection.features.find((f) => f.id === id);
}

/**
 * Gets all zone IDs from the Kilifi dataset.
 */
export function getAllKilifiZoneIds(): string[] {
  const collection = getKilifiZoneGeoJSON();
  return collection.features.map((f) => f.id);
}

/**
 * Returns the GeoJSON boundary for a specific zone ID.
 */
export function getZoneBoundaryGeoJSON(zoneId: string) {
  const feature = getKilifiZoneById(zoneId);
  if (!feature) return null;
  return {
    type: 'Feature' as const,
    properties: feature.properties,
    geometry: feature.geometry,
  };
}
