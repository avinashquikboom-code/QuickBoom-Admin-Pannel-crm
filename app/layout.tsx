import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'QuikBoom CRM - Enterprise SaaS Platform',
  description: 'Enterprise Multi-Tenant SaaS CRM Platform for QuikBoom',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-[#F8FAFC] text-[#0F172A]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
