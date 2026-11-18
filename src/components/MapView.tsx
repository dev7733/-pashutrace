'use client';

import dynamic from 'next/dynamic';
import type { MapProps } from './MapInner';
import { cn } from '@/lib/utils';

export type { MapMarker, MapCircle, MapProps } from './MapInner';

const Inner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-surface2" style={{ minHeight: 240 }} />,
});

export function MapView({ className, height = '420px', ...props }: MapProps) {
  return (
    <div className={cn('relative isolate overflow-hidden rounded-2xl border border-line', className)} style={{ height }}>
      <Inner {...props} height="100%" />
    </div>
  );
}
