'use client';

import Link from 'next/link';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { LogoIcon } from '@/components/icons';
import { Home, FileEdit, Plus, Users, BarChart3, User } from 'lucide-react';

const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Brouillons",
    url: "/admin/drafts", 
    icon: FileEdit,
  },
  {
    title: "Créer Article",
    url: "/admin/create-article",
    icon: Plus,
  },
  {
    title: "Abonnés",
    url: "/admin/subscribers",
    icon: Users,
  },
  {
    title: "Profil",
    url: "/admin/profile",
    icon: User,
  },
];

export function AdminSidebar() {
  return (
    <>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <LogoIcon className="h-8 w-8 text-primary" />
          <span className="text-xl font-headline font-semibold">Admin Panel</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarMenu>
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <SidebarMenuItem key={item.url}>
                  <Link href={item.url} className="w-full">
                    <SidebarMenuButton tooltip={item.title}>
                      <Icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
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