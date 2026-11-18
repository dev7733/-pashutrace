'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bluetooth, Camera, CheckCircle2, Keyboard, Radio, ScanLine, XCircle } from 'lucide-react';
import { Button, Input, Notice, Segmented } from './ui';
import type { SightingSource } from '@/lib/types';
import { useApp } from '@/lib/store';
import { primaryIdentifier } from '@/lib/selectors';

export interface ScanResult {
  value: string;
  source: SightingSource;
  device?: string;
}

const NUS_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NUS_TX = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // ESP32 → phone (notify)

/** Accepts the scanner's JSON payload, or a bare tag number / QR string. */
export function parseScannerPayload(text: string): ScanResult | null {
  const t = text.trim();
  if (!t) return null;
  if (t.startsWith('{')) {
    try {
      const j = JSON.parse(t) as { device?: string; event?: string; animal_id?: string | number };
      if (j.event === 'TAG_SCANNED' && j.animal_id !== undefined) {
        return { value: String(j.animal_id).trim(), source: 'rfid', device: j.device };
      }
    } catch {
      return null;
    }
    return null;
  }
  return { value: t, source: /^(\d{15}|[0-9a-fA-F]{24}|[0-9a-fA-F]{32})$/.test(t) ? 'rfid' : 'manual' };
}

type Mode = 'manual' | 'bluetooth' | 'camera';

/* eslint-disable @typescript-eslint/no-explicit-any */
export function ScanPanel({ onResult, initialMode = 'manual' }: { onResult: (r: ScanResult) => void; initialMode?: Mode }) {
  const { db } = useApp();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [manual, setManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  const handle = useCallback(
    (r: ScanResult) => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(60);
      onResult(r);
    },
    [onResult],
  );

  /* ---------------- Bluetooth ---------------- */
  const [btState, setBtState] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [btMsg, setBtMsg] = useState<string | null>(null);
  const [btName, setBtName] = useState<string>('');
  const deviceRef = useRef<any>(null);
  const bufRef = useRef('');
  const handleRef = useRef(handle);
  handleRef.current = handle;
  const btSupported = typeof navigator !== 'undefined' && 'bluetooth' in navigator;

  const disconnectBt = useCallback(() => {
    try {
      deviceRef.current?.gatt?.disconnect();
    } catch {
      /* ignore */
    }
    deviceRef.current = null;
    setBtState('idle');
  }, []);

  const connectBt = async () => {
    setBtMsg(null);
    setBtState('connecting');
    try {
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [{ namePrefix: 'PASHUTRACE' }],
        optionalServices: [NUS_SERVICE],
      });
      deviceRef.current = device;
      setBtName(device.name ?? 'PashuTrace scanner');
      device.addEventListener('gattserverdisconnected', () => {
        setBtState('idle');
        setBtMsg('Scanner disconnected.');
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(NUS_SERVICE);
      const tx = await service.getCharacteristic(NUS_TX);
      await tx.startNotifications();
      bufRef.current = '';
      tx.addEventListener('characteristicvaluechanged', (ev: any) => {
        const chunk = new TextDecoder().decode(ev.target.value as DataView);
        bufRef.current += chunk;
        // Messages are newline-terminated JSON; also accept a complete object without newline.
        const lines = bufRef.current.split('\n');
        bufRef.current = lines.pop() ?? '';
        const candidates = [...lines];
        const rest = bufRef.current.trim();
        if (rest.startsWith('{') && rest.endsWith('}')) {
          candidates.push(rest);
          bufRef.current = '';
        }
        for (const line of candidates) {
          const parsed = parseScannerPayload(line);
          if (parsed) handleRef.current({ ...parsed, source: 'rfid' });
        }
      });
      setBtState('connected');
    } catch (e: any) {
      setBtState('error');
      if (e?.name === 'NotFoundError') setBtMsg('No scanner selected.');
      else setBtMsg(e?.message ? `Could not connect: ${e.message}` : 'Could not connect to the scanner.');
    }
  };

  useEffect(() => () => disconnectBt(), [disconnectBt]);

  /* ---------------- Camera ---------------- */
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camState, setCamState] = useState<'idle' | 'starting' | 'live' | 'error'>('idle');
  const [camMsg, setCamMsg] = useState<string | null>(null);
  const camSupported =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamState('idle');
  }, []);

  const startCamera = async () => {
    setCamMsg(null);
    setCamState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
      streamRef.current = stream;
      const v = videoRef.current;
      if (!v) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      v.srcObject = stream;
      await v.play();
      setCamState('live');
    } catch (e: any) {
      setCamState('error');
      setCamMsg(e?.name === 'NotAllowedError' ? 'Camera permission was denied.' : 'Could not open the camera.');
    }
  };

  useEffect(() => {
    if (camState !== 'live') return;
    const Detector = (window as any).BarcodeDetector;
    const detector = new Detector({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'itf', 'codabar'] });
    let stopped = false;
    const id = window.setInterval(async () => {
      const v = videoRef.current;
      if (stopped || !v || v.readyState < 2) return;
      try {
        const codes = await detector.detect(v);
        if (codes.length && codes[0].rawValue) {
          stopped = true;
          const fmt = codes[0].format as string;
          stopCamera();
          handleRef.current({ value: String(codes[0].rawValue).trim(), source: fmt === 'qr_code' ? 'qr' : 'barcode' });
        }
      } catch {
        /* a frame failed to decode — keep scanning */
      }
    }, 350);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [camState, stopCamera]);

  useEffect(() => {
    if (mode !== 'camera') stopCamera();
  }, [mode, stopCamera]);
  useEffect(() => () => stopCamera(), [stopCamera]);

  /* ---------------- Manual ---------------- */
  const submitManual = () => {
    const parsed = parseScannerPayload(manual);
    if (!parsed) {
      setManualError('Enter a tag number, QR text, or the scanner’s JSON output.');
      return;
    }
    if (parsed.value.length > 64) {
      setManualError('That value is too long to be a tag ID.');
      return;
    }
    setManualError(null);
    handle(parsed);
    setManual('');
  };

  const withIds = db.animals.filter((a) => a.identifiers.length);
  const chipped = withIds.filter((a) => a.identifiers.some((i) => i.type === 'UHF_EPC')).slice(0, 2);
  const samples = [...withIds.filter((a) => !chipped.includes(a)).slice(0, 2), ...chipped].map((a) => ({ id: a.id, label: a.label, value: primaryIdentifier(a) }));

  return (
    <div className="space-y-4">
      <Segmented<Mode>
        value={mode}
        onChange={setMode}
        label="Scan method"
        options={[
          { value: 'manual', label: <span className="inline-flex items-center gap-1.5"><Keyboard className="h-4 w-4" />Enter ID</span> },
          { value: 'bluetooth', label: <span className="inline-flex items-center gap-1.5"><Bluetooth className="h-4 w-4" />Scanner</span> },
          { value: 'camera', label: <span className="inline-flex items-center gap-1.5"><Camera className="h-4 w-4" />Camera</span> },
        ]}
      />

      {mode === 'manual' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitManual();
                }
              }}
              placeholder="UHF chip ID, 15-digit RFID, Pashu Aadhaar or QR text"
              inputMode="text"
              aria-label="Animal identifier"
              autoComplete="off"
            />
            <Button onClick={submitManual}>
              <ScanLine className="h-4 w-4" />
              Look up
            </Button>
          </div>
          {manualError && <p className="text-xs font-medium text-danger" role="alert">{manualError}</p>}
          {samples.length > 0 && (
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted">Demo tags — tap to simulate a read</div>
              <div className="flex flex-wrap gap-1.5">
                {samples.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handle({ value: s.value, source: /^(\d{15}|[0-9a-fA-F]{24})$/.test(s.value) ? 'rfid' : 'manual' })}
                    className="rounded-full border border-line bg-surface px-3 py-1 font-mono text-xs hover:border-brand hover:text-brand"
                    title={s.label}
                  >
                    {s.value}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handle({ value: '356000999000111', source: 'rfid' })}
                  className="rounded-full border border-dashed border-line px-3 py-1 font-mono text-xs text-muted hover:border-accent hover:text-accent"
                  title="A tag number that is not in the database"
                >
                  356000999000111 (unknown)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'bluetooth' && (
        <div className="space-y-3">
          {!btSupported ? (
            <Notice tone="warn" title="Web Bluetooth is not available in this browser">
              Use Chrome or Edge (Android or desktop) over HTTPS to pair the PashuTrace handheld scanner. You can still enter the tag ID manually or use the camera.
            </Notice>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface2/60 p-3.5">
                <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-info/12 text-info">
                  {btState === 'connected' && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-info/30" aria-hidden />}
                  <Radio className="relative h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">
                    {btState === 'connected' ? `Connected · ${btName}` : btState === 'connecting' ? 'Connecting…' : 'Handheld scanner'}
                  </div>
                  <div className="text-xs text-muted">
                    {btState === 'connected' ? 'Hold the reader near the chip or tag. IDs appear here automatically.' : 'Reader advertising as “PASHUTRACE-xx” over BLE. No internet needed.'}
                  </div>
                </div>
                {btState === 'connected' ? (
                  <Button variant="secondary" size="sm" onClick={disconnectBt}>Disconnect</Button>
                ) : (
                  <Button size="sm" loading={btState === 'connecting'} onClick={connectBt}>
                    <Bluetooth className="h-4 w-4" />
                    Pair
                  </Button>
                )}
              </div>
              {btMsg && <p className="text-xs text-muted" role="status">{btMsg}</p>}
            </>
          )}
        </div>
      )}

      {mode === 'camera' && (
        <div className="space-y-3">
          {!camSupported ? (
            <Notice tone="warn" title="Camera barcode scanning is not supported here">
              This browser has no BarcodeDetector API. Use Chrome on Android, or enter the ID manually.
            </Notice>
          ) : (
            <>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
                {camState === 'live' && (
                  <div className="pointer-events-none absolute inset-8 rounded-2xl border-2 border-white/70">
                    <div className="absolute inset-x-2 top-1/2 h-0.5 animate-pulse bg-red-500/80" />
                  </div>
                )}
                {camState !== 'live' && (
                  <div className="absolute inset-0 grid place-items-center text-sm text-white/70">
                    {camState === 'starting' ? 'Starting camera…' : 'Camera is off'}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {camState === 'live' ? (
                  <Button variant="secondary" onClick={stopCamera}>Stop camera</Button>
                ) : (
                  <Button onClick={startCamera} loading={camState === 'starting'}>
                    <Camera className="h-4 w-4" />
                    Scan barcode / QR
                  </Button>
                )}
              </div>
              {camMsg && <p className="text-xs text-danger" role="alert">{camMsg}</p>}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ScanFeedback({ result, found }: { result: ScanResult | null; found: boolean }) {
  if (!result) return null;
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${found ? 'border-ok/30 bg-ok/10' : 'border-warn/30 bg-warn/10'}`}>
      {found ? <CheckCircle2 className="h-4 w-4 text-ok" /> : <XCircle className="h-4 w-4 text-warn" />}
      <span className="font-mono">{result.value}</span>
      <span className="text-muted">· {result.source.toUpperCase()}{result.device ? ` · ${result.device}` : ''}</span>
    </div>
  );
}
