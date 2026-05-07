import { useEffect } from 'react';
import { useStore } from '../state/store';
import { LocationsMap } from './LocationsMap';
import { CloseIcon } from './icons';

interface MapModalProps {
  onClose: () => void;
}

export function MapModal({ onClose }: MapModalProps) {
  const { locations, selectedId, select } = useStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Map"
      className="fixed inset-0 z-40 flex flex-col bg-slate-900"
    >
      <div className="absolute inset-0">
        <LocationsMap
          locations={locations}
          highlightId={selectedId}
          interactive
          className="h-full w-full"
          onMarkerClick={(id) => select(id)}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-end gap-3 p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close map"
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-slate-900/15 bg-white/95 text-slate-900 shadow-lg shadow-black/30 backdrop-blur-xl hover:bg-white"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
