-- ============================================================
-- Migration: Add Kilifi County Marine Fishing Zone Boundaries (FIXED)
-- ============================================================

-- 1. Expand zone_type check constraint to include new types
DO $$ BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE marine_zones DROP CONSTRAINT IF EXISTS marine_zones_zone_type_check;
  
  -- Add updated constraint
  ALTER TABLE marine_zones ADD CONSTRAINT marine_zones_zone_type_check
    CHECK (zone_type IN (
      'commercial_fishing', 'industrial', 'recreational', 'no_take', 
      'restricted_use', 'multi_use', 'conservation', 'shipping_lane',
      'artisanal_fishing', 'mangrove_reserve', 'coral_garden', 'reef_protected'
    ));
END $$;

-- 2. Ensure boundary_geojson column exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'marine_zones' AND column_name = 'boundary_geojson') THEN
    ALTER TABLE marine_zones ADD COLUMN boundary_geojson jsonb;
  END IF;
END $$;

-- 3. Helper function for centroid (idempotent)
CREATE OR REPLACE FUNCTION compute_polygon_centroid(coords jsonb)
RETURNS jsonb AS $$
DECLARE
  ring jsonb;
  point jsonb;
  sum_lng double precision := 0;
  sum_lat double precision := 0;
  n integer := 0;
BEGIN
  ring := coords->0;
  n := jsonb_array_length(ring) - 1;
  IF n <= 0 THEN RETURN NULL; END IF;
  FOR i IN 0..(n-1) LOOP
    point := ring->i;
    sum_lng := sum_lng + (point->0)::double precision;
    sum_lat := sum_lat + (point->1)::double precision;
  END LOOP;
  RETURN jsonb_build_object('lng', sum_lng / n, 'lat', sum_lat / n);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Seed Data with valid UUIDs
-- Watamu Marine National Park
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '81bedce1-04ce-4a4c-9c2e-fc62ff37f837',
  'Watamu Marine National Park',
  'no_take',
  'National Park — Strict Protection',
  142.8,
  ARRAY['Research', 'Guided diving (with permit)', 'Snorkeling (designated areas)'],
  ARRAY['No fishing of any kind', 'No anchoring on reefs', 'No collection of marine specimens'],
  'active',
  'open',
  ARRAY['KWS entry permit', 'Research permit (if applicable)'],
  '1968-01-01',
  'Kenya Wildlife Service (KWS)',
  compute_polygon_centroid('[[[39.9750,-3.3500],[39.9900,-3.3450],[40.0050,-3.3380],[40.0200,-3.3300],[40.0350,-3.3200],[40.0450,-3.3100],[40.0500,-3.2980],[40.0550,-3.2850],[40.0600,-3.2700],[40.0580,-3.2550],[40.0500,-3.2400],[40.0400,-3.2280],[40.0250,-3.2180],[40.0080,-3.2100],[39.9900,-3.2050],[39.9720,-3.2020],[39.9550,-3.2000],[39.9400,-3.2010],[39.9280,-3.2040],[39.9180,-3.2100],[39.9100,-3.2200],[39.9050,-3.2320],[39.9030,-3.2460],[39.9040,-3.2620],[39.9080,-3.2780],[39.9140,-3.2920],[39.9220,-3.3060],[39.9320,-3.3200],[39.9440,-3.3320],[39.9580,-3.3430],[39.9750,-3.3500]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Watamu Marine National Park', 'zone_type', 'no_take', 'area_km2', 142.8, 'num_boundary_points', 31),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.9750,-3.3500],[39.9900,-3.3450],[40.0050,-3.3380],[40.0200,-3.3300],[40.0350,-3.3200],[40.0450,-3.3100],[40.0500,-3.2980],[40.0550,-3.2850],[40.0600,-3.2700],[40.0580,-3.2550],[40.0500,-3.2400],[40.0400,-3.2280],[40.0250,-3.2180],[40.0080,-3.2100],[39.9900,-3.2050],[39.9720,-3.2020],[39.9550,-3.2000],[39.9400,-3.2010],[39.9280,-3.2040],[39.9180,-3.2100],[39.9100,-3.2200],[39.9050,-3.2320],[39.9030,-3.2460],[39.9040,-3.2620],[39.9080,-3.2780],[39.9140,-3.2920],[39.9220,-3.3060],[39.9320,-3.3200],[39.9440,-3.3320],[39.9580,-3.3430],[39.9750,-3.3500]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Malindi Marine National Park
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '443ae7f5-7d71-4a6c-b969-c32a8166093c',
  'Malindi Marine National Park',
  'no_take',
  'National Park — Strict Protection',
  231.0,
  ARRAY['Research', 'Guided diving', 'Snorkeling (designated areas)'],
  ARRAY['No fishing', 'No coral collection', 'No disturbance of marine life'],
  'active',
  'open',
  ARRAY['KWS entry permit', 'Research permit (if applicable)'],
  '1968-01-01',
  'Kenya Wildlife Service (KWS)',
  compute_polygon_centroid('[[[40.1000,-3.1900],[40.1200,-3.1800],[40.1400,-3.1650],[40.1580,-3.1480],[40.1720,-3.1300],[40.1830,-3.1100],[40.1900,-3.0880],[40.1930,-3.0650],[40.1900,-3.0420],[40.1830,-3.0200],[40.1720,-3.0000],[40.1580,-2.9830],[40.1400,-2.9700],[40.1180,-2.9600],[40.0950,-2.9550],[40.0720,-2.9530],[40.0500,-2.9550],[40.0320,-2.9620],[40.0180,-2.9730],[40.0080,-2.9880],[40.0020,-3.0060],[40.0000,-3.0250],[40.0020,-3.0440],[40.0080,-3.0620],[40.0160,-3.0800],[40.0280,-3.0980],[40.0420,-3.1140],[40.0580,-3.1300],[40.0760,-3.1460],[40.0940,-3.1620],[40.1000,-3.1900]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Malindi Marine National Park', 'zone_type', 'no_take', 'area_km2', 231.0, 'num_boundary_points', 31),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[40.1000,-3.1900],[40.1200,-3.1800],[40.1400,-3.1650],[40.1580,-3.1480],[40.1720,-3.1300],[40.1830,-3.1100],[40.1900,-3.0880],[40.1930,-3.0650],[40.1900,-3.0420],[40.1830,-3.0200],[40.1720,-3.0000],[40.1580,-2.9830],[40.1400,-2.9700],[40.1180,-2.9600],[40.0950,-2.9550],[40.0720,-2.9530],[40.0500,-2.9550],[40.0320,-2.9620],[40.0180,-2.9730],[40.0080,-2.9880],[40.0020,-3.0060],[40.0000,-3.0250],[40.0020,-3.0440],[40.0080,-3.0620],[40.0160,-3.0800],[40.0280,-3.0980],[40.0420,-3.1140],[40.0580,-3.1300],[40.0760,-3.1460],[40.0940,-3.1620],[40.1000,-3.1900]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Watamu Marine Reserve
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  'd62e0ce6-1662-4d01-b20c-b9ee8aca2bc2',
  'Watamu Marine Reserve',
  'restricted_use',
  'Marine Reserve — Controlled Use',
  176.0,
  ARRAY['Spearfishing (with permit)', 'Recreational fishing (with license)', 'Diving', 'Boating'],
  ARRAY['No bottom trawling', 'No cyanide fishing', 'No anchoring on coral'],
  'active',
  'open',
  ARRAY['KWS permit', 'County fishing license'],
  '1968-01-01',
  'Kenya Wildlife Service (KWS)',
  compute_polygon_centroid('[[[39.8800,-3.3550],[39.8950,-3.3480],[39.9100,-3.3400],[39.9250,-3.3300],[39.9380,-3.3180],[39.9480,-3.3050],[39.9560,-3.2900],[39.9620,-3.2740],[39.9650,-3.2570],[39.9640,-3.2400],[39.9600,-3.2240],[39.9520,-3.2100],[39.9420,-3.1980],[39.9300,-3.1880],[39.9150,-3.1800],[39.8980,-3.1750],[39.8800,-3.1730],[39.8630,-3.1750],[39.8480,-3.1800],[39.8360,-3.1880],[39.8270,-3.1990],[39.8210,-3.2120],[39.8180,-3.2270],[39.8190,-3.2430],[39.8230,-3.2590],[39.8300,-3.2740],[39.8400,-3.2880],[39.8520,-3.3020],[39.8660,-3.3160],[39.8800,-3.3550]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Watamu Marine Reserve', 'zone_type', 'restricted_use', 'area_km2', 176.0, 'num_boundary_points', 30),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.8800,-3.3550],[39.8950,-3.3480],[39.9100,-3.3400],[39.9250,-3.3300],[39.9380,-3.3180],[39.9480,-3.3050],[39.9560,-3.2900],[39.9620,-3.2740],[39.9650,-3.2570],[39.9640,-3.2400],[39.9600,-3.2240],[39.9520,-3.2100],[39.9420,-3.1980],[39.9300,-3.1880],[39.9150,-3.1800],[39.8980,-3.1750],[39.8800,-3.1730],[39.8630,-3.1750],[39.8480,-3.1800],[39.8360,-3.1880],[39.8270,-3.1990],[39.8210,-3.2120],[39.8180,-3.2270],[39.8190,-3.2430],[39.8230,-3.2590],[39.8300,-3.2740],[39.8400,-3.2880],[39.8520,-3.3020],[39.8660,-3.3160],[39.8800,-3.3550]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Malindi Marine Reserve
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '315e6a98-d8cc-4e9d-af1a-68ae6f62cf93',
  'Malindi Marine Reserve',
  'restricted_use',
  'Marine Reserve — Controlled Use',
  66.4,
  ARRAY['Artisanal fishing (outside closure season)', 'Recreational diving', 'Boating'],
  ARRAY['No fishing during spawning season (March-May)', 'No destructive gear', 'No coral damage'],
  'active',
  'seasonal_closure',
  ARRAY['KWS permit', 'County fishing license'],
  '1968-01-01',
  'Kenya Wildlife Service (KWS)',
  compute_polygon_centroid('[[[40.0200,-3.2050],[40.0350,-3.1950],[40.0500,-3.1830],[40.0630,-3.1700],[40.0730,-3.1550],[40.0800,-3.1380],[40.0830,-3.1200],[40.0820,-3.1020],[40.0780,-3.0850],[40.0700,-3.0700],[40.0600,-3.0570],[40.0470,-3.0470],[40.0320,-3.0400],[40.0150,-3.0360],[39.9980,-3.0350],[39.9820,-3.0380],[39.9680,-3.0440],[39.9570,-3.0530],[39.9490,-3.0650],[39.9440,-3.0800],[39.9420,-3.0960],[39.9430,-3.1120],[39.9470,-3.1280],[39.9540,-3.1440],[39.9630,-3.1580],[39.9750,-3.1720],[39.9890,-3.1840],[40.0040,-3.1950],[40.0200,-3.2050]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Malindi Marine Reserve', 'zone_type', 'restricted_use', 'area_km2', 66.4, 'num_boundary_points', 29),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[40.0200,-3.2050],[40.0350,-3.1950],[40.0500,-3.1830],[40.0630,-3.1700],[40.0730,-3.1550],[40.0800,-3.1380],[40.0830,-3.1200],[40.0820,-3.1020],[40.0780,-3.0850],[40.0700,-3.0700],[40.0600,-3.0570],[40.0470,-3.0470],[40.0320,-3.0400],[40.0150,-3.0360],[39.9980,-3.0350],[39.9820,-3.0380],[39.9680,-3.0440],[39.9570,-3.0530],[39.9490,-3.0650],[39.9440,-3.0800],[39.9420,-3.0960],[39.9430,-3.1120],[39.9470,-3.1280],[39.9540,-3.1440],[39.9630,-3.1580],[39.9750,-3.1720],[39.9890,-3.1840],[40.0040,-3.1950],[40.0200,-3.2050]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Mida Creek Conservation Zone
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '1ba7f629-fdca-48bc-9ccb-0f593ca4508c',
  'Mida Creek Conservation Zone',
  'mangrove_reserve',
  'Mangrove Ecosystem Conservation Area',
  32.5,
  ARRAY['Mangrove research', 'Eco-tourism', 'Traditional crab collection (regulated)'],
  ARRAY['No mangrove cutting', 'No mangrove charcoal production', 'No illegal logging'],
  'active',
  'open',
  ARRAY['KFS permit', 'County conservation permit'],
  '1995-06-15',
  'Kenya Forest Service (KFS) / KWS',
  compute_polygon_centroid('[[[39.8200,-3.2800],[39.8320,-3.2700],[39.8460,-3.2620],[39.8600,-3.2560],[39.8740,-3.2520],[39.8880,-3.2500],[39.9020,-3.2500],[39.9150,-3.2520],[39.9260,-3.2560],[39.9350,-3.2620],[39.9420,-3.2700],[39.9460,-3.2800],[39.9480,-3.2920],[39.9470,-3.3040],[39.9430,-3.3160],[39.9360,-3.3260],[39.9270,-3.3340],[39.9150,-3.3400],[39.9010,-3.3440],[39.8860,-3.3460],[39.8700,-3.3460],[39.8550,-3.3440],[39.8400,-3.3400],[39.8280,-3.3340],[39.8180,-3.3260],[39.8110,-3.3160],[39.8070,-3.3040],[39.8060,-3.2920],[39.8080,-3.2800],[39.8200,-3.2800]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Mida Creek Conservation Zone', 'zone_type', 'mangrove_reserve', 'area_km2', 32.5, 'num_boundary_points', 30),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.8200,-3.2800],[39.8320,-3.2700],[39.8460,-3.2620],[39.8600,-3.2560],[39.8740,-3.2520],[39.8880,-3.2500],[39.9020,-3.2500],[39.9150,-3.2520],[39.9260,-3.2560],[39.9350,-3.2620],[39.9420,-3.2700],[39.9460,-3.2800],[39.9480,-3.2920],[39.9470,-3.3040],[39.9430,-3.3160],[39.9360,-3.3260],[39.9270,-3.3340],[39.9150,-3.3400],[39.9010,-3.3440],[39.8860,-3.3460],[39.8700,-3.3460],[39.8550,-3.3440],[39.8400,-3.3400],[39.8280,-3.3340],[39.8180,-3.3260],[39.8110,-3.3160],[39.8070,-3.3040],[39.8060,-3.2920],[39.8080,-3.2800],[39.8200,-3.2800]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Chale Island Marine Zone
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '17708703-c47b-46f7-b99d-6d3e4650d4bb',
  'Chale Island Marine Zone',
  'artisanal_fishing',
  'Community-Managed Artisanal Fishing Area',
  48.2,
  ARRAY['Artisanal fishing', 'Small-scale net fishing', 'Hook and line fishing', 'Traditional canoe fishing'],
  ARRAY['No motorized trawlers', 'No beach seines', 'No explosives', 'No cyanide'],
  'active',
  'open',
  ARRAY['County fishing license', 'BMU membership card'],
  '2010-03-01',
  'County Government of Kilifi / Chale BMU',
  compute_polygon_centroid('[[[39.5200,-4.4200],[39.5400,-4.4150],[39.5600,-4.4080],[39.5780,-4.3990],[39.5920,-4.3880],[39.6020,-4.3750],[39.6080,-4.3600],[39.6100,-4.3440],[39.6080,-4.3280],[39.6020,-4.3130],[39.5930,-4.3000],[39.5810,-4.2890],[39.5660,-4.2810],[39.5490,-4.2760],[39.5310,-4.2740],[39.5140,-4.2760],[39.4980,-4.2810],[39.4850,-4.2890],[39.4750,-4.3000],[39.4680,-4.3130],[39.4640,-4.3280],[39.4630,-4.3440],[39.4650,-4.3600],[39.4700,-4.3750],[39.4780,-4.3880],[39.4890,-4.3990],[39.5030,-4.4080],[39.5200,-4.4200]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Chale Island Marine Zone', 'zone_type', 'artisanal_fishing', 'area_km2', 48.2, 'num_boundary_points', 28),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.5200,-4.4200],[39.5400,-4.4150],[39.5600,-4.4080],[39.5780,-4.3990],[39.5920,-4.3880],[39.6020,-4.3750],[39.6080,-4.3600],[39.6100,-4.3440],[39.6080,-4.3280],[39.6020,-4.3130],[39.5930,-4.3000],[39.5810,-4.2890],[39.5660,-4.2810],[39.5490,-4.2760],[39.5310,-4.2740],[39.5140,-4.2760],[39.4980,-4.2810],[39.4850,-4.2890],[39.4750,-4.3000],[39.4680,-4.3130],[39.4640,-4.3280],[39.4630,-4.3440],[39.4650,-4.3600],[39.4700,-4.3750],[39.4780,-4.3880],[39.4890,-4.3990],[39.5030,-4.4080],[39.5200,-4.4200]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Kilifi Creek Fishing Zone
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '82a0f6e8-633f-42e8-bddd-d76e9f479135',
  'Kilifi Creek Fishing Zone',
  'artisanal_fishing',
  'Community Artisanal Fishing Area',
  28.6,
  ARRAY['Artisanal fishing', 'Net fishing (small mesh)', 'Trap fishing', 'Crab collection'],
  ARRAY['No commercial trawling', 'No explosives', 'No poison fishing'],
  'active',
  'open',
  ARRAY['County fishing license', 'BMU registration'],
  '2008-07-10',
  'County Government of Kilifi / Kilifi BMU',
  compute_polygon_centroid('[[[39.8450,-3.6350],[39.8580,-3.6280],[39.8720,-3.6200],[39.8850,-3.6100],[39.8960,-3.5980],[39.9040,-3.5850],[39.9090,-3.5700],[39.9110,-3.5540],[39.9090,-3.5380],[39.9040,-3.5230],[39.8960,-3.5100],[39.8850,-3.4980],[39.8720,-3.4880],[39.8570,-3.4810],[39.8410,-3.4770],[39.8240,-3.4760],[39.8080,-3.4780],[39.7940,-3.4830],[39.7820,-3.4910],[39.7730,-3.5010],[39.7670,-3.5140],[39.7640,-3.5280],[39.7640,-3.5430],[39.7670,-3.5580],[39.7730,-3.5720],[39.7820,-3.5850],[39.7940,-3.5970],[39.8080,-3.6080],[39.8240,-3.6180],[39.8450,-3.6350]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Kilifi Creek Fishing Zone', 'zone_type', 'artisanal_fishing', 'area_km2', 28.6, 'num_boundary_points', 30),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.8450,-3.6350],[39.8580,-3.6280],[39.8720,-3.6200],[39.8850,-3.6100],[39.8960,-3.5980],[39.9040,-3.5850],[39.9090,-3.5700],[39.9110,-3.5540],[39.9090,-3.5380],[39.9040,-3.5230],[39.8960,-3.5100],[39.8850,-3.4980],[39.8720,-3.4880],[39.8570,-3.4810],[39.8410,-3.4770],[39.8240,-3.4760],[39.8080,-3.4780],[39.7940,-3.4830],[39.7820,-3.4910],[39.7730,-3.5010],[39.7670,-3.5140],[39.7640,-3.5280],[39.7640,-3.5430],[39.7670,-3.5580],[39.7730,-3.5720],[39.7820,-3.5850],[39.7940,-3.5970],[39.8080,-3.6080],[39.8240,-3.6180],[39.8450,-3.6350]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Kamale Reef Conservation Area
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  'bcad29ae-6674-40d3-baba-3b013859b730',
  'Kamale Reef Conservation Area',
  'coral_garden',
  'Coral Reef Conservation Zone',
  18.4,
  ARRAY['Reef monitoring', 'Recreational diving', 'Underwater photography'],
  ARRAY['No coral collection', 'No anchoring on reef', 'No fishing within 50m of reef'],
  'active',
  'open',
  ARRAY['Research permit (if applicable)'],
  '2015-11-20',
  'KMFRI / County Government of Kilifi',
  compute_polygon_centroid('[[[39.7600,-3.5900],[39.7700,-3.5830],[39.7820,-3.5750],[39.7950,-3.5660],[39.8060,-3.5560],[39.8140,-3.5450],[39.8190,-3.5330],[39.8210,-3.5200],[39.8200,-3.5070],[39.8160,-3.4950],[39.8090,-3.4850],[39.7990,-3.4770],[39.7870,-3.4710],[39.7730,-3.4680],[39.7590,-3.4680],[39.7450,-3.4710],[39.7330,-3.4770],[39.7230,-3.4850],[39.7160,-3.4950],[39.7120,-3.5070],[39.7110,-3.5200],[39.7130,-3.5330],[39.7180,-3.5450],[39.7260,-3.5560],[39.7370,-3.5660],[39.7500,-3.5750],[39.7600,-3.5900]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Kamale Reef Conservation Area', 'zone_type', 'coral_garden', 'area_km2', 18.4, 'num_boundary_points', 27),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.7600,-3.5900],[39.7700,-3.5830],[39.7820,-3.5750],[39.7950,-3.5660],[39.8060,-3.5560],[39.8140,-3.5450],[39.8190,-3.5330],[39.8210,-3.5200],[39.8200,-3.5070],[39.8160,-3.4950],[39.8090,-3.4850],[39.7990,-3.4770],[39.7870,-3.4710],[39.7730,-3.4680],[39.7590,-3.4680],[39.7450,-3.4710],[39.7330,-3.4770],[39.7230,-3.4850],[39.7160,-3.4950],[39.7120,-3.5070],[39.7110,-3.5200],[39.7130,-3.5330],[39.7180,-3.5450],[39.7260,-3.5560],[39.7370,-3.5660],[39.7500,-3.5750],[39.7600,-3.5900]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Tana River Delta Wetland Zone
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  'ed78643d-1b49-4006-b718-647273059e78',
  'Tana River Delta Wetland Zone',
  'conservation',
  'Wetland Conservation Area — Ramsar Site',
  1200.0,
  ARRAY['Bird watching', 'Research', 'Controlled fishing (artisanal)'],
  ARRAY['No industrial fishing', 'No wetland drainage', 'No pollution discharge'],
  'active',
  'open',
  ARRAY['NEMA permit', 'KWS permit'],
  '2012-04-01',
  'Kenya Wildlife Service / NEMA',
  compute_polygon_centroid('[[[40.1500,-2.4500],[40.2500,-2.4200],[40.3500,-2.4000],[40.4500,-2.3900],[40.5200,-2.3850],[40.5800,-2.3850],[40.6200,-2.3900],[40.6400,-2.4000],[40.6400,-2.4200],[40.6200,-2.4400],[40.5800,-2.4550],[40.5200,-2.4650],[40.4500,-2.4700],[40.3500,-2.4750],[40.2500,-2.4750],[40.1500,-2.4500]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Tana River Delta Wetland Zone', 'zone_type', 'conservation', 'area_km2', 1200.0, 'num_boundary_points', 16),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[40.1500,-2.4500],[40.2500,-2.4200],[40.3500,-2.4000],[40.4500,-2.3900],[40.5200,-2.3850],[40.5800,-2.3850],[40.6200,-2.3900],[40.6400,-2.4000],[40.6400,-2.4200],[40.6200,-2.4400],[40.5800,-2.4550],[40.5200,-2.4650],[40.4500,-2.4700],[40.3500,-2.4750],[40.2500,-2.4750],[40.1500,-2.4500]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Gede Shipwreck Marine Zone
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '39d4df6d-b96f-4d1b-a0d8-c960512b54c2',
  'Gede Shipwreck Marine Zone',
  'reef_protected',
  'Reef-Protected Wreck Site',
  12.3,
  ARRAY['Recreational diving', 'Archaeological research (permitted)'],
  ARRAY['No artifact removal', 'No anchoring', 'No trawling', 'No spearfishing near wreck'],
  'active',
  'open',
  ARRAY['NMK research permit (for diving)'],
  '2005-09-15',
  'National Museums of Kenya (NMK) / KWS',
  compute_polygon_centroid('[[[40.1200,-3.3100],[40.1300,-3.3040],[40.1420,-3.2960],[40.1540,-3.2870],[40.1640,-3.2760],[40.1720,-3.2640],[40.1770,-3.2510],[40.1790,-3.2370],[40.1780,-3.2230],[40.1740,-3.2100],[40.1670,-3.1990],[40.1580,-3.1900],[40.1470,-3.1840],[40.1340,-3.1800],[40.1200,-3.1790],[40.1060,-3.1800],[40.0930,-3.1840],[40.0820,-3.1900],[40.0730,-3.1990],[40.0670,-3.2100],[40.0630,-3.2230],[40.0620,-3.2370],[40.0640,-3.2510],[40.0690,-3.2640],[40.0770,-3.2760],[40.0870,-3.2870],[40.0990,-3.2960],[40.1200,-3.3100]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Gede Shipwreck Marine Zone', 'zone_type', 'reef_protected', 'area_km2', 12.3, 'num_boundary_points', 28),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[40.1200,-3.3100],[40.1300,-3.3040],[40.1420,-3.2960],[40.1540,-3.2870],[40.1640,-3.2760],[40.1720,-3.2640],[40.1770,-3.2510],[40.1790,-3.2370],[40.1780,-3.2230],[40.1740,-3.2100],[40.1670,-3.1990],[40.1580,-3.1900],[40.1470,-3.1840],[40.1340,-3.1800],[40.1200,-3.1790],[40.1060,-3.1800],[40.0930,-3.1840],[40.0820,-3.1900],[40.0730,-3.1990],[40.0670,-3.2100],[40.0630,-3.2230],[40.0620,-3.2370],[40.0640,-3.2510],[40.0690,-3.2640],[40.0770,-3.2760],[40.0870,-3.2870],[40.0990,-3.2960],[40.1200,-3.3100]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Malindi Port Shipping Lane
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '47b9674c-e5be-4796-aacc-ee91a273a3d3',
  'Malindi Port Shipping Lane',
  'shipping_lane',
  'Designated Maritime Shipping Corridor',
  85.0,
  ARRAY['Commercial shipping', 'Maritime navigation'],
  ARRAY['No fishing in shipping lane', 'No anchoring outside designated areas', 'No swimming'],
  'active',
  'open',
  ARRAY['Maritime navigation permit'],
  '1980-01-01',
  'Kenya Ports Authority (KPA)',
  compute_polygon_centroid('[[[40.1000,-3.2000],[40.1100,-3.1900],[40.1250,-3.1750],[40.1400,-3.1580],[40.1550,-3.1400],[40.1680,-3.1200],[40.1780,-3.1000],[40.1850,-3.0780],[40.1880,-3.0550],[40.1850,-3.0320],[40.1780,-3.0100],[40.1680,-2.9900],[40.1550,-2.9730],[40.1400,-2.9600],[40.1220,-2.9510],[40.1020,-2.9460],[40.0820,-2.9460],[40.0640,-2.9510],[40.0480,-2.9600],[40.0350,-2.9730],[40.0250,-2.9900],[40.0180,-3.0100],[40.0150,-3.0320],[40.0150,-3.0550],[40.0180,-3.0780],[40.0250,-3.1000],[40.0350,-3.1200],[40.0480,-3.1400],[40.0640,-3.1580],[40.0820,-3.1750],[40.1000,-3.2000]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Malindi Port Shipping Lane', 'zone_type', 'shipping_lane', 'area_km2', 85.0, 'num_boundary_points', 31),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[40.1000,-3.2000],[40.1100,-3.1900],[40.1250,-3.1750],[40.1400,-3.1580],[40.1550,-3.1400],[40.1680,-3.1200],[40.1780,-3.1000],[40.1850,-3.0780],[40.1880,-3.0550],[40.1850,-3.0320],[40.1780,-3.0100],[40.1680,-2.9900],[40.1550,-2.9730],[40.1400,-2.9600],[40.1220,-2.9510],[40.1020,-2.9460],[40.0820,-2.9460],[40.0640,-2.9510],[40.0480,-2.9600],[40.0350,-2.9730],[40.0250,-2.9900],[40.0180,-3.0100],[40.0150,-3.0320],[40.0150,-3.0550],[40.0180,-3.0780],[40.0250,-3.1000],[40.0350,-3.1200],[40.0480,-3.1400],[40.0640,-3.1580],[40.0820,-3.1750],[40.1000,-3.2000]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Nyali Beach Recreational Zone
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  'dfadb11e-208d-430d-997f-6269c87488f1',
  'Nyali Beach Recreational Zone',
  'recreational',
  'Coastal Recreational & Tourism Area',
  15.8,
  ARRAY['Swimming', 'Surfing', 'Beach activities', 'Kayaking', 'Recreational fishing'],
  ARRAY['No industrial fishing', 'No polluting discharge', 'No coral removal'],
  'active',
  'open',
  ARRAY['None (public access)'],
  '2018-01-15',
  'County Government of Kilifi / NEMA',
  compute_polygon_centroid('[[[39.6800,-4.0500],[39.6900,-4.0420],[39.7020,-4.0330],[39.7150,-4.0230],[39.7260,-4.0120],[39.7350,-3.9990],[39.7410,-3.9850],[39.7440,-3.9700],[39.7440,-3.9550],[39.7410,-3.9400],[39.7350,-3.9260],[39.7260,-3.9130],[39.7150,-3.9020],[39.7020,-3.8920],[39.6880,-3.8850],[39.6730,-3.8810],[39.6570,-3.8800],[39.6420,-3.8820],[39.6280,-3.8870],[39.6170,-3.8950],[39.6080,-3.9050],[39.6020,-3.9170],[39.5990,-3.9310],[39.5990,-3.9450],[39.6020,-3.9600],[39.6080,-3.9740],[39.6170,-3.9870],[39.6280,-3.9990],[39.6420,-4.0100],[39.6570,-4.0200],[39.6800,-4.0500]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Nyali Beach Recreational Zone', 'zone_type', 'recreational', 'area_km2', 15.8, 'num_boundary_points', 31),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.6800,-4.0500],[39.6900,-4.0420],[39.7020,-4.0330],[39.7150,-4.0230],[39.7260,-4.0120],[39.7350,-3.9990],[39.7410,-3.9850],[39.7440,-3.9700],[39.7440,-3.9550],[39.7410,-3.9400],[39.7350,-3.9260],[39.7260,-3.9130],[39.7150,-3.9020],[39.7020,-3.8920],[39.6880,-3.8850],[39.6730,-3.8810],[39.6570,-3.8800],[39.6420,-3.8820],[39.6280,-3.8870],[39.6170,-3.8950],[39.6080,-3.9050],[39.6020,-3.9170],[39.5990,-3.9310],[39.5990,-3.9450],[39.6020,-3.9600],[39.6080,-3.9740],[39.6170,-3.9870],[39.6280,-3.9990],[39.6420,-4.0100],[39.6570,-4.0200],[39.6800,-4.0500]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;

-- Mombasa Channel Multi-Use Zone
INSERT INTO marine_zones (id, name, zone_type, designation, area_km2, allowed_activities, restrictions, status, zone_status, licensing_requirements, established_date, managing_authority, coordinates, boundary_geojson)
VALUES (
  '44319bec-1f5c-45cc-9478-f193fdf1c3e8',
  'Mombasa Channel Multi-Use Zone',
  'multi_use',
  'Multi-Purpose Marine Zone',
  210.0,
  ARRAY['Commercial fishing (regulated)', 'Artisanal fishing', 'Tourism', 'Shipping', 'Recreational activities'],
  ARRAY['No explosives fishing', 'No pollution', 'Compliance with all sector regulations'],
  'active',
  'open',
  ARRAY['Sector-specific licenses required'],
  '2000-01-01',
  'Kenya Ports Authority / County Government of Mombasa',
  compute_polygon_centroid('[[[39.6000,-4.0500],[39.6500,-4.0200],[39.7000,-3.9900],[39.7500,-3.9600],[39.8000,-3.9350],[39.8500,-3.9150],[39.9000,-3.9000],[39.9500,-3.8900],[40.0000,-3.8850],[40.0500,-3.8850],[40.1000,-3.8900],[40.1300,-3.9000],[40.1400,-3.9150],[40.1400,-3.9350],[40.1300,-3.9550],[40.1100,-3.9750],[40.0800,-3.9950],[40.0500,-4.0150],[40.0100,-4.0350],[39.9700,-4.0500],[39.9200,-4.0600],[39.8700,-4.0650],[39.8100,-4.0680],[39.7500,-4.0680],[39.7000,-4.0650],[39.6500,-4.0580],[39.6000,-4.0500]]]'::jsonb),
  jsonb_build_object(
    'type', 'Feature',
    'properties', jsonb_build_object('name', 'Mombasa Channel Multi-Use Zone', 'zone_type', 'multi_use', 'area_km2', 210.0, 'num_boundary_points', 27),
    'geometry', jsonb_build_object('type', 'Polygon', 'coordinates', '[[[39.6000,-4.0500],[39.6500,-4.0200],[39.7000,-3.9900],[39.7500,-3.9600],[39.8000,-3.9350],[39.8500,-3.9150],[39.9000,-3.9000],[39.9500,-3.8900],[40.0000,-3.8850],[40.0500,-3.8850],[40.1000,-3.8900],[40.1300,-3.9000],[40.1400,-3.9150],[40.1400,-3.9350],[40.1300,-3.9550],[40.1100,-3.9750],[40.0800,-3.9950],[40.0500,-4.0150],[40.0100,-4.0350],[39.9700,-4.0500],[39.9200,-4.0600],[39.8700,-4.0650],[39.8100,-4.0680],[39.7500,-4.0680],[39.7000,-4.0650],[39.6500,-4.0580],[39.6000,-4.0500]]]'::jsonb)
  )
) ON CONFLICT (id) DO UPDATE SET
  boundary_geojson = EXCLUDED.boundary_geojson,
  coordinates = EXCLUDED.coordinates;
