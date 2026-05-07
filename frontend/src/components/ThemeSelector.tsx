import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';
import { themes } from '../theme/themes';
import { PaletteIcon } from './icons';

export function ThemeSelector() {
  const { theme, setTheme, available } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Select theme"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white shadow-lg shadow-black/30 backdrop-blur-xl hover:bg-black/45"
      >
        <PaletteIcon className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-40 w-60 rounded-2xl border border-white/15 bg-black/55 p-1.5 shadow-xl shadow-black/40 backdrop-blur-2xl"
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Theme
          </p>
          {available.map((id) => {
            const def = themes[id];
            const isActive = id === theme;
            return (
              <button
                key={id}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => {
                  setTheme(id);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                  isActive ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
              >
                <span
                  className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
                    isActive ? 'bg-white' : 'bg-white/30'
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{def.label}</span>
                  <span className="block text-[11px] leading-snug text-white/60">
                    {def.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
