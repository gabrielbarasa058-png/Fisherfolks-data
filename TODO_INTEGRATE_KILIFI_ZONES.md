# Todo: Integrate Kilifi Marine Fishing Zone Boundaries

This plan outlines the steps required to integrate official Kilifi marine fishing zone boundaries into the Marine Zoning tab, replacing the current point-based markers with detailed polygon boundaries.

## Phase 1: Data Acquisition & Preparation
- [ ] **Research & Source Official Data**: Locate official GeoJSON or shapefiles for Kilifi County marine fishing zones (e.g., from Kenya Marine and Fisheries Research Institute - KMFRI or the Ministry of Agriculture, Livestock and Fisheries).
- [ ] **Data Cleaning**: Convert raw spatial data into a standardized GeoJSON format suitable for web integration.
- [ ] **Database Schema Update**:
    - [ ] Modify the `marine_zones` table in Supabase to include a `boundary` column (type: `JSONB` or PostGIS `geometry`).
    - [ ] Update TypeScript interfaces in `src/types/index.ts` to include the `boundary` property.

## Phase 2: Frontend Implementation
- [ ] **Update Mapping Logic in `ZoneMap.tsx`**:
    - [ ] Refactor the `useEffect` hook to handle GeoJSON polygon rendering using Leaflet's `L.geoJSON`.
    - [ ] Implement a styling function to assign distinct colors based on `zone_type` or specific zone IDs.
    - [ ] Add permanent or hover labels using `L.tooltip` for clear identification.
- [ ] **Enhance Popup Information**:
    - [ ] Update popups to show more detailed boundary-specific information (e.g., precise area, specific regulations for that polygon).
- [ ] **Refine UI/UX**:
    - [ ] Ensure the legend in `ZoningView.tsx` accurately reflects the new boundary colors.
    - [ ] Add a toggle to switch between point markers and boundary polygons if needed for performance.

## Phase 3: Testing & Validation
- [ ] **Verify Spatial Accuracy**: Cross-check the rendered boundaries against official maps to ensure correct alignment with the Kilifi coastline.
- [ ] **Performance Optimization**: Ensure the map remains responsive even with complex polygon geometries (use simplification if necessary).
- [ ] **Label Clarity**: Check that labels are readable and do not overlap excessively at different zoom levels.

## Phase 4: Finalization
- [ ] **Documentation**: Update the project README or a dedicated GIS documentation file with the data sources used.
- [ ] **Cleanup**: Remove any deprecated point-based coordinate logic if no longer needed.
