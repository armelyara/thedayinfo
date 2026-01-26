import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // 1. On attend la locale (c'est une promesse maintenant)
    let locale = await requestLocale;

    // 2. Si la locale est indéfinie ou n'est pas dans notre liste, on déclenche 404
    if (!locale || !routing.locales.includes(locale as any)) {
        notFound();
    }

    return {
        locale, // 3. On retourne explicitement la locale validée
        messages: (await import(`../messages/${locale}.json`)).default
    };
});