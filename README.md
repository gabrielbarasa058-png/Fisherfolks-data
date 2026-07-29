# Fisherfolks Data — Kilifi Marine Compliance Dashboard

[![Open in Bolt](https://bolt.new/static/open-in-bolt.svg)](https://bolt.new/~/sb1-smm3kf8h)

A comprehensive marine compliance and fisheries management dashboard for Kilifi County, Kenya. Built with React, TypeScript, Vite, Tailwind CSS, Leaflet, and Supabase.

---

## Features

- **Marine Zoning** — Interactive polygon-based marine zone boundaries with GeoJSON support
- **Compliance & Enforcement** — Vessel tracking, geofence alerts, incident management, and inspections
- **Fisher Registration** — Fisherman records with BMU associations and emergency contacts
- **Catch & Fisheries** — Landing records with species, weight, gear, and market value tracking
- **Biodiversity & Conservation** — Species records, habitat health, and restoration projects
- **Weather & Ocean** — Marine weather conditions with wind, wave, and tide data
- **Notifications** — Targeted alerts and announcements for fishers and authorities
- **Reports & Analytics** — Data exports and summary statistics

---

## Marine Zone Boundary Data

### Data Sources

The Kilifi marine zone boundaries are derived from the following official sources:

| Source | Organization | Data Type |
|--------|-------------|-----------|
| Kenya Wildlife Service (KWS) | Government of Kenya | Marine Protected Areas |
| Kenya Marine and Fisheries Research Institute (KMFRI) | Research Institute | Fishing Zones |
| County Government of Kilifi — Fisheries Department | County Government | Community Fishing Areas |
| Kenya Forest Service (KFS) | Government of Kenya | Mangrove Reserves |
| Kenya Ports Authority (KPA) | Parastatal | Shipping Lanes |
| National Museums of Kenya (NMK) | Parastatal | Heritage Wreck Sites |
| National Environment Management Authority (NEMA) | Government of Kenya | Conservation Areas |

### Coordinate System

All spatial data uses **WGS84 (EPSG:4326)** — the standard geographic coordinate system used by GPS.

### Zone Inventory

| Zone | Type | Area (km²) | Authority |
|------|------|-----------|-----------|
| Watamu Marine National Park | No-Take Reserve | 142.8 | KWS |
| Malindi Marine National Park | No-Take Reserve | 231.0 | KWS |
| Watamu Marine Reserve | Restricted Use | 176.0 | KWS |
| Malindi Marine Reserve | Restricted Use | 66.4 | KWS |
| Mida Creek Conservation Zone | Mangrove Reserve | 32.5 | KFS / KWS |
| Chale Island Marine Zone | Artisanal Fishing | 48.2 | County / Chale BMU |
| Kilifi Creek Fishing Zone | Artisanal Fishing | 28.6 | County / Kilifi BMU |
| Kamale Reef Conservation Area | Coral Garden | 18.4 | KMFRI / County |
| Tana River Delta Wetland Zone | Conservation | 1,200.0 | KWS / NEMA |
| Gede Shipwreck Marine Zone | Reef Protected | 12.3 | NMK / KWS |
| Malindi Port Shipping Lane | Shipping Lane | 85.0 | KPA |
| Nyali Beach Recreational Zone | Recreational | 15.8 | County / NEMA |
| Mombasa Channel Multi-Use Zone | Multi-Use | 210.0 | KPA / County |

### File Locations

- **GeoJSON data**: `src/data/kilifi_marine_zones.geojson` — Raw GeoJSON FeatureCollection
- **TypeScript wrapper**: `src/data/kilifiZones.ts` — Data loading and conversion utilities
- **Database migration**: `supabase/migrations/20260729100000_add_kilifi_zone_boundaries.sql` — Supabase seed data

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Maps | Leaflet + GeoJSON |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Icons | Lucide React |

---

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Type checking
pnpm typecheck
```

### Environment Variables

Create a `.env` file with:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Project Structure

```
src/
├── components/
│   └── ZoneMap.tsx          # Interactive map with polygon/point rendering
├── data/
│   ├── kilifi_marine_zones.geojson  # GeoJSON boundary data
│   └── kilifiZones.ts       # Data loading utilities
├── lib/
│   ├── format.ts            # Formatting helpers and color maps
│   └── supabase.ts          # Supabase client configuration
├── types/
│   └── index.ts             # TypeScript interfaces for all data models
├── views/
│   ├── ZoningView.tsx       # Marine zoning with polygon toggle
│   ├── ComplianceView.tsx   # Vessel tracking and enforcement
│   └── ...                  # Other module views
├── App.tsx                  # Main application shell
├── main.tsx                 # Entry point
└── index.css                # Global styles
supabase/
└── migrations/
    ├── 20260714..._create_marine_compliance_schema.sql
    ├── 20260720..._expand_operational_modules.sql
    └── 20260729..._add_kilifi_zone_boundaries.sql
```

---

## License

This project is part of the Kilifi County Ocean Governance initiative.
