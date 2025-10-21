import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-1 items-center justify-center text-center">
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          Phase 3 : Landing Page
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground sm:text-xl">
          Ceci est un placeholder pour la future page d'accueil.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/projets">Voir les projets</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/blog">Lire le blog</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
