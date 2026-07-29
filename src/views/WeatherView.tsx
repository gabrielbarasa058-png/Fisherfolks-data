import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { WeatherCondition } from '../types';
import { formatDate } from '../lib/format';
import {
  CloudSun, Wind, Waves, Droplets, Thermometer, Eye, AlertTriangle,
  Navigation, Clock, MapPin,
} from 'lucide-react';

export default function WeatherView() {
  const [weather, setWeather] = useState<WeatherCondition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data } = await supabase.from('weather_conditions').select('*').order('recorded_at', { ascending: false });
      setWeather(data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const alerts = weather.filter(w => w.weather_alert);

  const getWindColor = (speed: number | null) => {
    if (speed === null) return 'text-slate-600';
    if (speed < 10) return 'text-emerald-600';
    if (speed < 16) return 'text-amber-600';
    return 'text-red-600';
  };

  const getWaveColor = (height: number | null) => {
    if (height === null) return 'text-slate-600';
    if (height < 1.0) return 'text-emerald-600';
    if (height < 1.8) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Weather & Ocean Conditions</h1>
        <p className="text-sm text-slate-500">Live weather, tide, and sea conditions for Kilifi County coastal areas</p>
      </div>

      {/* Weather Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((a) => (
            <div key={a.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-900">{a.location_name} — Weather Alert</div>
                <div className="text-sm text-amber-800">{a.weather_alert}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Weather Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weather.map((w) => (
          <div key={w.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-br from-slate-800 to-cyan-900 p-5 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">{w.location_name}</span>
                </div>
                <CloudSun className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold">
                {w.sea_surface_temp_c !== null ? `${w.sea_surface_temp_c}°C` : '—'}
              </div>
              <div className="text-sm text-slate-300">Sea Surface Temperature</div>
            </div>
            <div className="p-5 space-y-3">
              <WeatherRow icon={Wind} label="Wind Speed" value={w.wind_speed_knots !== null ? `${w.wind_speed_knots} knots` : '—'} extra={w.wind_direction ? `(${w.wind_direction})` : ''} valueClass={getWindColor(w.wind_speed_knots)} />
              <WeatherRow icon={Waves} label="Wave Height" value={w.wave_height_m !== null ? `${w.wave_height_m} m` : '—'} valueClass={getWaveColor(w.wave_height_m)} />
              <WeatherRow icon={Navigation} label="Tide Info" value={w.tide_info || '—'} extra={w.tide_height_m !== null ? `${w.tide_height_m} m` : ''} />
              <WeatherRow icon={Droplets} label="Rainfall Forecast" value={w.rainfall_forecast || '—'} />
              <WeatherRow icon={Thermometer} label="Sea Surface Temp" value={w.sea_surface_temp_c !== null ? `${w.sea_surface_temp_c}°C` : '—'} />
              <WeatherRow icon={Eye} label="Visibility" value={w.visibility_km !== null ? `${w.visibility_km} km` : '—'} />
              <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Updated {formatDate(w.recorded_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Advisory */}
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-100">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-5 h-5 text-cyan-600" />
          <h2 className="font-semibold text-slate-900">Fisher Safety Advisory</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Safe to Fish</div>
            <div className="text-sm font-semibold text-emerald-600">
              {weather.filter(w => (w.wind_speed_knots || 0) < 16 && (w.wave_height_m || 0) < 1.8).length} areas
            </div>
            <div className="text-xs text-slate-400 mt-1">Wind &lt; 16 knots, waves &lt; 1.8m</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Caution Advised</div>
            <div className="text-sm font-semibold text-amber-600">
              {weather.filter(w => (w.wind_speed_knots || 0) >= 10 && (w.wind_speed_knots || 0) < 18).length} areas
            </div>
            <div className="text-xs text-slate-400 mt-1">Wind 10-18 knots</div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <div className="text-xs text-slate-500 mb-1">Unsafe Conditions</div>
            <div className="text-sm font-semibold text-red-600">
              {weather.filter(w => (w.wind_speed_knots || 0) >= 16 || (w.wave_height_m || 0) >= 1.8).length} areas
            </div>
            <div className="text-xs text-slate-400 mt-1">Wind ≥ 16 knots or waves ≥ 1.8m</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeatherRow({
  icon: Icon, label, value, extra, valueClass = '',
}: {
  icon: typeof Wind; label: string; value: string; extra?: string; valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className={`text-sm font-medium ${valueClass || 'text-slate-900'}`}>
        {value} {extra && <span className="text-slate-400 font-normal">{extra}</span>}
      </div>
    </div>
  );
}
