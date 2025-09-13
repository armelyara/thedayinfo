
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { categories, getArticlesByCategory } from '@/lib/data';
import { SearchInput } from '@/components/search-input';
import { LogoIcon } from '@/components/icons';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

const categoryIcons: { [key: string]: keyof typeof Lucide } = {
  Technologie: 'Cpu',
  Actualité: 'Newspaper',
};

// This is now a client component because it needs to fetch category counts on the client.
// Or we could pass counts as props. For simplicity, we fetch here.
// In a real app, this data could be statically generated or fetched once.
function CategoryList() {
    // This is a placeholder. In a real app, you'd fetch this data.
    // Since getArticlesByCategory is now async, we can't call it directly here.
    // For this demo, we will display 0.
    return (
        <SidebarMenu>
        {categories.map((category) => {
          const Icon = Lucide[categoryIcons[category.name] || 'Folder'] as React.ElementType;
          const articleCount = 0; // Placeholder
          return (
            <SidebarMenuItem key={category.slug}>
              <Link href={`/category/${category.slug}`} className="w-full">
                <SidebarMenuButton tooltip={category.name}>
                  <Icon />
                  <span>{category.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{articleCount}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    )
}


export function AppSidebar() {
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
                <h3 className="text-md font-headline font-bold">L'Auteur</h3>
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
          <CategoryList />
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
