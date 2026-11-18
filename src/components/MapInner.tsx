'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER } from '@/lib/meta';
import { useIsDark } from './ui';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  glyph?: string;
  pulse?: boolean;
  title?: string;
  popup?: { title: string; lines?: string[]; href?: string; linkLabel?: string };
}

export interface MapCircle {
  lat: number;
  lng: number;
  radius: number;
  color?: string;
  label?: string;
}

export interface MapProps {
  markers?: MapMarker[];
  circles?: MapCircle[];
  path?: Array<[number, number]>;
  height?: string;
  center?: [number, number];
  zoom?: number;
  fit?: boolean;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  pin?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
  className?: string;
  ariaLabel?: string;
}

function pinIcon(m: MapMarker, selected: boolean) {
  const color = m.color ?? '#16a34a';
  const size = selected ? 32 : 26;
  const html = `<div class="pt-pin ${m.pulse ? 'pt-pulse' : ''}" style="background:${color};width:${size}px;height:${size}px;${selected ? 'outline:3px solid rgba(255,255,255,.9);' : ''}"><span>${m.glyph ?? ''}</span></div>`;
  return L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size + 5], popupAnchor: [0, -size - 4] });
}

function buildPopup(p: NonNullable<MapMarker['popup']>): HTMLElement {
  const root = document.createElement('div');
  const t = document.createElement('div');
  t.style.fontWeight = '600';
  t.textContent = p.title;
  root.appendChild(t);
  for (const line of p.lines ?? []) {
    const d = document.createElement('div');
    d.style.opacity = '0.75';
    d.textContent = line;
    root.appendChild(d);
  }
  if (p.href) {
    const a = document.createElement('a');
    a.href = p.href;
    a.textContent = p.linkLabel ?? 'Open →';
    a.style.cssText = 'display:inline-block;margin-top:6px;font-weight:600;color:rgb(var(--brand));text-decoration:underline;';
    root.appendChild(a);
  }
  return root;
}

export default function MapInner({
  markers = [],
  circles = [],
  path,
  height = '420px',
  center,
  zoom = 13,
  fit = true,
  selectedId,
  onSelect,
  pin,
  onPick,
  className,
  ariaLabel = 'Map',
}: MapProps) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pinRef = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick);
  const onSelectRef = useRef(onSelect);
  const fittedRef = useRef(false);
  const fitKeyRef = useRef('');
  const dark = useIsDark();

  onPickRef.current = onPick;
  onSelectRef.current = onSelect;

  // Create the map once.
  useEffect(() => {
    if (!el.current || mapRef.current) return;
    const map = L.map(el.current, {
      center: center ?? MAP_CENTER,
      zoom,
      zoomControl: true,
      attributionControl: true,
    });
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    map.on('click', (e: L.LeafletMouseEvent) => {
      onPickRef.current?.(e.latlng.lat, e.latlng.lng);
    });
    let alive = true;
    const safeResize = () => {
      if (alive && mapRef.current === map) map.invalidateSize(false);
    };
    const ro = new ResizeObserver(safeResize);
    ro.observe(el.current);
    const t = window.setTimeout(safeResize, 60);
    return () => {
      alive = false;
      window.clearTimeout(t);
      ro.disconnect();
      map.stop();
      map.off();
      map.remove();
      mapRef.current = null;
      tileRef.current = null;
      layerRef.current = null;
      pinRef.current = null;
      fittedRef.current = false;
      fitKeyRef.current = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tiles follow the theme.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    tileRef.current?.remove();
    const custom = process.env.NEXT_PUBLIC_MAP_TILE_URL;
    tileRef.current = L.tileLayer(custom || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: !custom && dark ? 'pt-tiles-dark' : '',
      attribution: custom
        ? (process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ?? '&copy; OpenStreetMap contributors')
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    tileRef.current.bringToBack();
  }, [dark]);

  // Markers, circles, path.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    for (const c of circles) {
      const color = c.color ?? '#ef4444';
      const circle = L.circle([c.lat, c.lng], { radius: c.radius, color, weight: 1.5, fillColor: color, fillOpacity: 0.16 });
      if (c.label) circle.bindTooltip(c.label);
      circle.addTo(layer);
    }
    if (path && path.length > 1) {
      L.polyline(path, { color: '#16a34a', weight: 3, opacity: 0.75, dashArray: '6 8' }).addTo(layer);
    }
    for (const m of markers) {
      const marker = L.marker([m.lat, m.lng], { icon: pinIcon(m, m.id === selectedId), title: m.title, riseOnHover: true });
      if (m.popup) marker.bindPopup(buildPopup(m.popup));
      marker.on('click', () => onSelectRef.current?.(m.id));
      marker.addTo(layer);
    }
    const pts: L.LatLngExpression[] = markers.map((m) => [m.lat, m.lng]);
    if (pin) pts.push([pin.lat, pin.lng]);
    const fitKey = pts.map((p) => (Array.isArray(p) ? p.join(',') : String(p))).join('|');
    if (fit && pts.length && fitKey !== fitKeyRef.current && !(pin && fittedRef.current)) {
      if (pts.length === 1) map.setView(pts[0]!, Math.max(zoom, 15), { animate: false });
      else map.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 16, animate: false });
      fittedRef.current = true;
      fitKeyRef.current = fitKey;
    }
  }, [markers, circles, path, selectedId, fit, zoom, pin]);

  // Draggable pin for location pickers.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!pin) {
      pinRef.current?.remove();
      pinRef.current = null;
      return;
    }
    if (!pinRef.current) {
      const marker = L.marker([pin.lat, pin.lng], {
        draggable: !!onPickRef.current,
        icon: pinIcon({ id: 'pin', lat: pin.lat, lng: pin.lng, color: '#dc2626', glyph: '●' }, true),
      }).addTo(map);
      marker.on('dragend', () => {
        const ll = marker.getLatLng();
        onPickRef.current?.(ll.lat, ll.lng);
      });
      pinRef.current = marker;
    } else {
      pinRef.current.setLatLng([pin.lat, pin.lng]);
    }
    if (!map.getBounds().contains([pin.lat, pin.lng])) map.panTo([pin.lat, pin.lng], { animate: false });
  }, [pin]);

  return (
    <div
      ref={el}
      role="region"
      aria-label={ariaLabel}
      className={className}
      style={{ height, width: '100%', borderRadius: 'inherit', zIndex: 0 }}
    />
  );
}
