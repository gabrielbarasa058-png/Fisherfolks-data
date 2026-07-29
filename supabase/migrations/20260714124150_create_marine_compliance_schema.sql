/*
# Marine Regulatory Compliance Platform Schema

## Overview
Creates the database schema for a marine regulatory compliance platform focused on
marine zoning, marine conservation, and biodiversity overexploitation monitoring.
This is a single-tenant prototype (no auth) for pitching and presentations.

## New Tables

1. `marine_zones` - Designated marine zones with usage classifications
   - id, name, zone_type, designation, area_km2, allowed_activities, restrictions,
     status, established_date, managing_authority, coordinates

2. `conservation_areas` - Marine Protected Areas (MPAs) and conservation sites
   - id, name, type, protection_level, area_km2, established_date, key_species,
     conservation_status, management_plan, effectiveness_score

3. `species_records` - Monitored marine species with exploitation data
   - id, species_name, scientific_name, population_trend, exploitation_level,
     stock_status, catch_tonnage, max_sustainable_yield, threat_category,
     last_assessment_date, region

4. `compliance_incidents` - Recorded compliance violations and monitoring events
   - id, incident_type, vessel_name, zone_id, severity, date, description,
     status, penalty_amount, resolution

5. `vessels` - Registered fishing/industrial vessels for monitoring
   - id, vessel_name, registration_id, vessel_type, flag_state, length_m,
     gross_tonnage, license_status, monitoring_system, last_inspection

## Security
- RLS enabled on all tables
- All tables use TO anon, authenticated (single-tenant, no auth) since this is
  a public prototype for pitching/presentations
*/

-- Marine Zones
CREATE TABLE IF NOT EXISTS marine_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  zone_type text NOT NULL CHECK (zone_type IN ('commercial_fishing', 'industrial', 'recreational', 'no_take', 'restricted_use', 'multi_use', 'conservation', 'shipping_lane')),
  designation text NOT NULL,
  area_km2 numeric NOT NULL,
  allowed_activities text[],
  restrictions text[],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'proposed', 'deprecated')),
  established_date date,
  managing_authority text,
  coordinates jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE marine_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_marine_zones" ON marine_zones;
CREATE POLICY "anon_select_marine_zones" ON marine_zones FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_marine_zones" ON marine_zones;
CREATE POLICY "anon_insert_marine_zones" ON marine_zones FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_marine_zones" ON marine_zones;
CREATE POLICY "anon_update_marine_zones" ON marine_zones FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_marine_zones" ON marine_zones;
CREATE POLICY "anon_delete_marine_zones" ON marine_zones FOR DELETE
  TO anon, authenticated USING (true);

-- Conservation Areas (MPAs)
CREATE TABLE IF NOT EXISTS conservation_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('mpa', 'marine_reserve', 'marine_sanctuary', 'habitat_protection', 'species_reserve', ' Ramsar_site')),
  protection_level text NOT NULL CHECK (protection_level IN ('strict', 'high', 'moderate', 'light')),
  area_km2 numeric NOT NULL,
  established_date date,
  key_species text[],
  conservation_status text NOT NULL DEFAULT 'stable' CHECK (conservation_status IN ('improving', 'stable', 'declining', 'critical')),
  management_plan text,
  effectiveness_score numeric CHECK (effectiveness_score >= 0 AND effectiveness_score <= 100),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conservation_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_conservation_areas" ON conservation_areas;
CREATE POLICY "anon_select_conservation_areas" ON conservation_areas FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conservation_areas" ON conservation_areas;
CREATE POLICY "anon_insert_conservation_areas" ON conservation_areas FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_conservation_areas" ON conservation_areas;
CREATE POLICY "anon_update_conservation_areas" ON conservation_areas FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_conservation_areas" ON conservation_areas;
CREATE POLICY "anon_delete_conservation_areas" ON conservation_areas FOR DELETE
  TO anon, authenticated USING (true);

-- Species Records (Biodiversity & Overexploitation)
CREATE TABLE IF NOT EXISTS species_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_name text NOT NULL,
  scientific_name text,
  population_trend text NOT NULL CHECK (population_trend IN ('increasing', 'stable', 'decreasing', 'collapsing')),
  exploitation_level text NOT NULL CHECK (exploitation_level IN ('sustainable', 'moderately_exploited', 'fully_exploited', 'overexploited', 'depleted', 'recovering')),
  stock_status text NOT NULL CHECK (stock_status IN ('healthy', 'moderate', 'overfished', 'depleted', 'collapsed', 'recovering')),
  catch_tonnage numeric,
  max_sustainable_yield numeric,
  threat_category text NOT NULL CHECK (threat_category IN ('least_concern', 'near_threatened', 'vulnerable', 'endangered', 'critically_endangered')),
  last_assessment_date date,
  region text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE species_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_species_records" ON species_records;
CREATE POLICY "anon_select_species_records" ON species_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_species_records" ON species_records;
CREATE POLICY "anon_insert_species_records" ON species_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_species_records" ON species_records;
CREATE POLICY "anon_update_species_records" ON species_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_species_records" ON species_records;
CREATE POLICY "anon_delete_species_records" ON species_records FOR DELETE
  TO anon, authenticated USING (true);

-- Compliance Incidents
CREATE TABLE IF NOT EXISTS compliance_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type text NOT NULL CHECK (incident_type IN ('illegal_fishing', 'zone_violation', 'pollution', 'poaching', 'exceeding_quota', 'unauthorized_vessel', 'habitat_damage', 'bycatch_violation')),
  vessel_name text,
  zone_id uuid REFERENCES marine_zones(id) ON DELETE SET NULL,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  date date NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_investigation', 'resolved', 'dismissed', 'prosecuted')),
  penalty_amount numeric DEFAULT 0,
  resolution text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_compliance_incidents" ON compliance_incidents;
CREATE POLICY "anon_select_compliance_incidents" ON compliance_incidents FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_compliance_incidents" ON compliance_incidents;
CREATE POLICY "anon_insert_compliance_incidents" ON compliance_incidents FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_compliance_incidents" ON compliance_incidents;
CREATE POLICY "anon_update_compliance_incidents" ON compliance_incidents FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_compliance_incidents" ON compliance_incidents;
CREATE POLICY "anon_delete_compliance_incidents" ON compliance_incidents FOR DELETE
  TO anon, authenticated USING (true);

-- Vessels
CREATE TABLE IF NOT EXISTS vessels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_name text NOT NULL,
  registration_id text UNIQUE NOT NULL,
  vessel_type text NOT NULL CHECK (vessel_type IN ('trawler', 'longliner', 'purse_seine', 'gillnet', 'factory_ship', 'research', 'patrol', 'cargo', 'other')),
  flag_state text NOT NULL,
  length_m numeric,
  gross_tonnage numeric,
  license_status text NOT NULL DEFAULT 'active' CHECK (license_status IN ('active', 'suspended', 'revoked', 'expired', 'pending')),
  monitoring_system text NOT NULL DEFAULT 'vms' CHECK (monitoring_system IN ('vms', 'ais', 'both', 'none')),
  last_inspection date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vessels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vessels" ON vessels;
CREATE POLICY "anon_select_vessels" ON vessels FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vessels" ON vessels;
CREATE POLICY "anon_insert_vessels" ON vessels FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vessels" ON vessels;
CREATE POLICY "anon_update_vessels" ON vessels FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vessels" ON vessels;
CREATE POLICY "anon_delete_vessels" ON vessels FOR DELETE
  TO anon, authenticated USING (true);
