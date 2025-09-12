
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, BookUser } from 'lucide-react';

export default function AboutPage() {
  const authorName = 'L\'Auteur'; // Vous pouvez changer cela pour votre nom
  const biography = `
    Bienvenue dans mon coin d'internet ! Je suis un écrivain et créateur passionné, dédié à l'exploration 
    des mondes fascinants de la technologie, de la science et de la culture. Mon parcours a commencé par une simple curiosité 
    sur le fonctionnement des choses, et il a depuis évolué en une quête de toute une vie pour partager des connaissances et des idées 
    avec un public plus large.
    <br/><br/>
    À travers ce blog, "The Day Info", je vise à vous fournir une dose quotidienne d'informations à la fois 
    éclairantes et engageantes. Que je me plonge dans les complexités de l'intelligence artificielle, 
    que je découvre les dernières avancées de l'exploration spatiale ou que je réfléchisse aux mouvements culturels 
    qui façonnent notre société, mon objectif est de rendre les sujets complexes accessibles et passionnants.
    <br/><br/>
    Quand je n'écris pas, vous pouvez me trouver en randonnée en pleine nature, en train d'expérimenter de nouvelles recettes, 
    ou perdu dans un bon livre. Merci de vous joindre à moi dans cette aventure. J'espère que mes articles vous inspireront, 
    éveilleront votre curiosité et ajouteront quelque chose de spécial à votre journée.
  `;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <main className="flex flex-col items-center text-center">
        <Avatar className="h-40 w-40 mb-6 border-4 border-primary/20 shadow-lg">
          <AvatarImage 
            src="https://picsum.photos/seed/author-pic/200/200"
            alt={`Un portrait de ${authorName}`}
            data-ai-hint="portrait auteur"
          />
          <AvatarFallback>
            <User className="h-20 w-20 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-headline font-bold text-foreground mb-2">
          {authorName}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Créateur de The Day Info
        </p>
        
        <div 
          className="prose prose-lg dark:prose-invert max-w-none text-left"
          dangerouslySetInnerHTML={{ __html: biography }}
        />
      </main>
    </div>
  );
}
