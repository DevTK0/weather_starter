import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store';
import { Hero } from './Hero';
import { LocationsMenu } from './LocationsMenu';
import { ThemeSelector } from './ThemeSelector';
import { ListIcon } from './icons';

export function Layout() {
  const { locations, selectedId, select, isLoading } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const paneRefs = useRef<Array<HTMLElement | null>>([]);
  const isProgrammaticScroll = useRef(false);
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sharedScrollTop = useRef(0);
  const isSyncingVertical = useRef(false);

  const selectedIndex = Math.max(
    0,
    locations.findIndex((l) => l.id === selectedId),
  );

  // When selectedId changes externally (menu click), scroll into view
  useEffect(() => {
    const scroller = scrollerRef.current;
    const pane = paneRefs.current[selectedIndex];
    if (!scroller || !pane) return;
    if (Math.abs(scroller.scrollLeft - pane.offsetLeft) < 4) return;
    isProgrammaticScroll.current = true;
    scroller.scrollTo({ left: pane.offsetLeft, behavior: 'smooth' });
    // Clear the flag once the smooth scroll likely settles
    window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 500);
  }, [selectedIndex, locations.length]);

  // Mirror vertical scroll from the active pane to every other pane so swiping
  // between locations doesn't jump to a different vertical position.
  const onPaneScroll = (idx: number) => {
    if (isSyncingVertical.current) return;
    const source = paneRefs.current[idx];
    if (!source) return;
    const target = source.scrollTop;
    if (Math.abs(target - sharedScrollTop.current) < 1) return;
    sharedScrollTop.current = target;
    isSyncingVertical.current = true;
    for (let i = 0; i < paneRefs.current.length; i++) {
      if (i === idx) continue;
      const pane = paneRefs.current[i];
      if (pane && Math.abs(pane.scrollTop - target) > 1) {
        pane.scrollTop = target;
      }
    }
    requestAnimationFrame(() => {
      isSyncingVertical.current = false;
    });
  };

  // On user-driven scroll-end, sync selectedId to the visible pane
  const onScroll = () => {
    if (isProgrammaticScroll.current) return;
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const center = scroller.scrollLeft + scroller.clientWidth / 2;
      let bestIdx = 0;
      let bestDist = Infinity;
      paneRefs.current.forEach((pane, i) => {
        if (!pane) return;
        const paneCenter = pane.offsetLeft + pane.clientWidth / 2;
        const d = Math.abs(paneCenter - center);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      });
      const targetId = locations[bestIdx]?.id;
      if (targetId != null && targetId !== selectedId) select(targetId);
    }, 120);
  };

  const empty = !isLoading && locations.length === 0;

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-hidden">
      {empty ? (
        <main className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <p className="text-2xl font-light text-white/85">No locations yet</p>
            <p className="mt-2 text-sm text-white/60">
              Tap the list button below to add your first location.
            </p>
          </div>
        </main>
      ) : (
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex h-full flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {locations.map((location, i) => (
            <section
              key={location.id}
              ref={(el) => {
                paneRefs.current[i] = el;
              }}
              onScroll={() => onPaneScroll(i)}
              className="h-full w-full shrink-0 snap-center snap-always overflow-y-auto"
              aria-label={location.weather?.area ?? `Location ${i + 1}`}
            >
              <Hero location={location} isHome={i === 0} />
            </section>
          ))}
        </div>
      )}

      {/* Top dock: theme selector */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-20 flex justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="pointer-events-auto">
          <ThemeSelector />
        </div>
      </div>

      {/* Bottom dock: page dots + list button */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 sm:px-6">
        <div className="pointer-events-auto flex-1" />

        {locations.length > 1 && (
          <div className="pointer-events-auto mb-1 flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-xl">
            {locations.map((l, i) => (
              <button
                key={l.id}
                type="button"
                aria-label={`Go to ${l.weather?.area ?? `location ${i + 1}`}`}
                onClick={() => select(l.id)}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === selectedIndex ? 'bg-white' : 'bg-white/35 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}

        <div className="pointer-events-auto flex-1 flex justify-end">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open locations menu"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white shadow-lg shadow-black/30 backdrop-blur-xl hover:bg-black/45"
          >
            <ListIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <LocationsMenu
          onClose={() => setMenuOpen(false)}
          onSelect={(id) => {
            select(id);
            setMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}
