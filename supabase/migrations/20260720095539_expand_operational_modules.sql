/*
# Expand to operational modules for Kilifi fisheries management

## Summary
Adds 10 new tables and modifies existing tables to support a full operational
fisheries management system focused on the Kilifi Old Ferry fishing hub.

## New Tables

1. **landing_sites** — Beaches and landing sites around Kilifi County
2. **fishers** — Fisher profiles with BMU membership, license info, emergency contacts
3. **boat_owners** — Owners of registered vessels
4. **crew_members** — Crew assigned to vessels
5. **fishing_licenses** — Fishing licenses for fishers and vessels
6. **catches** — Catch landing records (species, weight, gear, market value, landing site)
7. **vessel_tracks** — GPS tracking data for vessels (lat, lng, speed, heading, timestamp)
8. **geofence_alerts** — Automatic alerts when vessels enter restricted zones
9. **inspections** — Digital inspection reports for vessels and catches
10. **weather_conditions** — Weather and ocean condition records
11. **notifications** — System notifications (closed seasons, weather, illegal fishing, license renewals, regulations)
12. **habitat_health** — Habitat health indicators (coral, mangrove, seagrass) with traffic-light status
13. **restoration_projects** — Active conservation/restoration projects

## Modified Tables
- **marine_zones** — Added zone_status (open/closed/seasonal_closure), licensing_requirements, landing_site_id, boundary_geojson
- **vessels** — Added fisher_id, landing_site_id, gps_device_id

## Security
- RLS enabled on all new tables
- All tables use `TO anon, authenticated` (single-tenant, no sign-in)
- Full CRUD allowed for anon + authenticated
*/

-- ============================================================
-- 1. LANDING SITES
-- ============================================================
CREATE TABLE IF NOT EXISTS landing_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  county text DEFAULT 'Kilifi',
  beach text,
  coordinates jsonb,
  bmu text,
  landing_site_type text DEFAULT 'artisanal',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE landing_sites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_landing_sites" ON landing_sites;
CREATE POLICY "anon_select_landing_sites" ON landing_sites FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_landing_sites" ON landing_sites;
CREATE POLICY "anon_insert_landing_sites" ON landing_sites FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_landing_sites" ON landing_sites;
CREATE POLICY "anon_update_landing_sites" ON landing_sites FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_landing_sites" ON landing_sites;
CREATE POLICY "anon_delete_landing_sites" ON landing_sites FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. FISHERS
-- ============================================================
CREATE TABLE IF NOT EXISTS fishers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  national_id text,
  phone text,
  gender text,
  date_of_birth date,
  bmu text,
  bmu_role text,
  fishing_experience_years int,
  vessel_id uuid REFERENCES vessels(id) ON DELETE SET NULL,
  landing_site_id uuid REFERENCES landing_sites(id) ON DELETE SET NULL,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  photo_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fishers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_fishers" ON fishers;
CREATE POLICY "anon_select_fishers" ON fishers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fishers" ON fishers;
CREATE POLICY "anon_insert_fishers" ON fishers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fishers" ON fishers;
CREATE POLICY "anon_update_fishers" ON fishers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fishers" ON fishers;
CREATE POLICY "anon_delete_fishers" ON fishers FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. BOAT OWNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS boat_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  national_id text,
  phone text,
  address text,
  vessel_id uuid REFERENCES vessels(id) ON DELETE SET NULL,
  ownership_percentage numeric DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE boat_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_boat_owners" ON boat_owners;
CREATE POLICY "anon_select_boat_owners" ON boat_owners FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_boat_owners" ON boat_owners;
CREATE POLICY "anon_insert_boat_owners" ON boat_owners FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_boat_owners" ON boat_owners;
CREATE POLICY "anon_update_boat_owners" ON boat_owners FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_boat_owners" ON boat_owners;
CREATE POLICY "anon_delete_boat_owners" ON boat_owners FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 4. CREW MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS crew_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id uuid REFERENCES vessels(id) ON DELETE CASCADE,
  fisher_id uuid REFERENCES fishers(id) ON DELETE SET NULL,
  role text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_crew_members" ON crew_members;
CREATE POLICY "anon_select_crew_members" ON crew_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_crew_members" ON crew_members;
CREATE POLICY "anon_insert_crew_members" ON crew_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_crew_members" ON crew_members;
CREATE POLICY "anon_update_crew_members" ON crew_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_crew_members" ON crew_members;
CREATE POLICY "anon_delete_crew_members" ON crew_members FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 5. FISHING LICENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS fishing_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_number text UNIQUE NOT NULL,
  license_type text NOT NULL,
  fisher_id uuid REFERENCES fishers(id) ON DELETE SET NULL,
  vessel_id uuid REFERENCES vessels(id) ON DELETE SET NULL,
  zone_id uuid REFERENCES marine_zones(id) ON DELETE SET NULL,
  issue_date date NOT NULL,
  expiry_date date NOT NULL,
  status text DEFAULT 'active',
  fee_paid numeric DEFAULT 0,
  issued_by text,
  conditions text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fishing_licenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_fishing_licenses" ON fishing_licenses;
CREATE POLICY "anon_select_fishing_licenses" ON fishing_licenses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_fishing_licenses" ON fishing_licenses;
CREATE POLICY "anon_insert_fishing_licenses" ON fishing_licenses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_fishing_licenses" ON fishing_licenses;
CREATE POLICY "anon_update_fishing_licenses" ON fishing_licenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_fishing_licenses" ON fishing_licenses;
CREATE POLICY "anon_delete_fishing_licenses" ON fishing_licenses FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 6. CATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS catches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id uuid REFERENCES vessels(id) ON DELETE SET NULL,
  fisher_id uuid REFERENCES fishers(id) ON DELETE SET NULL,
  landing_site_id uuid REFERENCES landing_sites(id) ON DELETE SET NULL,
  species_id uuid REFERENCES species_records(id) ON DELETE SET NULL,
  species_name text,
  weight_kg numeric NOT NULL,
  gear_used text,
  market_value_kes numeric DEFAULT 0,
  landing_date date NOT NULL,
  landing_time time,
  verified boolean DEFAULT false,
  inspection_id uuid,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE catches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_catches" ON catches;
CREATE POLICY "anon_select_catches" ON catches FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_catches" ON catches;
CREATE POLICY "anon_insert_catches" ON catches FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_catches" ON catches;
CREATE POLICY "anon_update_catches" ON catches FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_catches" ON catches;
CREATE POLICY "anon_delete_catches" ON catches FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 7. VESSEL TRACKS (GPS tracking data)
-- ============================================================
CREATE TABLE IF NOT EXISTS vessel_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id uuid REFERENCES vessels(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  speed_knots numeric,
  heading numeric,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE vessel_tracks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_vessel_tracks" ON vessel_tracks;
CREATE POLICY "anon_select_vessel_tracks" ON vessel_tracks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_vessel_tracks" ON vessel_tracks;
CREATE POLICY "anon_insert_vessel_tracks" ON vessel_tracks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_vessel_tracks" ON vessel_tracks;
CREATE POLICY "anon_update_vessel_tracks" ON vessel_tracks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_vessel_tracks" ON vessel_tracks;
CREATE POLICY "anon_delete_vessel_tracks" ON vessel_tracks FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 8. GEOFENCE ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS geofence_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vessel_id uuid REFERENCES vessels(id) ON DELETE SET NULL,
  vessel_name text,
  zone_id uuid REFERENCES marine_zones(id) ON DELETE SET NULL,
  zone_name text,
  alert_type text NOT NULL,
  severity text NOT NULL,
  latitude numeric,
  longitude numeric,
  timestamp timestamptz DEFAULT now(),
  acknowledged boolean DEFAULT false,
  acknowledged_by text,
  acknowledged_at timestamptz,
  notes text
);

ALTER TABLE geofence_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_geofence_alerts" ON geofence_alerts;
CREATE POLICY "anon_select_geofence_alerts" ON geofence_alerts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_geofence_alerts" ON geofence_alerts;
CREATE POLICY "anon_insert_geofence_alerts" ON geofence_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_geofence_alerts" ON geofence_alerts;
CREATE POLICY "anon_update_geofence_alerts" ON geofence_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_geofence_alerts" ON geofence_alerts;
CREATE POLICY "anon_delete_geofence_alerts" ON geofence_alerts FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 9. INSPECTIONS (Digital inspection reports)
-- ============================================================
CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number text UNIQUE NOT NULL,
  vessel_id uuid REFERENCES vessels(id) ON DELETE SET NULL,
  vessel_name text,
  fisher_id uuid REFERENCES fishers(id) ON DELETE SET NULL,
  inspector_name text NOT NULL,
  inspection_type text NOT NULL,
  location text,
  date date NOT NULL,
  result text NOT NULL,
  catch_verified boolean DEFAULT false,
  gear_inspected text,
  catch_weight_kg numeric,
  species_found text[],
  violations_found text[],
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_inspections" ON inspections;
CREATE POLICY "anon_select_inspections" ON inspections FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_inspections" ON inspections;
CREATE POLICY "anon_insert_inspections" ON inspections FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_inspections" ON inspections;
CREATE POLICY "anon_update_inspections" ON inspections FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_inspections" ON inspections;
CREATE POLICY "anon_delete_inspections" ON inspections FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 10. WEATHER CONDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS weather_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name text NOT NULL,
  latitude numeric,
  longitude numeric,
  wind_speed_knots numeric,
  wind_direction text,
  wave_height_m numeric,
  tide_info text,
  tide_height_m numeric,
  rainfall_forecast text,
  sea_surface_temp_c numeric,
  visibility_km numeric,
  weather_alert text,
  recorded_at timestamptz DEFAULT now()
);

ALTER TABLE weather_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_weather" ON weather_conditions;
CREATE POLICY "anon_select_weather" ON weather_conditions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_weather" ON weather_conditions;
CREATE POLICY "anon_insert_weather" ON weather_conditions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_weather" ON weather_conditions;
CREATE POLICY "anon_update_weather" ON weather_conditions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_weather" ON weather_conditions;
CREATE POLICY "anon_delete_weather" ON weather_conditions FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 11. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  notification_type text NOT NULL,
  priority text DEFAULT 'medium',
  target_audience text DEFAULT 'all',
  delivery_channels text[] DEFAULT ARRAY['in_app'],
  sent_at timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  created_by text
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 12. HABITAT HEALTH
-- ============================================================
CREATE TABLE IF NOT EXISTS habitat_health (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habitat_type text NOT NULL,
  location_name text NOT NULL,
  health_status text NOT NULL,
  health_score numeric,
  coverage_km2 numeric,
  trend text,
  last_assessed date,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE habitat_health ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_habitat_health" ON habitat_health;
CREATE POLICY "anon_select_habitat_health" ON habitat_health FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_habitat_health" ON habitat_health;
CREATE POLICY "anon_insert_habitat_health" ON habitat_health FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_habitat_health" ON habitat_health;
CREATE POLICY "anon_update_habitat_health" ON habitat_health FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_habitat_health" ON habitat_health;
CREATE POLICY "anon_delete_habitat_health" ON habitat_health FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 13. RESTORATION PROJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS restoration_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_name text NOT NULL,
  project_type text NOT NULL,
  location_name text,
  zone_id uuid REFERENCES marine_zones(id) ON DELETE SET NULL,
  conservation_area_id uuid REFERENCES conservation_areas(id) ON DELETE SET NULL,
  start_date date,
  end_date date,
  status text DEFAULT 'active',
  progress_percentage numeric DEFAULT 0,
  lead_organization text,
  budget_kes numeric,
  area_km2 numeric,
  objectives text,
  outcomes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE restoration_projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_restoration" ON restoration_projects;
CREATE POLICY "anon_select_restoration" ON restoration_projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_restoration" ON restoration_projects;
CREATE POLICY "anon_insert_restoration" ON restoration_projects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_restoration" ON restoration_projects;
CREATE POLICY "anon_update_restoration" ON restoration_projects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_restoration" ON restoration_projects;
CREATE POLICY "anon_delete_restoration" ON restoration_projects FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- MODIFY EXISTING TABLES
-- ============================================================

-- Add columns to marine_zones
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marine_zones' AND column_name = 'zone_status') THEN
    ALTER TABLE marine_zones ADD COLUMN zone_status text DEFAULT 'open';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marine_zones' AND column_name = 'licensing_requirements') THEN
    ALTER TABLE marine_zones ADD COLUMN licensing_requirements text[];
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marine_zones' AND column_name = 'landing_site_id') THEN
    ALTER TABLE marine_zones ADD COLUMN landing_site_id uuid REFERENCES landing_sites(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marine_zones' AND column_name = 'boundary_geojson') THEN
    ALTER TABLE marine_zones ADD COLUMN boundary_geojson jsonb;
  END IF;
END $$;

-- Add columns to vessels
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vessels' AND column_name = 'gps_device_id') THEN
    ALTER TABLE vessels ADD COLUMN gps_device_id text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vessels' AND column_name = 'fisher_id') THEN
    ALTER TABLE vessels ADD COLUMN fisher_id uuid REFERENCES fishers(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vessels' AND column_name = 'landing_site_id') THEN
    ALTER TABLE vessels ADD COLUMN landing_site_id uuid REFERENCES landing_sites(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add zone_status check constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'marine_zones_zone_status_check') THEN
    ALTER TABLE marine_zones ADD CONSTRAINT marine_zones_zone_status_check
      CHECK (zone_status IN ('open', 'closed', 'seasonal_closure', 'under_review'));
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_catches_landing_date ON catches(landing_date);
CREATE INDEX IF NOT EXISTS idx_catches_vessel_id ON catches(vessel_id);
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_vessel_id ON vessel_tracks(vessel_id);
CREATE INDEX IF NOT EXISTS idx_vessel_tracks_timestamp ON vessel_tracks(timestamp);
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_timestamp ON geofence_alerts(timestamp);
CREATE INDEX IF NOT EXISTS idx_geofence_alerts_acknowledged ON geofence_alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(date);
CREATE INDEX IF NOT EXISTS idx_fishing_licenses_status ON fishing_licenses(status);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
