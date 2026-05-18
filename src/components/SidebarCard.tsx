import { useState } from 'react';
import { useStore } from '../state/store';
import { CloudIcon, HomeIcon, TrashIcon } from './icons';
import { formatTemperature, formatTime } from './format';
import type { KeyboardEvent, MouseEvent } from 'react';
import type { Location } from '../types';

interface SidebarCardProps {
  location: Location;
  isHome: boolean;
  onSelect?: (id: number) => void;
}

export function SidebarCard({ location, isHome, onSelect: onSelectProp }: SidebarCardProps) {
  const { selectedId, select, remove } = useStore();
  const isSelected = selectedId === location.id;
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const observed = formatTime(location.weather.observed_at);
  const area =
    location.weather.area || `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
  const condition = location.weather.condition || '-';
  const temperature = formatTemperature(location.weather.temperature_c);
  const high = formatTemperature(location.weather.forecast_high_c);
  const low = formatTemperature(location.weather.forecast_low_c);

  const onSelect = () => {
    if (confirming) return;
    if (onSelectProp) onSelectProp(location.id);
    else select(location.id);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };
  const onDeleteClick = (event: MouseEvent) => {
    event.stopPropagation();
    setConfirming(true);
  };
  const onCancelDelete = (event: MouseEvent) => {
    event.stopPropagation();
    setConfirming(false);
  };
  const onConfirmDelete = async (event: MouseEvent) => {
    event.stopPropagation();
    setDeleting(true);
    try {
      await remove(location.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  };
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      aria-pressed={isSelected}
      className={`relative w-full cursor-pointer overflow-hidden rounded-2xl border text-left backdrop-blur-xl transition ${
        isSelected
          ? 'border-white/30 bg-white/20 shadow-lg shadow-black/20'
          : 'border-white/10 bg-white/[0.07] hover:bg-white/[0.12]'
      }`}
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold leading-tight text-white">{area}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/70">
            {isHome ? (
              <>
                <span>My Location</span>
                <span className="text-white/40">·</span>
                <HomeIcon className="h-3 w-3" />
                <span>Home</span>
              </>
            ) : observed ? (
              <span>{observed}</span>
            ) : (
              <span className="text-white/50">Not refreshed</span>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="text-3xl font-light tabular-nums text-white/90">{temperature}</div>
          {!confirming && (
            <button
              type="button"
              onClick={onDeleteClick}
              aria-label={`Delete ${area}`}
              className="mt-1 flex h-7 w-7 items-center justify-center rounded-full text-white/55 hover:bg-white/10 hover:text-white"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {confirming ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2 text-xs">
          <span className="text-white/80">Delete this location?</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onCancelDelete}
              disabled={deleting}
              className="rounded-md px-2 py-1 text-xs font-medium text-white/75 hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={deleting}
              className="rounded-md bg-red-500/85 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between border-t border-white/10 px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-white/80">
            <CloudIcon className="h-4 w-4 text-white/70" />
            <span>{condition}</span>
          </div>
          <div className="text-white/60 tabular-nums">
            H:{high} L:{low}
          </div>
        </div>
      )}
    </div>
  );
}
