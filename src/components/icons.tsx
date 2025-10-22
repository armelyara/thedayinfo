// Remplace TOUT le contenu de src/components/icons.tsx

import React from 'react';
import Image from 'next/image';

// Logo TheDayInfo avec ton image réelle
export const LogoIcon = ({ 
  className, 
  width = 32, 
  height = 32,
  ...props 
}: { 
  className?: string;
  width?: number;
  height?: number;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={className} {...props}>
    <Image
      src="/logo.png"  // ← Change si ton fichier s'appelle différemment
      alt="TheDayInfo Logo"
      width={width}
      height={height}
      className="object-contain"
      priority // Charge le logo immédiatement
    />
  </div>
);

// Version sans Next.js Image (si tu as des problèmes)
export const LogoIconSimple = ({ 
  className,
  width = 32,
  height = 32 
}: { 
  className?: string;
  width?: number;
  height?: number;
}) => (
  <img
    src="/logo.png"
    alt="TheDayInfo Logo"
    width={width}
    height={height}
    className={className}
    style={{ objectFit: 'contain' }}
  />
);