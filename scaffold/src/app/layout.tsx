import './globals.css';
import type { Metadata, Viewport } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Nandi Dictionary',
  description: 'A dictionary of the Nandi language — closed beta',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Nandi', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#7a5b2f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-ink/10 bg-paper-card/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-baseline justify-between">
            <Link href="/" className="font-medium text-lg tracking-tight">
              Nandi <span className="text-ink-muted font-normal">dictionary</span>
            </Link>
            <span className="text-xs text-ink-faint">
              Kiruogindet araap Cheison · closed beta
            </span>
          </div>
        </header>
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6">{children}</main>
   <footer className="border-t border-ink/10 mt-12">
          <div className="max-w-3xl mx-auto px-4 py-5 text-center">
            <p className="text-sm text-ink-muted leading-relaxed">
              A product of the proud sons and daughters of Nandi,<br className="sm:hidden" />
              {' '}committed to preserving our rich and enduring heritage through digitisation.
            </p>
            <p className="mt-2 text-xs text-ink-faint italic">
              Kibegunee ng&apos;woonin isoocho
            </p>
          </div>
  </footer>
      </body>
    </html>
  );
}
