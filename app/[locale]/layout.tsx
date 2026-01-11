import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Geist, Noto_Sans_SC } from 'next/font/google';
import '../globals.css';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

// Fonts
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const notoSansSC = Noto_Sans_SC({
  variable: '--font-noto-sans-sc',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: '平安签到 | Safety Check-in',
  description: '为独居人群打造的轻量化安全工具 | A lightweight safety tool for solo-living individuals',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#ffffff',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get translations
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${geistSans.variable} ${notoSansSC.variable}`}>
      <body className="antialiased bg-gray-50 min-h-screen">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
