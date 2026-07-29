export interface MarineZone {
  id: string;
  name: string;
  zone_type: string;
  designation: string;
  area_km2: number;
  allowed_activities: string[];
  restrictions: string[];
  status: string;
  zone_status: string | null;
  licensing_requirements: string[] | null;
  established_date: string | null;
  managing_authority: string;
  coordinates: { lat: number; lng: number } | null;
  landing_site_id: string | null;
  boundary_geojson: unknown | null;
}

export interface ConservationArea {
  id: string;
  name: string;
  type: string;
  protection_level: string;
  area_km2: number;
  established_date: string | null;
  key_species: string[];
  conservation_status: string;
  management_plan: string | null;
  effectiveness_score: number | null;
}

export interface SpeciesRecord {
  id: string;
  species_name: string;
  scientific_name: string | null;
  population_trend: string;
  exploitation_level: string;
  stock_status: string;
  catch_tonnage: number | null;
  max_sustainable_yield: number | null;
  threat_category: string;
  last_assessment_date: string | null;
  region: string | null;
}

export interface ComplianceIncident {
  id: string;
  incident_type: string;
  vessel_name: string | null;
  zone_id: string | null;
  severity: string;
  date: string;
  description: string | null;
  status: string;
  penalty_amount: number;
  resolution: string | null;
}

export interface Vessel {
  id: string;
  vessel_name: string;
  registration_id: string;
  vessel_type: string;
  flag_state: string;
  length_m: number | null;
  gross_tonnage: number | null;
  license_status: string;
  monitoring_system: string;
  last_inspection: string | null;
  gps_device_id: string | null;
  fisher_id: string | null;
  landing_site_id: string | null;
}

export interface LandingSite {
  id: string;
  name: string;
  county: string;
  beach: string | null;
  coordinates: { lat: number; lng: number } | null;
  bmu: string | null;
  landing_site_type: string;
  active: boolean;
}

export interface Fisher {
  id: string;
  full_name: string;
  national_id: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  bmu: string | null;
  bmu_role: string | null;
  fishing_experience_years: number | null;
  vessel_id: string | null;
  landing_site_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  active: boolean;
}

export interface BoatOwner {
  id: string;
  full_name: string;
  national_id: string | null;
  phone: string | null;
  address: string | null;
  vessel_id: string | null;
  ownership_percentage: number | null;
}

export interface CrewMember {
  id: string;
  vessel_id: string;
  fisher_id: string | null;
  role: string | null;
}

export interface FishingLicense {
  id: string;
  license_number: string;
  license_type: string;
  fisher_id: string | null;
  vessel_id: string | null;
  zone_id: string | null;
  issue_date: string;
  expiry_date: string;
  status: string;
  fee_paid: number | null;
  issued_by: string | null;
  conditions: string | null;
}

export interface CatchRecord {
  id: string;
  vessel_id: string | null;
  fisher_id: string | null;
  landing_site_id: string | null;
  species_id: string | null;
  species_name: string | null;
  weight_kg: number;
  gear_used: string | null;
  market_value_kes: number | null;
  landing_date: string;
  landing_time: string | null;
  verified: boolean;
  notes: string | null;
}

export interface VesselTrack {
  id: string;
  vessel_id: string;
  latitude: number;
  longitude: number;
  speed_knots: number | null;
  heading: number | null;
  timestamp: string;
}

export interface GeofenceAlert {
  id: string;
  vessel_id: string | null;
  vessel_name: string | null;
  zone_id: string | null;
  zone_name: string | null;
  alert_type: string;
  severity: string;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  notes: string | null;
}

export interface Inspection {
  id: string;
  inspection_number: string;
  vessel_id: string | null;
  vessel_name: string | null;
  fisher_id: string | null;
  inspector_name: string;
  inspection_type: string;
  location: string | null;
  date: string;
  result: string;
  catch_verified: boolean;
  gear_inspected: string | null;
  catch_weight_kg: number | null;
  species_found: string[] | null;
  violations_found: string[] | null;
  notes: string | null;
}

export interface WeatherCondition {
  id: string;
  location_name: string;
  latitude: number | null;
  longitude: number | null;
  wind_speed_knots: number | null;
  wind_direction: string | null;
  wave_height_m: number | null;
  tide_info: string | null;
  tide_height_m: number | null;
  rainfall_forecast: string | null;
  sea_surface_temp_c: number | null;
  visibility_km: number | null;
  weather_alert: string | null;
  recorded_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  target_audience: string;
  delivery_channels: string[];
  sent_at: string;
  read: boolean;
  created_by: string | null;
}

export interface HabitatHealth {
  id: string;
  habitat_type: string;
  location_name: string;
  health_status: string;
  health_score: number | null;
  coverage_km2: number | null;
  trend: string | null;
  last_assessed: string | null;
  notes: string | null;
}

export interface RestorationProject {
  id: string;
  project_name: string;
  project_type: string;
  location_name: string | null;
  zone_id: string | null;
  conservation_area_id: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  progress_percentage: number | null;
  lead_organization: string | null;
  budget_kes: number | null;
  area_km2: number | null;
  objectives: string | null;
  outcomes: string | null;
}

export type ViewKey =
  | 'dashboard'
  | 'zoning'
  | 'compliance'
  | 'fishers'
  | 'catches'
  | 'biodiversity'
  | 'weather'
  | 'notifications'
  | 'reports'
  | 'presentation';
