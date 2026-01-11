import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Add locale prefix for all locales (more reliable)
  localePrefix: 'always',
});

export const config = {
  // Match all pathnames with locale prefix
  matcher: ['/', '/(zh|en)/:path*'],
};
