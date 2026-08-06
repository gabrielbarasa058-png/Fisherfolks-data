-- Migration: Seed all tables with representative initial data
-- This migration inserts sample rows across the schema and is idempotent.

-- 1. Marine Zones
INSERT INTO marine_zones (
  id, name, zone_type, designation, area_km2, allowed_activities, restrictions,
  status, zone_status, licensing_requirements, established_date, managing_authority,
  coordinates, created_at
) VALUES (
  'f8b0b8f2-3c24-4a97-9d64-1f7b5f160a18',
  'Kilifi Bay Sustainable Fishing Zone',
  'commercial_fishing',
  'Commercial Fishing Zone',
  85.3,
  ARRAY['Line fishing', 'Gillnetting', 'Community patrols'],
  ARRAY['No industrial trawling', 'No dynamite', 'No cyanide'],
  'active',
  'open',
  ARRAY['County fishing license', 'BMU permit'],
  '2018-01-01',
  'Kilifi County Fisheries Department',
  '[{"lat":-3.625,"lng":39.855}]'::jsonb,
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  zone_type = EXCLUDED.zone_type,
  designation = EXCLUDED.designation,
  area_km2 = EXCLUDED.area_km2,
  allowed_activities = EXCLUDED.allowed_activities,
  restrictions = EXCLUDED.restrictions,
  status = EXCLUDED.status,
  zone_status = EXCLUDED.zone_status,
  licensing_requirements = EXCLUDED.licensing_requirements,
  established_date = EXCLUDED.established_date,
  managing_authority = EXCLUDED.managing_authority,
  coordinates = EXCLUDED.coordinates,
  created_at = EXCLUDED.created_at;

-- 2. Conservation Areas
INSERT INTO conservation_areas (
  id, name, type, protection_level, area_km2, established_date,
  key_species, conservation_status, management_plan, effectiveness_score, created_at
) VALUES (
  '1b9366b0-c9fd-4d76-a9ce-095a0a4f5f62',
  'Kilifi Coral Garden MPA',
  'mpa',
  'high',
  42.7,
  '2005-06-01',
  ARRAY['Humphead wrasse', 'Parrotfish', 'Sea cucumber'],
  'stable',
  'Quarterly reef health monitoring; restricted anchoring zones.',
  78,
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  protection_level = EXCLUDED.protection_level,
  area_km2 = EXCLUDED.area_km2,
  established_date = EXCLUDED.established_date,
  key_species = EXCLUDED.key_species,
  conservation_status = EXCLUDED.conservation_status,
  management_plan = EXCLUDED.management_plan,
  effectiveness_score = EXCLUDED.effectiveness_score,
  created_at = EXCLUDED.created_at;

-- 3. Species Records
INSERT INTO species_records (
  id, species_name, scientific_name, population_trend, exploitation_level,
  stock_status, catch_tonnage, max_sustainable_yield, threat_category,
  last_assessment_date, region, created_at
) VALUES (
  '4828c448-29b7-4bf2-98a9-893e8ed8d0b5',
  'Queen Snapper',
  'Etelis oculatus',
  'decreasing',
  'fully_exploited',
  'overfished',
  24.1,
  18.0,
  'vulnerable',
  '2025-11-12',
  'Kilifi',
  now()
) ON CONFLICT (id) DO UPDATE SET
  species_name = EXCLUDED.species_name,
  scientific_name = EXCLUDED.scientific_name,
  population_trend = EXCLUDED.population_trend,
  exploitation_level = EXCLUDED.exploitation_level,
  stock_status = EXCLUDED.stock_status,
  catch_tonnage = EXCLUDED.catch_tonnage,
  max_sustainable_yield = EXCLUDED.max_sustainable_yield,
  threat_category = EXCLUDED.threat_category,
  last_assessment_date = EXCLUDED.last_assessment_date,
  region = EXCLUDED.region,
  created_at = EXCLUDED.created_at;

-- 4. Vessels
INSERT INTO vessels (
  id, vessel_name, registration_id, vessel_type, flag_state,
  length_m, gross_tonnage, license_status, monitoring_system, last_inspection,
  created_at
) VALUES (
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  'MV Nyama',
  'KLF-0448',
  'gillnet',
  'Kenya',
  18.2,
  56.5,
  'active',
  'vms',
  '2026-03-18',
  now()
) ON CONFLICT (id) DO UPDATE SET
  vessel_name = EXCLUDED.vessel_name,
  registration_id = EXCLUDED.registration_id,
  vessel_type = EXCLUDED.vessel_type,
  flag_state = EXCLUDED.flag_state,
  length_m = EXCLUDED.length_m,
  gross_tonnage = EXCLUDED.gross_tonnage,
  license_status = EXCLUDED.license_status,
  monitoring_system = EXCLUDED.monitoring_system,
  last_inspection = EXCLUDED.last_inspection,
  created_at = EXCLUDED.created_at;

-- 5. Landing Sites
INSERT INTO landing_sites (
  id, name, county, beach, coordinates, bmu, landing_site_type, active, created_at
) VALUES (
  '664781f6-18f2-4d4c-a0ee-1bcf8d32dbb4',
  'Old Ferry Beach',
  'Kilifi',
  'Old Ferry',
  '[{"lat":-3.620,"lng":39.850}]'::jsonb,
  'Old Ferry BMU',
  'artisanal',
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  county = EXCLUDED.county,
  beach = EXCLUDED.beach,
  coordinates = EXCLUDED.coordinates,
  bmu = EXCLUDED.bmu,
  landing_site_type = EXCLUDED.landing_site_type,
  active = EXCLUDED.active,
  created_at = EXCLUDED.created_at;

-- 6. Fishers
INSERT INTO fishers (
  id, full_name, national_id, phone, gender, date_of_birth,
  bmu, bmu_role, fishing_experience_years, vessel_id, landing_site_id,
  emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
  photo_url, active, created_at
) VALUES (
  '8e4db3f2-d8a7-4f7b-9490-ff0785f17c35',
  'Amina Hassan',
  '27123456',
  '+254712345678',
  'female',
  '1990-08-20',
  'Old Ferry BMU',
  'chairperson',
  12,
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  '664781f6-18f2-4d4c-a0ee-1bcf8d32dbb4',
  'James Hassan',
  '+254712345679',
  'brother',
  'https://example.com/photos/amina.jpg',
  true,
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  national_id = EXCLUDED.national_id,
  phone = EXCLUDED.phone,
  gender = EXCLUDED.gender,
  date_of_birth = EXCLUDED.date_of_birth,
  bmu = EXCLUDED.bmu,
  bmu_role = EXCLUDED.bmu_role,
  fishing_experience_years = EXCLUDED.fishing_experience_years,
  vessel_id = EXCLUDED.vessel_id,
  landing_site_id = EXCLUDED.landing_site_id,
  emergency_contact_name = EXCLUDED.emergency_contact_name,
  emergency_contact_phone = EXCLUDED.emergency_contact_phone,
  emergency_contact_relation = EXCLUDED.emergency_contact_relation,
  photo_url = EXCLUDED.photo_url,
  active = EXCLUDED.active,
  created_at = EXCLUDED.created_at;

-- 7. Boat Owners
INSERT INTO boat_owners (
  id, full_name, national_id, phone, address, vessel_id,
  ownership_percentage, created_at
) VALUES (
  'c4b2c6f7-1d6f-4f03-9821-5d4f6cbb7c40',
  'Joseph Mwangi',
  '34567890',
  '+254712345680',
  'Nyali, Mombasa',
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  100,
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  national_id = EXCLUDED.national_id,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  vessel_id = EXCLUDED.vessel_id,
  ownership_percentage = EXCLUDED.ownership_percentage,
  created_at = EXCLUDED.created_at;

-- 8. Crew Members
INSERT INTO crew_members (
  id, vessel_id, fisher_id, role, created_at
) VALUES (
  'e6f7d352-2a5c-4a70-86d8-3d4a2caf4b7f',
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  '8e4db3f2-d8a7-4f7b-9490-ff0785f17c35',
  'skipper',
  now()
) ON CONFLICT (id) DO UPDATE SET
  vessel_id = EXCLUDED.vessel_id,
  fisher_id = EXCLUDED.fisher_id,
  role = EXCLUDED.role,
  created_at = EXCLUDED.created_at;

-- 9. Fishing Licenses
INSERT INTO fishing_licenses (
  id, license_number, license_type, fisher_id, vessel_id, zone_id,
  issue_date, expiry_date, status, fee_paid, issued_by, conditions, created_at
) VALUES (
  '2e2159f7-cc85-46f0-a3e9-227bb4d0c9dd',
  'KL-2026-001',
  'artisanal_fishing',
  '8e4db3f2-d8a7-4f7b-9490-ff0785f17c35',
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  'f8b0b8f2-3c24-4a97-9d64-1f7b5f160a18',
  '2026-01-01',
  '2027-01-01',
  'active',
  1200,
  'Kilifi County Fisheries Department',
  'Permit valid within Kilifi Bay sustainable zone.',
  now()
) ON CONFLICT (id) DO UPDATE SET
  license_number = EXCLUDED.license_number,
  license_type = EXCLUDED.license_type,
  fisher_id = EXCLUDED.fisher_id,
  vessel_id = EXCLUDED.vessel_id,
  zone_id = EXCLUDED.zone_id,
  issue_date = EXCLUDED.issue_date,
  expiry_date = EXCLUDED.expiry_date,
  status = EXCLUDED.status,
  fee_paid = EXCLUDED.fee_paid,
  issued_by = EXCLUDED.issued_by,
  conditions = EXCLUDED.conditions,
  created_at = EXCLUDED.created_at;

-- 10. Catches
INSERT INTO catches (
  id, vessel_id, fisher_id, landing_site_id, species_id, species_name,
  weight_kg, gear_used, market_value_kes, landing_date, landing_time,
  verified, inspection_id, notes, created_at
) VALUES (
  '74d8c2ab-d8f8-4a67-ba3f-387fb4caf23d',
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  '8e4db3f2-d8a7-4f7b-9490-ff0785f17c35',
  '664781f6-18f2-4d4c-a0ee-1bcf8d32dbb4',
  '4828c448-29b7-4bf2-98a9-893e8ed8d0b5',
  'Queen Snapper',
  820.5,
  'gillnet',
  36400,
  '2026-07-20',
  '05:30:00',
  true,
  NULL,
  'Landed catch compliant with area restrictions.',
  now()
) ON CONFLICT (id) DO UPDATE SET
  vessel_id = EXCLUDED.vessel_id,
  fisher_id = EXCLUDED.fisher_id,
  landing_site_id = EXCLUDED.landing_site_id,
  species_id = EXCLUDED.species_id,
  species_name = EXCLUDED.species_name,
  weight_kg = EXCLUDED.weight_kg,
  gear_used = EXCLUDED.gear_used,
  market_value_kes = EXCLUDED.market_value_kes,
  landing_date = EXCLUDED.landing_date,
  landing_time = EXCLUDED.landing_time,
  verified = EXCLUDED.verified,
  inspection_id = EXCLUDED.inspection_id,
  notes = EXCLUDED.notes,
  created_at = EXCLUDED.created_at;

-- 11. Vessel Tracks
INSERT INTO vessel_tracks (
  id, vessel_id, latitude, longitude, speed_knots, heading, timestamp
) VALUES (
  'c19b8333-b7b4-43aa-a2af-1e2e6fe8c0f4',
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  -3.623,
  39.852,
  7.5,
  145,
  '2026-07-20T05:45:00Z'
) ON CONFLICT (id) DO UPDATE SET
  vessel_id = EXCLUDED.vessel_id,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  speed_knots = EXCLUDED.speed_knots,
  heading = EXCLUDED.heading,
  timestamp = EXCLUDED.timestamp;

-- 12. Geofence Alerts
INSERT INTO geofence_alerts (
  id, vessel_id, vessel_name, zone_id, zone_name, alert_type,
  severity, latitude, longitude, timestamp, acknowledged, acknowledged_by,
  acknowledged_at, notes
) VALUES (
  '93e8d052-4b7a-48f9-ac15-4f9f7402d8b4',
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  'MV Nyama',
  'f8b0b8f2-3c24-4a97-9d64-1f7b5f160a18',
  'Kilifi Bay Sustainable Fishing Zone',
  'zone_entry',
  'medium',
  -3.622,
  39.853,
  '2026-07-20T06:00:00Z',
  false,
  NULL,
  NULL,
  'Automatic alert for vessel approaching boundary line.'
) ON CONFLICT (id) DO UPDATE SET
  vessel_id = EXCLUDED.vessel_id,
  vessel_name = EXCLUDED.vessel_name,
  zone_id = EXCLUDED.zone_id,
  zone_name = EXCLUDED.zone_name,
  alert_type = EXCLUDED.alert_type,
  severity = EXCLUDED.severity,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  timestamp = EXCLUDED.timestamp,
  acknowledged = EXCLUDED.acknowledged,
  acknowledged_by = EXCLUDED.acknowledged_by,
  acknowledged_at = EXCLUDED.acknowledged_at,
  notes = EXCLUDED.notes;

-- 13. Inspections
INSERT INTO inspections (
  id, inspection_number, vessel_id, vessel_name, fisher_id, inspector_name,
  inspection_type, location, date, result, catch_verified, gear_inspected,
  catch_weight_kg, species_found, violations_found, notes, created_at
) VALUES (
  'b15d5984-a11a-4f8f-a3b0-2c3c1f60f7fa',
  'INSP-2026-031',
  '7ad50244-3f2d-4f4a-ab4e-bcb037b7c5bf',
  'MV Nyama',
  '8e4db3f2-d8a7-4f7b-9490-ff0785f17c35',
  'Inspector Peter',
  'routine',
  'Kilifi Bay',
  '2026-07-21',
  'pass',
  true,
  'nets and engine room',
  820.5,
  ARRAY['Queen Snapper'],
  ARRAY['no_violation'],
  'Routine inspection completed; vessel compliant.',
  now()
) ON CONFLICT (id) DO UPDATE SET
  inspection_number = EXCLUDED.inspection_number,
  vessel_id = EXCLUDED.vessel_id,
  vessel_name = EXCLUDED.vessel_name,
  fisher_id = EXCLUDED.fisher_id,
  inspector_name = EXCLUDED.inspector_name,
  inspection_type = EXCLUDED.inspection_type,
  location = EXCLUDED.location,
  date = EXCLUDED.date,
  result = EXCLUDED.result,
  catch_verified = EXCLUDED.catch_verified,
  gear_inspected = EXCLUDED.gear_inspected,
  catch_weight_kg = EXCLUDED.catch_weight_kg,
  species_found = EXCLUDED.species_found,
  violations_found = EXCLUDED.violations_found,
  notes = EXCLUDED.notes,
  created_at = EXCLUDED.created_at;

-- 14. Weather Conditions
INSERT INTO weather_conditions (
  id, location_name, latitude, longitude, wind_speed_knots, wind_direction,
  wave_height_m, tide_info, tide_height_m, rainfall_forecast,
  sea_surface_temp_c, visibility_km, weather_alert, recorded_at
) VALUES (
  '45bfd7ca-8b2f-439d-a986-b31f8c0a17de',
  'Kilifi Coast',
  -3.625,
  39.854,
  12.4,
  'NE',
  1.2,
  'High tide',
  1.4,
  'Light rain',
  27.8,
  12.0,
  'small_craft',
  now()
) ON CONFLICT (id) DO UPDATE SET
  location_name = EXCLUDED.location_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  wind_speed_knots = EXCLUDED.wind_speed_knots,
  wind_direction = EXCLUDED.wind_direction,
  wave_height_m = EXCLUDED.wave_height_m,
  tide_info = EXCLUDED.tide_info,
  tide_height_m = EXCLUDED.tide_height_m,
  rainfall_forecast = EXCLUDED.rainfall_forecast,
  sea_surface_temp_c = EXCLUDED.sea_surface_temp_c,
  visibility_km = EXCLUDED.visibility_km,
  weather_alert = EXCLUDED.weather_alert,
  recorded_at = EXCLUDED.recorded_at;

-- 15. Notifications
INSERT INTO notifications (
  id, title, message, notification_type, priority, target_audience,
  delivery_channels, sent_at, read, created_by
) VALUES (
  '6c8b7d17-9b94-4f4f-987c-fe3f3f9f3e68',
  'Seasonal closure reminder',
  'Kilifi Bay restricted use zone closes for spawning protection on 2026-09-01.',
  'regulatory',
  'high',
  'fishers',
  ARRAY['in_app', 'sms'],
  now(),
  false,
  'Kilifi Fisheries Admin'
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  notification_type = EXCLUDED.notification_type,
  priority = EXCLUDED.priority,
  target_audience = EXCLUDED.target_audience,
  delivery_channels = EXCLUDED.delivery_channels,
  sent_at = EXCLUDED.sent_at,
  read = EXCLUDED.read,
  created_by = EXCLUDED.created_by;

-- 16. Habitat Health
INSERT INTO habitat_health (
  id, habitat_type, location_name, health_status, health_score,
  coverage_km2, trend, last_assessed, notes, created_at
) VALUES (
  'd32e3f1c-6e30-47d8-96f2-4f5b8aae5f6d',
  'seagrass',
  'Kilifi Bay',
  'fair',
  62.5,
  10.2,
  'stable',
  '2026-06-30',
  'Seagrass beds remain intact but show localized grazing pressure.',
  now()
) ON CONFLICT (id) DO UPDATE SET
  habitat_type = EXCLUDED.habitat_type,
  location_name = EXCLUDED.location_name,
  health_status = EXCLUDED.health_status,
  health_score = EXCLUDED.health_score,
  coverage_km2 = EXCLUDED.coverage_km2,
  trend = EXCLUDED.trend,
  last_assessed = EXCLUDED.last_assessed,
  notes = EXCLUDED.notes,
  created_at = EXCLUDED.created_at;

-- 17. Restoration Projects
INSERT INTO restoration_projects (
  id, project_name, project_type, location_name, zone_id,
  conservation_area_id, start_date, end_date, status, progress_percentage,
  lead_organization, budget_kes, area_km2, objectives, outcomes, created_at
) VALUES (
  '7f6c3d1b-4a63-4b0f-8feb-fbc1c6a0e66d',
  'Old Ferry Mangrove Restoration',
  'mangrove_rehabilitation',
  'Old Ferry',
  'f8b0b8f2-3c24-4a97-9d64-1f7b5f160a18',
  '1b9366b0-c9fd-4d76-a9ce-095a0a4f5f62',
  '2026-04-01',
  '2027-04-01',
  'active',
  35,
  'Kilifi County Conservation Unit',
  3500000,
  4.8,
  'Restore degraded mangrove fringes and improve juvenile fish habitat.',
  'Seedlings planted across 4.8 km2; community patrols established.',
  now()
) ON CONFLICT (id) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  project_type = EXCLUDED.project_type,
  location_name = EXCLUDED.location_name,
  zone_id = EXCLUDED.zone_id,
  conservation_area_id = EXCLUDED.conservation_area_id,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  status = EXCLUDED.status,
  progress_percentage = EXCLUDED.progress_percentage,
  lead_organization = EXCLUDED.lead_organization,
  budget_kes = EXCLUDED.budget_kes,
  area_km2 = EXCLUDED.area_km2,
  objectives = EXCLUDED.objectives,
  outcomes = EXCLUDED.outcomes,
  created_at = EXCLUDED.created_at;

-- 18. Compliance Incidents
INSERT INTO compliance_incidents (
  id, incident_type, vessel_name, zone_id, severity, date, description,
  status, penalty_amount, resolution, created_at
) VALUES (
  'a5b4c3d2-e1f0-4a7b-b8c9-0d1e2f3a4b5c',
  'zone_violation',
  'MV Nyama',
  'f8b0b8f2-3c24-4a97-9d64-1f7b5f160a18',
  'medium',
  '2026-07-22',
  'Unlicensed drift net observed inside the Kilifi Bay sustainable zone.',
  'under_investigation',
  15000,
  NULL,
  now()
) ON CONFLICT (id) DO UPDATE SET
  incident_type = EXCLUDED.incident_type,
  vessel_name = EXCLUDED.vessel_name,
  zone_id = EXCLUDED.zone_id,
  severity = EXCLUDED.severity,
  date = EXCLUDED.date,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  penalty_amount = EXCLUDED.penalty_amount,
  resolution = EXCLUDED.resolution,
  created_at = EXCLUDED.created_at;
