// src/lib/data-client.ts
'use server';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query,
    where,
    orderBy,
    increment,
    updateDoc,
    setDoc,
    deleteDoc,
    addDoc,
    Timestamp as ClientTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Article, Category, Subscriber, Profile, Comment } from './data-types';

const convertDocToArticle = (docSnap: any): Article => {
    const data = docSnap.data();
    
    const toISOString = (timestamp: any): string => {
        if (!timestamp) return new Date().toISOString();
        if (timestamp instanceof ClientTimestamp) {
            return timestamp.toDate().toISOString();
        }
        // Handle server-side timestamps if they appear
        if (timestamp.toDate) {
            return timestamp.toDate().toISOString();
        }
        return new Date(timestamp).toISOString();
    };

    return {
        slug: docSnap.id,
        title: data.title,
        author: data.author,
        category: data.category,
        publishedAt: toISOString(data.publishedAt),
        status: data.status,
        scheduledFor: data.scheduledFor ? toISOString(data.scheduledFor) : undefined,
        image: data.image,
        content: data.content,
        views: data.views || 0,
        comments: data.comments || [],
        viewHistory: data.viewHistory ? data.viewHistory.map((vh: any) => ({...vh, date: toISOString(vh.date)})) : [],
    } as Article;
};

const convertDocToSubscriber = (docSnap: any): Subscriber => {
    const data = docSnap.data();
    const toISOString = (timestamp: any): string => {
        if (!timestamp) return new Date().toISOString();
        if (timestamp instanceof ClientTimestamp) {
            return timestamp.toDate().toISOString();
        }
        if (timestamp.toDate) {
            return timestamp.toDate().toISOString();
        }
        return new Date(timestamp).toISOString();
    };
    return {
        id: docSnap.id,
        email: data.email,
        name: data.name,
        subscribedAt: toISOString(data.subscribedAt),
        status: data.status,
        preferences: data.preferences,
    } as Subscriber;
};

export async function getPublishedArticles(): Promise<Article[] | { error: string; message: string }> {
    try {
        if (!db) throw new Error('Firebase client db non initialisé');
        
        const articlesCollection = collection(db, 'articles');
        const now = new Date();

        const q = query(
            articlesCollection,
            where('status', '==', 'published'),
            where('publishedAt', '<=', now),
            orderBy('publishedAt', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const articles = snapshot.docs.map(convertDocToArticle);

        return articles;
    } catch (error: any) {
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
            const urlRegex = /(https?:\/\/[^\s]+)/;
            const match = error.message.match(urlRegex);
            const indexCreationUrl = match ? match[0] : null;

            return {
                error: 'missing_index',
                message: indexCreationUrl ? `Index manquant. Veuillez créer l'index Firestore en visitant : ${indexCreationUrl}` : error.message
            };
        }
        console.error("Error fetching published articles:", error);
        return {
            error: 'database_error',
            message: `Une erreur est survenue lors de la récupération des articles: ${error.message}`
        };
    }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    try {
        if (!db) return null;
        
        const docRef = doc(db, 'articles', slug);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            return null;
        }
        
        try {
            await updateDoc(docRef, { views: increment(1) });
        } catch (e) {
            console.error("Failed to increment views:", e);
        }

        return convertDocToArticle(docSnap);
    } catch (error) {
        console.error(`Error fetching article by slug ${slug}:`, error);
        return null;
    }
}

export async function getArticlesByCategory(categorySlug: string, categories: Category[]): Promise<Article[]> {
    try {
        if (!db) return [];
        
        const category = categories.find(c => c.slug === categorySlug);
        if (!category) return [];

        const articlesCollection = collection(db, 'articles');
        const now = new Date();
        
        const q = query(articlesCollection,
            where('category', '==', category.name),
            where('status', '==', 'published'),
            where('publishedAt', '<=', now),
            orderBy('publishedAt', 'desc'));
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(convertDocToArticle);
    } catch (error) {
        console.error(`Error fetching articles for category ${categorySlug}:`, error);
        return [];
    }
}

export async function searchArticles(queryText: string): Promise<Article[]> {
    if (!queryText) return [];
    
    const articlesResult = await getPublishedArticles();

    if ('error' in articlesResult) {
        console.error("Search failed due to DB error:", articlesResult.message);
        return [];
    }
    
    const plainTextContent = (html: string) => html.replace(/<[^>]*>?/gm, '');

    return articlesResult.filter(article => 
        article.title.toLowerCase().includes(queryText.toLowerCase()) ||
        plainTextContent(article.content).toLowerCase().includes(queryText.toLowerCase())
    );
}

export async function updateArticleComments(slug: string, comments: Comment[]): Promise<boolean> {
    try {
        if (!db) return false;
        
        const docRef = doc(db, 'articles', slug);
        await updateDoc(docRef, { comments });
        return true;
    } catch (error) {
        console.error("Failed to update comments in Firestore:", error);
        return false;
    }
}

// SUBSCRIBERS
export async function addSubscriber(subscriberData: {
    email: string;
    name?: string;
    preferences?: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'immediate';
      categories: string[];
    };
}): Promise<Subscriber> {
    if (!db) throw new Error('Firebase client non initialisé');
    
    const subscribersCollection = collection(db, 'subscribers');
    
    const q = query(subscribersCollection, where('email', '==', subscriberData.email));
    const existingSnapshot = await getDocs(q);
    
    if (!existingSnapshot.empty) {
        throw new Error('Cette adresse email est déjà abonnée');
    }

    const newSubscriber = {
        ...subscriberData,
        name: subscriberData.name || '',
        subscribedAt: new Date(),
        status: 'active' as const,
        preferences: subscriberData.preferences || {
            frequency: 'weekly' as const,
            categories: ['Technologie', 'Actualité']
        }
    };

    const docRef = await addDoc(subscribersCollection, newSubscriber);
    const createdDoc = await getDoc(docRef);
    
    return convertDocToSubscriber(createdDoc);
}

export async function getSubscribers(): Promise<Subscriber[]> {
    try {
        if (!db) return [];
        
        const subscribersCollection = collection(db, 'subscribers');
        const snapshot = await getDocs(query(subscribersCollection, orderBy('subscribedAt', 'desc')));
        return snapshot.docs.map(convertDocToSubscriber);
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        return [];
    }
}


export async function updateSubscriberStatus(
    subscriberId: string, 
    status: 'active' | 'unsubscribed'
): Promise<void> {
    if (!db) throw new Error('Firebase client non initialisé');
    
    const docRef = doc(db, 'subscribers', subscriberId);
    await updateDoc(docRef, { status });
}

export async function deleteSubscriber(subscriberId: string): Promise<void> {
    if (!db) throw new Error('Firebase client non initialisé');
    
    const docRef = doc(db, 'subscribers', subscriberId);
    await deleteDoc(docRef);
}


// PROFILE
const DEFAULT_PROFILE: Profile = {
    name: 'Armel Yara',
    biography: `
      Bienvenue ! Je suis Armel Yara, developer advocate avec plus de 5 ans d'expérience dans les domaines de la science des données, du web,
      des applications mobiles, du machine learning et deep learning. 
      <br/><br/>
      Mon rôle est de traduire les besoins du client en solution numérique. 
      <br/><br/>
      Bref, je passe mon temps à résoudre des problèmes🤔. 
      <br/><br/>
      J'ai crée The Day Info dans le but de partager mon savoir-faire acquis lors de la réalisation de mes projets. 
      Cela me permet de cronstruit un pont entre les développeurs et les entreprises/particuliers afin de rendre accessible l'information à la majorité du publique.
      <br/><br/>
      La compréhension par un large éventail de la population, pour mart, des concepts fondamentaux de l'intelligence artificielle, permettra de s'approprier ce domaine.
      <br/><br/>
      Merci de vous joindre à moi dans cette aventure. <br/><br/>
      J'espère que mes articles vous inspireront, 
      éveilleront votre curiosité et ajouteront quelque chose de spécial à votre journée.
    `,
    imageUrl: 'https://picsum.photos/seed/author-pic/200/200'
};

export async function getProfile(): Promise<Profile> {
    try {
        if (!db) return DEFAULT_PROFILE;
        const docRef = doc(db, 'site-config', 'profile');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as Profile;
        } else {
            // This is a read-only context, but for robustness, we can try to set it.
            // On a read-only client, this might fail, but getProfile will still return the default.
            try {
                await setDoc(docRef, DEFAULT_PROFILE);
            } catch (e) {
                console.warn("Could not seed default profile from client-side getProfile. This is expected in a read-only environment.");
            }
            return DEFAULT_PROFILE;
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        return DEFAULT_PROFILE;
    }
}
