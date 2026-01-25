import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
    // Vos langues supportées
    locales: ['fr', 'en'],
    defaultLocale: 'fr',
    localePrefix: 'as-needed'
});

// Helpers de navigation typés
export const { Link, redirect, usePathname, useRouter, getPathname } =
    createNavigation(routing);