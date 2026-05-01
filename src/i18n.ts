import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// List of supported locales
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'fr';

export default getRequestConfig(async ({ requestLocale }) => {
  // next-intl 4.x: read the locale from requestLocale (the legacy `locale`
  // argument is no longer populated automatically).
  const locale = await requestLocale;

  if (!locale || !locales.includes(locale as Locale)) {
    notFound();
  }

  return {
    locale: locale as string,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
