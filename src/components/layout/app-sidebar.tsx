'use client';

import { useState, useEffect } from 'react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { SearchInput } from '@/components/search-input';
import { LogoIcon } from '@/components/icons';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

type Category = {
  name: string;
  slug: string;
};

// Type local pour les articles
type Article = {
  category: string;
  status: 'published' | 'scheduled';
  publishedAt: string;
};

const categoryIcons: { [key: string]: keyof typeof Lucide } = {
  Technologie: 'Cpu',
  Actualité: 'Newspaper',
};

// Fonction client pour récupérer les compteurs via API publique
async function getCategoryCounts() {
  try {
    // Utilise la route publique des articles, qui est accessible sans authentification admin
    const response = await fetch('/api/articles'); 
    if (!response.ok) {
      throw new Error('Erreur lors du chargement des articles pour le comptage');
    }
    
    const articles: Article[] = await response.json();
    
    // Compter les articles par catégorie
    const counts = articles.reduce((acc: Record<string, number>, article: Article) => {
      acc[article.category] = (acc[article.category] || 0) + 1;
      return acc;
    }, {});

    return counts;
  } catch (error) {
    console.error('Erreur lors du comptage des articles:', error);
    return {};
  }
}

function CategoryList({ categories }: { categories: Category[] }) {
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    getCategoryCounts().then(setCategoryCounts);
  }, []);

  return (
    <SidebarMenu>
      {categories.map((category) => {
        const Icon = Lucide[categoryIcons[category.name] || 'Folder'] as React.ElementType;
        const count = categoryCounts[category.name] || 0;
        
        return (
          <SidebarMenuItem key={category.slug}>
            <Link href={`/category/${category.slug}`} className="w-full">
              <SidebarMenuButton tooltip={category.name} className="flex justify-between">
                <div className="flex items-center">
                  <Icon className="mr-2" />
                  <span>{category.name}</span>
                </div>
                {count > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {count}
                  </span>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

export function AppSidebar({ categories }: { categories: Category[] }) {
  const authorName = 'L\'Auteur';
  const shortBio = `
    Écrivain passionné dédié à l'exploration de la technologie, de la science et de la culture.
  `;

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <LogoIcon className="h-8 w-8 text-primary" />
          <span className="text-xl font-headline font-semibold">The Day Info</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SearchInput />
        </SidebarGroup>
        <SidebarGroup>
          <div className="flex flex-col items-center text-center p-2">
            <Avatar className="h-20 w-20 mx-auto mb-3 border-4 border-primary/20">
              <AvatarImage 
                src="https://picsum.photos/seed/author-pic/150/150"
                alt={`Un portrait de ${authorName}`}
                data-ai-hint="portrait auteur"
              />
              <AvatarFallback>
                <Lucide.User className="h-10 w-10 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            <h3 className="text-md font-headline font-bold">Armel Yara</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              {shortBio}
            </p>
            <Link href="/about" className="w-full">
              <Button variant="secondary" size="sm" className="w-full">
                Lire la suite
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Catégories</SidebarGroupLabel>
          <CategoryList categories={categories} />
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
