import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Location } from '../types';
import { formatTemperature } from './format';

interface LocationsMapProps {
  locations: Location[];
  highlightId?: number | null;
  interactive?: boolean;
  className?: string;
  onMarkerClick?: (id: number) => void;
}

const SINGAPORE_CENTER: [number, number] = [1.3521, 103.8198];

function buildMarkerIcon(location: Location, highlighted: boolean): L.DivIcon {
  const area = location.weather?.area || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
  const temp = formatTemperature(location.weather?.temperature_c);
  const labelBg = highlighted ? '#1f6feb' : 'rgba(17, 24, 39, 0.88)';
  const labelColor = '#ffffff';
  const dotBg = highlighted ? '#1f6feb' : '#ffffff';
  const dotBorder = highlighted ? 'rgba(255,255,255,0.95)' : 'rgba(17,24,39,0.7)';

  return L.divIcon({
    className: 'weather-pin',
    html: `
      <div style="
        position:absolute;
        bottom:0;
        left:0;
        transform:translate(-50%, 0);
        display:flex;
        flex-direction:column;
        align-items:center;
        gap:3px;
        pointer-events:auto;
      ">
        <div style="
          padding:3px 8px;
          border-radius:9999px;
          background:${labelBg};
          color:${labelColor};
          font-size:11px;
          font-weight:600;
          line-height:1;
          white-space:nowrap;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
          backdrop-filter:blur(8px);
          font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        ">
          <span style="opacity:0.85;font-weight:500;">${escapeHtml(area)}</span>
          <span style="margin-left:4px;">${escapeHtml(temp)}</span>
        </div>
        <div style="
          width:10px;
          height:10px;
          border-radius:9999px;
          background:${dotBg};
          box-shadow:0 0 0 3px ${dotBorder}, 0 2px 4px rgba(0,0,0,0.5);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function escapeHtml(value: string | number): string {
  const s = String(value);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function FitToLocations({ locations }: { locations: Location[] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    if (locations.length === 1) {
      map.setView([locations[0].latitude, locations[0].longitude], 12, { animate: false });
      return;
    }
    const bounds = L.latLngBounds(locations.map((l) => [l.latitude, l.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], animate: false, maxZoom: 13 });
  }, [map, locations]);
  return null;
}

export function LocationsMap({
  locations,
  highlightId,
  interactive = false,
  className = '',
  onMarkerClick,
}: LocationsMapProps) {
  const markers = useMemo(
    () =>
      locations.map((location) => ({
        location,
        icon: buildMarkerIcon(location, location.id === highlightId),
      })),
    [locations, highlightId],
  );

  const interactionProps = interactive
    ? {}
    : {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
      };

  return (
    <MapContainer
      center={SINGAPORE_CENTER}
      zoom={11}
      className={className}
      style={{ background: '#cfe3ec' }}
      {...interactionProps}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains={['a', 'b', 'c', 'd']}
        maxZoom={20}
      />
      <FitToLocations locations={locations} />
      {markers.map(({ location, icon }) => (
        <Marker
          key={location.id}
          position={[location.latitude, location.longitude]}
          icon={icon}
          eventHandlers={
            onMarkerClick
              ? {
                  click: () => onMarkerClick(location.id),
                }
              : undefined
          }
        />
      ))}
    </MapContainer>
  );
}
