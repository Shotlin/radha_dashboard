import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import { QueryProvider } from '@/lib/api/core/query-client';
import './globals.css';

/* ── Brand fonts ─────────────────────────────────────────────────────────── */

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: {
    default: 'RADHA Admin Dashboard',
    template: '%s | RADHA',
  },
  description: 'Retail Assistant for Data, Health & Audits — owner back-office.',
  robots: { index: false, follow: false }, // private back-office; never index
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FFFBF5',
};

/* ── Root layout ─────────────────────────────────────────────────────────── */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        {/* Skip-to-content for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <main id="main-content">
            <QueryProvider>{children}</QueryProvider>
          </main>
      </body>
    </html>
  );
}
