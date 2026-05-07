import { useState } from 'react';
import { useStore } from '../state/store';
import { LocationsMap } from './LocationsMap';
import { MapModal } from './MapModal';

interface MapCardProps {
  highlightId: number | null;
}

function ExpandIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    </svg>
  );
}

export function MapCard({ highlightId }: MapCardProps) {
  const { locations, select } = useStore();
  const [open, setOpen] = useState(false);

  if (locations.length === 0) return null;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl">
        <header className="flex items-center justify-between px-4 pt-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          <span>Map</span>
          <span className="text-white/50">
            {locations.length} {locations.length === 1 ? 'location' : 'locations'}
          </span>
        </header>
        <div className="relative mt-2 h-44 sm:h-52">
          <LocationsMap
            locations={locations}
            highlightId={highlightId}
            interactive={false}
            className="h-full w-full"
            onMarkerClick={(id) => select(id)}
          />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open fullscreen map"
            className="absolute right-2 top-2 z-[500] flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/90 text-slate-900 shadow-md shadow-black/30 hover:bg-white"
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
        </div>
      </section>

      {open && <MapModal onClose={() => setOpen(false)} />}
    </>
  );
}
