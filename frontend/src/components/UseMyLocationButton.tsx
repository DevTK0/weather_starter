import { useState } from 'react';
import { useStore } from '../state/store';
import { listForecastAreas, logInteraction } from '../api';
import type { ForecastArea } from '../api';
import { LocationIcon } from './icons';

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function findNearestArea(
  user: { latitude: number; longitude: number },
  areas: ForecastArea[],
): ForecastArea | null {
  let best: { area: ForecastArea; km: number } | null = null;
  for (const area of areas) {
    const km = haversineKm(user, area);
    if (!best || km < best.km) best = { area, km };
  }
  return best?.area ?? null;
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 60_000,
    });
  });
}

function describeGeolocationError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as GeolocationPositionError).code;
    if (code === 1) return 'Location permission denied. Allow it in your browser settings.';
    if (code === 2) return 'Could not determine your location. Try again in a moment.';
    if (code === 3) return 'Location lookup timed out. Try again.';
  }
  if (err instanceof Error) return err.message;
  return 'Could not get your location';
}

export function UseMyLocationButton() {
  const { create, locations } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    logInteraction('use_my_location_clicked');
    try {
      const [position, areas] = await Promise.all([getBrowserPosition(), listForecastAreas()]);
      if (areas.length === 0) {
        setError('No Singapore forecast areas available right now.');
        return;
      }

      const user = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      const nearest = findNearestArea(user, areas);
      if (!nearest) {
        setError('Could not find a nearby Singapore area.');
        return;
      }

      const duplicate = locations.find(
        (l) =>
          Math.abs(l.latitude - nearest.latitude) < 1e-4 &&
          Math.abs(l.longitude - nearest.longitude) < 1e-4,
      );
      if (duplicate) {
        setInfo(`${nearest.name} is already in your list.`);
        logInteraction('use_my_location_duplicate', { area: nearest.name });
        return;
      }

      logInteraction('use_my_location_resolved', {
        area: nearest.name,
        latitude: nearest.latitude,
        longitude: nearest.longitude,
      });
      await create({ latitude: nearest.latitude, longitude: nearest.longitude });
      setInfo(`Added ${nearest.name}.`);
    } catch (err) {
      const message = describeGeolocationError(err);
      setError(message);
      logInteraction('use_my_location_failed', { error: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.14] px-3 py-2.5 text-sm font-medium text-white backdrop-blur-xl hover:bg-white/[0.2] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LocationIcon className="h-4 w-4" />
        <span>{busy ? 'Finding nearest area…' : 'Use my location'}</span>
      </button>
      {error && (
        <p className="rounded-md border border-red-300/30 bg-red-500/15 px-2.5 py-1.5 text-xs text-red-100">
          {error}
        </p>
      )}
      {info && !error && (
        <p className="rounded-md border border-emerald-300/25 bg-emerald-500/15 px-2.5 py-1.5 text-xs text-emerald-50">
          {info}
        </p>
      )}
    </div>
  );
}
