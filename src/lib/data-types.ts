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
    src: string;
    alt: string;
    aiHint?: string;
};

export type Article = {
    slug: string;
    title: string;
    author: string;
    category: string;
    publishedAt: string;
    status: 'published'; // Un article publié est toujours 'published'
    image: ArticleImage;
    content: string;
    views: number;
    comments: Comment[];
    viewHistory: ViewHistory[];
    scheduledFor?: string | null; // Pour référence, mais n'affecte pas le statut
};

export type Category = {
    name: string;
    slug: string;
};

export type Subscriber = {
    email: string;
    name?: string;
    subscribedAt: string;
    status: 'active' | 'inactive' | 'unsubscribed';
    preferences?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'immediate';
      categories: string[];
    };
};

export type Draft = {
    id: string; // ID du document dans la collection 'drafts'
    title: string;
    author: string;
    category: string;
    content: string;
    image?: Partial<ArticleImage>;
    scheduledFor?: string | null; // Date de programmation
    lastSaved: string;
    createdAt: string;
    status: 'draft' | 'scheduled'; // Statut au sein des brouillons
};
