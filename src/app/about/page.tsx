
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, BookUser } from 'lucide-react';

export default function AboutPage() {
  const authorName = 'Armel Yara'; // Vous pouvez changer cela pour votre nom
  const biography = `
    Bienvenue ! Je suis Armel Yara, developer advocate avec plus de 5 ans d'expérience dans les domaines de la science des données, du web,
    des applications mobiles, du machine learning et deep learning. 
    Mon rôle est de traduire les besoins du client en solution numérique. 
    <br/><br/>
    Bref, je passe mon temps à résoudre des problèmes🤔. 
    <br/><br/>
    J'ai crée The Day Info dans le but de partager mon savoir-faire acquis lors de la réalisation de mes projets. 
    Cela me permet de cronstruit un pont entre les développeurs et les entreprises/particuliers afin de rendre accessible l'information à la majorité du publique.
    <br/><br/>
    La compréhension par un large éventail de la population, pour mart, permettra   je n'écris pas, vous pouvez me trouver en randonnée en pleine nature, en train d'expérimenter de nouvelles recettes, 
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
