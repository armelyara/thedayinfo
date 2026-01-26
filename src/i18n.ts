import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
    // 1. On attend la locale (c'est une promesse maintenant)
    console.log('[i18n] start getRequestConfig');
    let locale = await requestLocale;
    console.log('[i18n] locale resolved:', locale);

    // 2. Si la locale est indéfinie ou n'est pas dans notre liste, on déclenche 404
    if (!locale || !routing.locales.includes(locale as any)) {
        console.log('[i18n] locale not found or invalid');
        notFound();
    }

    console.log('[i18n] loading messages');
    const messages = (await import(`../messages/${locale}.json`)).default;
    console.log('[i18n] messages loaded');

    return {
        locale, // 3. On retourne explicitement la locale validée
        messages
    };
});