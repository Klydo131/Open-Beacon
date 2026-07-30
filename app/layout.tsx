import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorker } from '@/components/ServiceWorker';
import { StoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Open Beacon | Role-based journey learning',
  description:
    'Explore a private, offline-first role-based journey using fictional sample data.',
  applicationName: 'Open Beacon',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#1d2b4f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
