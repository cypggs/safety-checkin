import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  return {
    locale: locale as string,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
