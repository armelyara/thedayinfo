
'use client'; // Important: Switched to client-side data fetching

import { db } from './firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, setDoc, deleteDoc, updateDoc, Timestamp, writeBatch, deleteField } from 'firebase/firestore';

export type Comment = {
    id: number;
    author: string;
    text: string;
    avatar: string;
};
  
export type ViewHistory = {
    date: string;
    views: number;
};
  
export type Article = {
    slug: string;
    title: string;
    author: string;
    category: string;
    publicationDate: string;
    status: 'published' | 'scheduled';
    scheduledFor?: string;
    image: {
      id: string;
      src: string;
      alt: string;
      aiHint: string;
    };
    content: string;
    views: number;
    comments: Comment[];
    viewHistory: ViewHistory[];
};

export type Category = {
    name: string;
    slug: string;
};

const articlesCollection = collection(db, 'articles');

const convertDocToArticle = (doc: any): Article => {
    const data = doc.data();
    return {
        slug: doc.id,
        ...data,
        publicationDate: data.publicationDate instanceof Timestamp ? data.publicationDate.toDate().toISOString() : data.publicationDate,
        scheduledFor: data.scheduledFor instanceof Timestamp ? data.scheduledFor.toDate().toISOString() : data.scheduledFor,
    } as Article;
}

export async function getAllArticles(): Promise<Article[]> {
    const q = query(articlesCollection, orderBy('publicationDate', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        await seedDatabase();
        const seededSnapshot = await getDocs(q);
        if (seededSnapshot.empty) return [];
        return seededSnapshot.docs.map(convertDocToArticle);
    }
    return snapshot.docs.map(convertDocToArticle);
}

export async function getPublishedArticles(): Promise<Article[]> {
    const now = new Date();
    const q = query(
        articlesCollection,
        where('status', '==', 'published'),
        where('publicationDate', '<=', now.toISOString()),
        orderBy('publicationDate', 'desc')
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await seedDatabase();
        const seededSnapshot = await getDocs(q);
        if (seededSnapshot.empty) return [];
        return seededSnapshot.docs.map(convertDocToArticle).filter(a => new Date(a.publicationDate) <= now);
    }
    return snapshot.docs.map(convertDocToArticle);
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const docRef = doc(db, 'articles', slug);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
        return null;
    }
    return convertDocToArticle(docSnap);
}

export async function getArticlesByCategory(categorySlug: string): Promise<Article[]> {
    const categoriesList: Category[] = [
        { name: 'Technologie', slug: 'technologie' },
        { name: 'Actualité', slug: 'actualite' },
    ];
    const category = categoriesList.find(c => c.slug === categorySlug);
    if (!category) return [];

    const now = new Date();
    const q = query(
        articlesCollection,
        where('category', '==', category.name),
        where('status', '==', 'published'),
        where('publicationDate', '<=', now.toISOString()),
        orderBy('publicationDate', 'desc')
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(convertDocToArticle);
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    if (!queryText) return [];
    const allArticles = await getPublishedArticles();
    
    return allArticles.filter(article => 
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        article.content.toLowerCase().includes(queryText.toLowerCase())
    );
}

export async function addArticle(article: { title: string, author: string, category: string, content: string, scheduledFor?: Date }): Promise<Article> {
    const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    const now = new Date();
    const scheduledDate = article.scheduledFor;
  
    const isScheduled = scheduledDate && scheduledDate > now;
    const publicationDate = isScheduled ? scheduledDate : now;

    const dataForFirestore: any = {
      title: article.title,
      author: article.author,
      category: article.category,
      content: article.content,
      publicationDate: Timestamp.fromDate(publicationDate),
      status: isScheduled ? 'scheduled' : 'published',
      image: {
        id: String(Date.now()),
        src: `https://picsum.photos/seed/${slug}/600/400`,
        alt: article.title,
        aiHint: 'placeholder image'
      },
      views: 0,
      comments: [],
      viewHistory: [],
    };
    
    if (isScheduled) {
        dataForFirestore.scheduledFor = Timestamp.fromDate(scheduledDate!);
    }

    const docRef = doc(db, 'articles', slug);
    await setDoc(docRef, dataForFirestore);
    
    const createdArticle = await getArticleBySlug(slug);
    if (!createdArticle) {
        throw new Error("Failed to create and retrieve article.");
    }
    return createdArticle;
};

export async function updateArticle(slug: string, data: Partial<Omit<Article, 'slug' | 'scheduledFor'>> & { scheduledFor?: Date | null }): Promise<Article> {
    const docRef = doc(db, 'articles', slug);
    const dataForFirestore: { [key: string]: any } = { ...data };

    if (data.hasOwnProperty('scheduledFor')) {
        const scheduledDate = data.scheduledFor;
        if (scheduledDate) {
            const now = new Date();
            dataForFirestore.scheduledFor = Timestamp.fromDate(scheduledDate);
            dataForFirestore.publicationDate = Timestamp.fromDate(scheduledDate);
            dataForFirestore.status = scheduledDate > now ? 'scheduled' : 'published';
        } else {
            // Un-scheduling: publish now and remove scheduledFor field
            dataForFirestore.scheduledFor = deleteField();
            dataForFirestore.status = 'published';
            dataForFirestore.publicationDate = Timestamp.fromDate(new Date());
        }
    }
    
    await updateDoc(docRef, dataForFirestore);

    const updatedArticle = await getArticleBySlug(slug);
    if (!updatedArticle) throw new Error("Failed to retrieve updated article");
    return updatedArticle;
}


export async function deleteArticle(slug: string): Promise<boolean> {
    const docRef = doc(db, 'articles', slug);
    try {
        await deleteDoc(docRef);
        return true;
    } catch(e) {
        console.error("Error deleting article:", e);
        return false;
    }
}


export async function updateArticleComments(slug: string, comments: Comment[]): Promise<boolean> {
    const docRef = doc(db, 'articles', slug);
    try {
        await updateDoc(docRef, { comments });
        return true;
    } catch (error) {
        console.error("Failed to update comments in Firestore:", error);
        return false;
    }
}

// Seeding function
const initialArticles = [
  {
    "slug": "le-futur-de-lia-une-nouvelle-ere-d-innovation",
    "title": "Le Futur de L'IA : Une Nouvelle Ère d'Innovation",
    "author": "L'Auteur",
    "category": "Technologie",
    "publicationDate": "2024-05-01T10:00:00.000Z",
    "status": "published" as const,
    "image": { "id": "1", "src": "https://picsum.photos/seed/1/600/400", "alt": "Visualisation abstraite de l'IA", "aiHint": "abstract AI" },
    "content": "L'intelligence artificielle est en train de remodeler notre monde. De la médecine à la finance, ses applications sont infinies. Cet article explore les avancées récentes et ce que l'avenir nous réserve.",
    "views": 1500,
    "comments": [],
    "viewHistory": [
      { "date": "2024-05-01T00:00:00.000Z", "views": 800 },
      { "date": "2024-06-01T00:00:00.000Z", "views": 700 }
    ]
  },
  {
    "slug": "exploration-spatiale-les-prochaines-frontieres",
    "title": "Exploration Spatiale : Les Prochaines Frontières",
    "author": "L'Auteur",
    "category": "Actualité",
    "publicationDate": "2024-05-15T10:00:00.000Z",
    "status": "published" as const,
    "image": { "id": "2", "src": "https://picsum.photos/seed/2/600/400", "alt": "Une nébuleuse colorée dans l'espace lointain", "aiHint": "nebula space" },
    "content": "Avec les récentes missions vers Mars et au-delà, l'humanité est à l'aube d'une nouvelle ère d'exploration spatiale. Découvrez les défis et les merveilles qui nous attendent.",
    "views": 850,
    "comments": [],
    "viewHistory": [
      { "date": "2024-05-01T00:00:00.000Z", "views": 400 },
      { "date": "2024-06-01T00:00:00.000Z", "views": 450 }
    ]
  },
    {
    "slug": "la-revolution-quantique-est-elle-pour-demain",
    "title": "La Révolution Quantique est-elle pour Demain ?",
    "author": "L'Auteur",
    "category": "Technologie",
    "publicationDate": "2024-06-01T10:00:00.000Z",
    "status": "published" as const,
    "image": { "id": "6", "src": "https://picsum.photos/seed/6/600/400", "alt": "Représentation abstraite de bits quantiques", "aiHint": "quantum computing" },
    "content": "L'informatique quantique promet de résoudre des problèmes aujourd'hui insolubles. Mais où en sommes-nous réellement ? Cet article fait le point sur les avancées et les obstacles de cette technologie de rupture.",
    "views": 2300,
    "comments": [],
    "viewHistory": [
      { "date": "2024-06-01T00:00:00.000Z", "views": 1200 },
      { "date": "2024-07-01T00:00:00.000Z", "views": 1100 }
    ]
  }
];

export async function seedDatabase() {
    const articlesSnapshot = await getDocs(query(articlesCollection));
    if (articlesSnapshot.empty) {
        console.log('No articles found, seeding database...');
        const batch = writeBatch(db);
        initialArticles.forEach(article => {
            const docRef = doc(db, 'articles', article.slug);
            const { slug, ...data } = article;
            const dataForFirestore = {
                ...data,
                publicationDate: Timestamp.fromDate(new Date(data.publicationDate)),
            };
            batch.set(docRef, dataForFirestore);
        });
        await batch.commit();
        console.log('Database seeded successfully.');
    } else {
        // console.log('Database already contains articles, skipping seed.');
    }
}
