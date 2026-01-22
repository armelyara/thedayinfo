// src/app/about/page.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getProfile } from '@/lib/data-client';
import { User } from 'lucide-react';

export const revalidate = 3600; // Revalidate every hour

export default async function AboutPage() {
  const profile = await getProfile();

  // Gérer le cas où le profil n'existe pas
  if (!profile) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profil non trouvé</h1>
          <p className="text-muted-foreground">Le profil de l'auteur n'a pas pu être chargé.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <main className="flex flex-col items-center text-center">
        <Avatar className="h-40 w-40 mb-6 border-4 border-primary/20 shadow-lg">
          <AvatarImage 
            src={profile.imageUrl}
            alt={`Un portrait de ${profile.name}`}
            data-ai-hint="portrait auteur"
          />
          <AvatarFallback>
            <User className="h-20 w-20 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-headline font-bold text-foreground mb-2">
          {profile.name}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Créateur de The Day Info
        </p>
        
        <div 
          className="prose prose-lg dark:prose-invert max-w-none text-left"
          dangerouslySetInnerHTML={{ __html: profile.biography }}
        />
      </main>
    </div>
  );
}