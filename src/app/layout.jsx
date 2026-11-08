import { Inter } from 'next/font/google';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';
import { AppShell } from '@/components/layout/AppShell';
import { themeVariables } from '@/theme/theme';

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export const metadata = {
  title: 'QB Suite Admin',
  description: 'Central administration for CRM, Production and Customer.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} style={themeVariables}>
      <body className="overflow-hidden">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
