import type { Metadata, Viewport } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { ServiceWorker } from '@/components/ServiceWorker';

export const metadata: Metadata = {
  title: 'Open Beacon — a role-based journey demo',
  description:
    'An open-source, offline-first demo of a role-based journey tracker. No backend, no accounts, no tracking — everything runs in your browser.',
  applicationName: 'Open Beacon',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#111827',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
