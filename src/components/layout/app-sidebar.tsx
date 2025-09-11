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

const categoryIcons: { [key: string]: keyof typeof Lucide } = {
  Technology: 'Cpu',
  Science: 'FlaskConical',
  'Health & Wellness': 'HeartPulse',
  Business: 'Briefcase',
  Culture: 'Palette',
};

export function AppSidebar() {
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
