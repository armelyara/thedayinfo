
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, BookUser } from 'lucide-react';

export default function AboutPage() {
  const authorName = 'The Author'; // You can change this to your name
  const biography = `
    Welcome to my corner of the internet! I'm a passionate writer and creator, dedicated to exploring 
    the fascinating worlds of technology, science, and culture. My journey began with a simple curiosity 
    about how things work, and it has since evolved into a lifelong quest to share knowledge and insights 
    with a wider audience.
    <br/><br/>
    Through this blog, "The Day Info," I aim to provide you with a daily dose of information that is both 
    enlightening and engaging. Whether I'm delving into the complexities of artificial intelligence, 
    uncovering the latest breakthroughs in space exploration, or reflecting on the cultural movements 
    that shape our society, my goal is to make complex topics accessible and exciting.
    <br/><br/>
    When I'm not writing, you can find me hiking in the great outdoors, experimenting with new recipes, 
    or lost in a good book. Thank you for joining me on this journey. I hope my articles inspire you, 
    spark your curiosity, and add a little something special to your day.
  `;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <main className="flex flex-col items-center text-center">
        <Avatar className="h-40 w-40 mb-6 border-4 border-primary/20 shadow-lg">
          <AvatarImage 
            src="https://picsum.photos/seed/author-pic/200/200"
            alt={`A portrait of ${authorName}`}
            data-ai-hint="author portrait"
          />
          <AvatarFallback>
            <User className="h-20 w-20 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
        <h1 className="text-4xl font-headline font-bold text-foreground mb-2">
          {authorName}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Creator of The Day Info
        </p>
        
        <div 
          className="prose prose-lg dark:prose-invert max-w-none text-left"
          dangerouslySetInnerHTML={{ __html: biography }}
        />
      </main>
    </div>
  );
}
