'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Ce composant est affiché DANS le layout localisé ([locale]/layout.tsx)
// Donc il ne doit PAS contenir <html> ou <body>
export default function NotFound() {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-3xl font-bold">Page non trouvée</h2>
            <p className="text-muted-foreground">La ressource demandée n'existe pas.</p>
            <Button asChild variant="default">
                <Link href="/">Retour à l'accueil</Link>
            </Button>
        </div>
    );
}
