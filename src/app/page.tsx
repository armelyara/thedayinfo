
import { articles } from '@/lib/data';
import { ArticleCard } from '@/components/article/article-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const authorName = 'The Author';
  const shortBio = `
    Welcome to my corner of the internet! I'm a passionate writer dedicated to exploring 
    the fascinating worlds of technology, science, and culture.
  `;

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          The Day Info
        </h1>
        <p className="mt-3 text-lg text-muted-foreground sm:text-xl">
          Your daily dose of information, curated for the curious mind.
        </p>
      </header>

      <section className="mb-16 rounded-lg bg-card p-8 text-center shadow-sm">
        <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-primary/20">
            <AvatarImage 
                src="https://picsum.photos/seed/author-pic/150/150"
                alt={`A portrait of ${authorName}`}
                data-ai-hint="author portrait"
            />
            <AvatarFallback>
                <User className="h-12 w-12 text-muted-foreground" />
            </AvatarFallback>
        </Avatar>
        <h2 className="text-2xl font-headline font-bold mb-2">About the Author</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
          {shortBio}
        </p>
        <Button asChild>
          <Link href="/about">
            Learn More <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </section>

      <main>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </main>
    </div>
  );
}
