import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { ResponsiveLayout } from '@/components/responsive-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Buku Besar Gizi Rumah Sakit (NCL V3.0)',
  description: 'Buku besar pengadaan dan analitik yang tidak dapat diubah untuk tim gizi rumah sakit.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ResponsiveLayout>
            {children}
          </ResponsiveLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
