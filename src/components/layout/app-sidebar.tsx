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
  Technology: 'Cpu',
  Actuality: 'Newspaper',
};

export function AppSidebar() {
  const authorName = 'The Author';
  const shortBio = `
    Passionate writer dedicated to exploring technology, science, and culture.
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
                        alt={`A portrait of ${authorName}`}
                        data-ai-hint="author portrait"
                    />
                    <AvatarFallback>
                        <Lucide.User className="h-10 w-10 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <h3 className="text-md font-headline font-bold">The Author</h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                    {shortBio}
                </p>
                <Link href="/about" className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                        Read More 
                        <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                </Link>
            </div>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Categories</SidebarGroupLabel>
          <SidebarMenu>
            {categories.map((category) => {
              const Icon = Lucide[categoryIcons[category.name] || 'Folder'] as React.ElementType;
              const articleCount = getArticlesByCategory(category.name).length;
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
        </SidebarGroup>
      </SidebarContent>
    </>
  );
}
