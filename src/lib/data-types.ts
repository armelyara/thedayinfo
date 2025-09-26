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
    status: 'drafts' | 'published' | 'scheduled';
    scheduledFor?: string | null;
    image: ArticleImage;
    content: string;
    views: number;
    comments: Comment[];
    viewHistory: ViewHistory[];
    lastSaved?: string;
    autoSavedId?: string;
    isDraft?: boolean;
    version?: number;
    originalVersion?: number;
};

export type Category = {
    name: string;
    slug: string;
};

export type Subscriber = {
    email: string;  // L'email sert d'identifiant unique
    name?: string;
    subscribedAt: string;
    status: 'active' | 'inactive' | 'unsubscribed';
    preferences?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'immediate';
      categories: string[];
    };

};

export type Draft = {
    autoSaveId: string;
    title: string;
    author: string;
    category: string;
    content: string;
    image?: Partial<ArticleImage>;
    scheduledFor?: string | null;
    lastSaved: string;
    createdAt: string;
    status: 'draft';
    originalArticleSlug?: string;
    isEditing?: boolean;
    editingVersion?: number; 
};
export type ArticleVersion = {
    versionId: string;
    articleSlug: string;
    version: number;
    title: string;
    content: string;
    author: string;
    category: string;
    image: ArticleImage;
    createdAt: string;
    publishedAt: string;
    reason: 'creation' | 'update' | 'schedule';
};