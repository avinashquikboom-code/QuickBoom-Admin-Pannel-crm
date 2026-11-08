import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'QB Suite - Enterprise SaaS Platform',
  description: 'Enterprise Multi-Customer SaaS Platform for QB Suite',
  icons: {
    icon: '/app_logo.png',
    shortcut: '/app_logo.png',
    apple: '/app_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light h-full" style={{ colorScheme: 'light' }}>
      <body className="h-full bg-[#F8FAFC] text-[#0F172A] antialiased" style={{ colorScheme: 'light' }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
