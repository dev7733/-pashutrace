import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/inter';
import '@fontsource-variable/fraunces';
import './globals.css';
import { ToastProvider } from '@/components/ui';

export const metadata: Metadata = {
  title: { default: 'PashuTrace — Smart Animal Identification & Welfare Network', template: '%s · PashuTrace' },
  description:
    'PashuTrace connects citizens, gaushalas, veterinarians and authorities to identify, trace and protect animals — cows, dogs, cats, horses and more — and to stop illegal transport, using RFID tags and injectable glass microchips, a handheld scanner and a shared case system that works even offline.',
  applicationName: 'PashuTrace',
  icons: { icon: '/icon.svg' },
  openGraph: {
    title: 'PashuTrace — Identify · Trace · Protect',
    description: 'We track animals, not only cows. One shared record for citizens, gaushalas, vets and authorities.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#e8ebde' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f0c' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem('pt-theme');if(!t){t='light'}if(t==='dark')document.documentElement.classList.add('dark')}catch(e){}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[3000] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg">
          Skip to content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
