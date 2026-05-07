import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../state/store';
import { SidebarCard } from './SidebarCard';
import { AddLocationForm } from './AddLocationForm';
import { UseMyLocationButton } from './UseMyLocationButton';
import { CloseIcon, SearchIcon } from './icons';

interface LocationsMenuProps {
  onClose: () => void;
  onSelect: (id: number) => void;
}

export function LocationsMenu({ onClose, onSelect }: LocationsMenuProps) {
  const { locations, isLoading } = useStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((location) => {
      const area = location.weather.area?.toLowerCase() ?? '';
      const condition = location.weather.condition?.toLowerCase() ?? '';
      return area.includes(q) || condition.includes(q);
    });
  }, [locations, query]);

  return (
    <div className="fixed inset-0 z-30 flex justify-end">
      <button
        type="button"
        aria-label="Close locations menu"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Locations"
        className="relative ml-auto flex h-full w-full max-w-md flex-col gap-3 border-l border-white/10 bg-black/40 p-4 shadow-2xl backdrop-blur-2xl"
      >
        <div className="flex items-center justify-between gap-3 pt-1">
          <h2 className="text-lg font-semibold text-white">Locations</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] text-white/85 hover:bg-white/[0.15]"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full rounded-lg border border-white/10 bg-white/[0.08] py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/50"
          />
        </div>

        <UseMyLocationButton />
        <AddLocationForm />

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {isLoading && locations.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white/70">
              Loading locations…
            </p>
          ) : filtered.length === 0 && locations.length > 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-center text-sm text-white/60">
              No matches
            </p>
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/15 bg-white/[0.04] p-6 text-center text-sm text-white/60">
              No locations yet. Add one above.
            </p>
          ) : (
            filtered.map((location) => (
              <SidebarCard
                key={location.id}
                location={location}
                isHome={location.id === locations[0].id}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
