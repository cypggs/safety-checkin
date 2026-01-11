import { getRequestConfig } from 'next-intl/server';

// Supported locales
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'zh';

export default getRequestConfig(async ({ locale }) => {
  // Fallback to default locale if locale is undefined
  const validLocale = locales.includes(locale as Locale) 
    ? (locale as Locale) 
    : defaultLocale;
  
  return {
    locale: validLocale as string,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
