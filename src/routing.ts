import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: ['fr', 'en'],

    // Used when no locale matches
    defaultLocale: 'fr',

    // Optional: The default locale prefix is 'as-needed' which avoids
    // /fr/... and simply uses /... for the default locale
    localePrefix: 'as-needed'
});
