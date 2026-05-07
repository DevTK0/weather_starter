import { useStore } from '../state/store';
import { LocationIcon, RefreshIcon } from './icons';
import { HourlyStrip } from './HourlyStrip';
import { TenDayForecast } from './TenDayForecast';
import { TileGrid } from './Tiles';
import { MapCard } from './MapCard';
import { formatTemperature, formatTime } from './format';
import type { Location } from '../types';

interface HeroProps {
  location: Location;
  isHome: boolean;
}

export function Hero({ location, isHome }: HeroProps) {
  const { refresh, refreshingId } = useStore();

  const area =
    location.weather?.area || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  const condition = location.weather?.condition || 'Conditions unavailable';
  const observed = formatTime(location.weather?.observed_at);
  const validPeriod = location.weather?.valid_period_text;
  const source = location.weather?.source;
  const isRefreshing = refreshingId === location.id;
  const temperature = formatTemperature(location.weather?.temperature_c);
  const high = formatTemperature(location.weather?.forecast_high_c);
  const low = formatTemperature(location.weather?.forecast_low_c);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 px-4 pb-32 pt-6 sm:px-6 lg:max-w-5xl lg:px-8">
      <header className="flex flex-col items-center pt-2 pb-2 text-center">
        {isHome && (
          <div className="mb-2 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            <LocationIcon className="h-3 w-3" />
            <span>Home</span>
          </div>
        )}
        <h1 className="text-3xl font-light leading-tight text-white sm:text-4xl">{area}</h1>
        <div className="mt-2 text-[5rem] font-extralight leading-none tracking-tight text-white sm:text-[6.5rem]">
          {temperature}
        </div>
        <div className="mt-1 text-base text-white/90 sm:text-lg">{condition}</div>
        <div className="mt-1 text-sm text-white/70 tabular-nums">
          H:{high} L:{low}
        </div>
        {observed && <div className="mt-3 text-xs text-white/55">Updated {observed}</div>}
      </header>

      {validPeriod && (
        <p className="px-2 pb-1 text-center text-xs text-white/65">{validPeriod}</p>
      )}

      <HourlyStrip periods={location.weather?.forecast_periods} />
      <TenDayForecast weather={location.weather} />
      <MapCard highlightId={location.id} />
      <TileGrid weather={location.weather} />

      <div className="mt-2 flex flex-col items-center gap-3 text-xs text-white/55">
        <button
          type="button"
          onClick={() => void refresh(location.id)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-xl hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshIcon className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
        <p>
          Weather for {area}
          {source ? ` · ${source}` : ''}
        </p>
      </div>
    </div>
  );
}
