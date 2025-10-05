// src/lib/social-config.ts

/**
 * Configuration des liens sociaux et informations du site
 * Centralisé pour faciliter la maintenance
 */

export const socialLinks = {
    email: 'armelyara@thedayinfo.com',
    twitter: 'https://x.com/ArmelYara',
    facebook: 'https://www.facebook.com/thedayinfo/',
    linkedin: 'https://www.linkedin.com/in/armel-yara-3757b4105/',
    github: 'https://github.com/armelyara',
  } as const;
  
  export const siteInfo = {
    name: 'The Day Info',
    author: 'Armel Yara',
    description: "Blog d'actualités et de réflexions sur la technologie et l'innovation",
    foundedYear: 2018,
  } as const;
  
  export const legalLinks = {
    mentionsLegales: '/mentions-legales',
    politiqueConfidentialite: '/politique-confidentialite',
    contact: '/contact',
  } as const;