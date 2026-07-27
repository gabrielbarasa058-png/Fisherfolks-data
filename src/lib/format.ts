export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatArea(km2: number): string {
  if (km2 >= 1000) return `${(km2 / 1000).toFixed(1)}k km²`;
  return `${formatNumber(km2)} km²`;
}

export function formatDate(date: string | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export const ZONE_TYPE_COLORS: Record<string, string> = {
  commercial_fishing: '#2563eb',
  industrial: '#f59e0b',
  recreational: '#10b981',
  no_take: '#dc2626',
  restricted_use: '#8b5cf6',
  multi_use: '#06b6d4',
  conservation: '#059669',
  shipping_lane: '#6366f1',
  artisanal_fishing: '#0d9488',
  mangrove_reserve: '#16a34a',
  coral_garden: '#f43f5e',
  reef_protected: '#0891b2',
};

export const STATUS_COLORS: Record<string, string> = {
  active: '#10b981',
  under_review: '#f59e0b',
  proposed: '#06b6d4',
  deprecated: '#9ca3af',
  improving: '#10b981',
  stable: '#2563eb',
  declining: '#f59e0b',
  critical: '#dc2626',
  increasing: '#10b981',
  decreasing: '#ef4444',
  collapsing: '#7f1d1d',
  healthy: '#10b981',
  moderate: '#f59e0b',
  overfished: '#f97316',
  depleted: '#dc2626',
  collapsed: '#7f1d1d',
  recovering: '#06b6d4',
  sustainable: '#10b981',
  moderately_exploited: '#2563eb',
  fully_exploited: '#f59e0b',
  overexploited: '#f97316',
  open: '#3b82f6',
  under_investigation: '#f59e0b',
  resolved: '#10b981',
  dismissed: '#9ca3af',
  prosecuted: '#dc2626',
  low: '#10b981',
  medium: '#f59e0b',
  high: '#f97316',
  least_concern: '#10b981',
  near_threatened: '#f59e0b',
  vulnerable: '#f97316',
  endangered: '#dc2626',
  critically_endangered: '#7f1d1d',
};

export function getColor(key: string): string {
  return STATUS_COLORS[key] || '#6b7280';
}

export function getZoneColor(zoneType: string): string {
  return ZONE_TYPE_COLORS[zoneType] || '#6b7280';
}
