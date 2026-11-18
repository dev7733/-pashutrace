'use client';

import { useState } from 'react';
import { Crosshair, MapPin } from 'lucide-react';
import { Button, Notice } from './ui';
import { MapView } from './MapView';

export interface GeoValue {
  lat: number;
  lng: number;
  accuracy?: number;
  source: 'gps' | 'map';
}

export function LocationPicker({ value, onChange, height = '300px' }: { value: GeoValue | null; onChange: (v: GeoValue) => void; height?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = () => {
    setError(null);
    if (!('geolocation' in navigator)) {
      setError('This device does not support location. Tap the map to place the pin.');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: Math.round(pos.coords.accuracy), source: 'gps' });
      },
      (err) => {
        setBusy(false);
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission was denied. Tap the map to place the pin instead.'
            : err.code === err.TIMEOUT
              ? 'Could not get a GPS fix in time. Move to open sky or tap the map.'
              : 'Location is unavailable right now. Tap the map to place the pin.',
        );
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 15_000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={locate} loading={busy}>
          <Crosshair className="h-4 w-4" />
          Use my current location
        </Button>
        <span className="text-xs text-muted">or tap the map / drag the pin to the exact spot</span>
      </div>
      <MapView
        height={height}
        zoom={13}
        pin={value ? { lat: value.lat, lng: value.lng } : null}
        onPick={(lat, lng) => onChange({ lat, lng, source: 'map' })}
        ariaLabel="Pick the sighting location"
      />
      {value ? (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <MapPin className="h-4 w-4 text-brand" />
          <span className="font-mono">{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</span>
          <span>· {value.source === 'gps' ? `GPS${value.accuracy ? ` (±${value.accuracy} m)` : ''}` : 'placed on map'}</span>
        </div>
      ) : (
        <p className="text-sm text-muted">No location chosen yet.</p>
      )}
      {error && <Notice tone="warn">{error}</Notice>}
    </div>
  );
}
