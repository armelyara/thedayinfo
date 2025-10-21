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
    likes: number;      
    dislikes: number; 
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
    unsubscribeToken?: string; // ← Ajouter ce champ
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
    scheduledFor?: string | Date | null; // Date de programmation
    lastSaved: string;
    createdAt: string;
    status: 'draft' | 'scheduled'; // Statut au sein des brouillons
    originalArticleSlug?: string; 
};

export type Project = {
    slug: string;
    title: string;
    description: string; // Description courte pour la card
    fullDescription: string; // Description complète pour /projets/[slug]
    image: ArticleImage;
    technologies: string[]; // ["Next.js", "Firebase", "TensorFlow"]
    status: 'terminé' | 'en-cours' | 'maintenance';
    startDate: string; // "2025-01"
    endDate?: string; // optionnel
    githubUrl?: string; // optionnel
    demoUrl?: string; // optionnel
    blogArticleSlug?: string; // lien vers article détaillé dans le blog
    createdAt: string; // ISODate string
    updatedAt: string; // ISODate string
};
