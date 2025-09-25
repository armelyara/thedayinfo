// src/lib/data-types.ts

// Ce fichier contient uniquement les définitions de types partagées
// pour éviter les importations circulaires ou l'inclusion de code serveur/client non désiré.

export type Profile = {
    name: string;
    biography: string;
    imageUrl: string;
};

export type Comment = {
    id: number;
    author: string;
    text: string;
    avatar: string;
    parentId?: number | null;
    likes?: number;
};
  
export type ViewHistory = {
    date: string;
    views: number;
};
  
export type ArticleImage = {
    id: string;
    src: string;
    alt: string;
    aiHint: string;
};

export type Article = {
    slug: string;
    title: string;
    author: string;
    category: string;
    publishedAt: string;
    status: 'published' | 'scheduled';
    scheduledFor?: string | null;
    image: ArticleImage;
    content: string;
    views: number;
    comments: Comment[];
    viewHistory: ViewHistory[];
};

export type Category = {
    name: string;
    slug: string;
};

export type Subscriber = {
    id: string;
    email: string;
    name?: string;
    subscribedAt: string;
    status: 'active' | 'unsubscribed';
    preferences: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'immediate';
      categories: string[];
    };
};
