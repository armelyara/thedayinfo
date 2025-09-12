

import { parseISO } from 'date-fns';

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

// Helper to generate fake view history
const generateViewHistory = (startDate: Date, totalViews: number): ViewHistory[] => {
    const history: ViewHistory[] = [];
    const now = new Date();
    let currentDate = new Date(startDate);
    let remainingViews = totalViews;
  
    while (currentDate <= now) {
      // Simulate some variance
      const peakDay = Math.random() < 0.1; // 10% chance of a peak
      const randomFactor = peakDay ? Math.random() * 0.2 + 0.1 : Math.random() * 0.05;
      const dailyViews = Math.min(remainingViews, Math.floor(totalViews * randomFactor * (1 + Math.sin(currentDate.getTime() / (1000 * 60 * 60 * 24 * 30)))) + 1);
      
      if(remainingViews > 0) {
        history.push({
            date: currentDate.toISOString().split('T')[0],
            views: Math.max(0, dailyViews),
        });
        remainingViews -= dailyViews;
      }
  
      currentDate.setDate(currentDate.getDate() + 15); // Add 15 days
    }
  
    return history;
  };

export let articles: Article[] = [
  {
    slug: 'le-futur-de-lia-dans-la-technologie',
    title: 'L\'Avenir de l\'Intelligence Artificielle et son Impact sur la Technologie',
    author: 'Jane Doe',
    category: 'Technologie',
    publicationDate: '2023-10-26T10:00:00.000Z',
    status: 'published',
    image: {
      id: "1",
      src: 'https://picsum.photos/seed/1/600/400',
      alt: 'Visualisation abstraite de l\'IA',
      aiHint: 'abstract AI'
    },
    content:
      'L\'Intelligence Artificielle n\'est plus un concept de science-fiction ; c\'est une réalité qui remodèle notre monde. Des algorithmes d\'apprentissage automatique qui prédisent le comportement des consommateurs au traitement du langage naturel qui alimente nos assistants vocaux, l\'IA est au cœur des avancées technologiques les plus significatives de notre époque. Cet article explore la trajectoire du développement de l\'IA, ses applications actuelles dans diverses industries et les considérations éthiques que nous devons aborder alors que nous nous dirigeons vers un avenir de plus en plus automatisé. Nous nous pencherons sur l\'apprentissage profond, les réseaux de neurones et la quête de l\'Intelligence Générale Artificielle (AGI), offrant un aperçu complet pour les passionnés de technologie comme pour les nouveaux venus curieux.',
    views: 318,
    comments: [
      { id: 1, author: 'Alex', text: 'Super article ! Très instructif.', avatar: 'https://i.pravatar.cc/40?u=1' },
      { id: 2, author: 'Marie', text: 'J\'ai hâte de voir ce que l\'avenir nous réserve.', avatar: 'https://i.pravatar.cc/40?u=2' }
    ],
    viewHistory: generateViewHistory(new Date('2023-10-26'), 318),
  },
  {
    slug: 'exploration-du-cosmos',
    title: 'Exploration du Cosmos : Nouvelles Découvertes en Exploration Spatiale',
    author: 'John Smith',
    category: 'Actualité',
    publicationDate: '2023-10-25T10:00:00.000Z',
    status: 'published',
    image: {
      id: "2",
      src: 'https://picsum.photos/seed/2/600/400',
      alt: 'Une nébuleuse colorée dans l\'espace lointain',
      aiHint: 'nebula space'
    },
    content:
      'La dernière frontière continue de captiver notre imagination, et les récentes avancées en exploration spatiale nous ont rapprochés de la compréhension de l\'univers comme jamais auparavant. Ce mois-ci, le télescope spatial James Webb a renvoyé des images époustouflantes de galaxies lointaines, révélant la naissance d\'étoiles avec des détails saisissants. Pendant ce temps, les missions vers Mars en découvrent davantage sur le passé aquatique de la planète, alimentant les spéculations sur la possibilité d\'une vie extraterrestre. Rejoignez-nous pour un voyage à travers les dernières découvertes, des lunes glacées de Jupiter aux mystères de la matière noire, et célébrez l\'ingéniosité humaine qui rend ces découvertes possibles.',
    views: 542,
    comments: [],
    viewHistory: generateViewHistory(new Date('2023-10-25'), 542),
  },
  {
    slug: 'la-pleine-conscience-a-lere-numerique',
    title: 'La Pleine Conscience à l\'Ère Numérique : Un Guide pour le Bien-être',
    author: 'Emily White',
    category: 'Actualité',
    publicationDate: '2023-10-24T10:00:00.000Z',
    status: 'published',
    image: {
      id: "3",
      src: 'https://picsum.photos/seed/3/600/400',
      alt: 'Une personne méditant paisiblement en plein air',
      aiHint: 'meditation nature'
    },
    content:
      'Dans un monde de notifications constantes et de distractions numériques, trouver un moment de paix peut sembler une tâche monumentale. La pleine conscience, la pratique d\'être présent et pleinement conscient du moment présent, offre un antidote puissant au stress de la vie moderne. Ce guide fournit des conseils pratiques et des techniques pour intégrer la pleine conscience dans votre routine quotidienne. Nous couvrons tout, des exercices de respiration simples et des méditations guidées aux stratégies de désintoxication numérique et à l\'utilisation consciente de la technologie. Apprenez à réduire l\'anxiété, à améliorer votre concentration et à cultiver un sentiment de bien-être plus profond, même lorsque vous êtes entouré d\'écrans.',
    views: 231,
    comments: [],
    viewHistory: generateViewHistory(new Date('2023-10-24'), 231),
  },
  {
    slug: 'lessor-de-lentreprise-durable',
    title: 'L\'Essor de l\'Entreprise Durable : Le Profit Rencontre la Finalité',
    author: 'Michael Brown',
    category: 'Actualité',
    publicationDate: '2023-10-23T10:00:00.000Z',
    status: 'published',
    image: {
      id: "4",
      src: 'https://picsum.photos/seed/4/600/400',
      alt: 'Une plante verte poussant sur un tas de pièces de monnaie',
      aiHint: 'sustainable finance'
    },
    content:
      'Un nouveau paradigme émerge dans le monde de l\'entreprise, où le succès se mesure non seulement en termes de rendements financiers, mais aussi en termes d\'impact social et environnemental. Les pratiques commerciales durables passent de la périphérie au cœur de la stratégie d\'entreprise, car les entreprises reconnaissent la valeur à long terme de la gérance de l\'environnement et de la responsabilité sociale. Cet article examine les principaux moteurs de ce changement, des attentes changeantes des consommateurs aux risques croissants posés par le changement climatique. Nous mettons en lumière les entreprises innovantes qui ouvrent la voie en matière de durabilité et offrons des perspectives aux entreprises qui cherchent à intégrer une finalité dans leurs activités lucratives.',
    views: 189,
    comments: [],
    viewHistory: generateViewHistory(new Date('2023-10-23'), 189),
  },
  {
    slug: 'du-graffiti-aux-galeries',
    title: 'Du Graffiti aux Galeries : L\'Évolution de l\'Art de Rue',
    author: 'Sarah Green',
    category: 'Actualité',
    publicationDate: '2023-10-22T10:00:00.000Z',
    status: 'published',
    image: {
      id: "5",
      src: 'https://picsum.photos/seed/5/600/400',
      alt: 'Une fresque de graffiti vibrante et complexe sur un mur de briques',
      aiHint: 'graffiti wall'
    },
    content:
      'Autrefois considéré comme du vandalisme, l\'art de rue a subi une transformation remarquable, évoluant pour devenir une forme d\'art mondialement reconnue et célébrée. Les artistes qui opéraient autrefois dans l\'ombre sont maintenant mandatés pour des peintures murales publiques massives et exposés dans des galeries d\'art prestigieuses. Ce changement culturel reflète un changement plus large dans notre perception de l\'espace public et de l\'expression artistique. Nous retraçons l\'histoire de l\'art de rue depuis ses origines dans les sous-cultures du graffiti des années 1970 jusqu\'à son statut actuel de médium puissant pour le commentaire social et l\'innovation esthétique. Explorez les œuvres d\'artistes pionniers et les mouvements qui ont défini cette forme d\'art dynamique et accessible.',
    views: 402,
    comments: [],
    viewHistory: generateViewHistory(new Date('2023-10-22'), 402),
  },
  {
    slug: 'informatique-quantique-expliquee',
    title: 'L\'Informatique Quantique Expliquée : La Prochaine Révolution Technologique',
    author: 'David Chen',
    category: 'Technologie',
    publicationDate: '2023-10-21T10:00:00.000Z',
    status: 'published',
    image: {
      id: "6",
      src: 'https://picsum.photos/seed/6/600/400',
      alt: 'Représentation abstraite de bits quantiques',
      aiHint: 'quantum computing'
    },
    content:
      'L\'informatique quantique promet de résoudre des problèmes complexes qui sont actuellement insolubles même pour les superordinateurs les plus puissants. En exploitant les étranges principes de la mécanique quantique, tels que la superposition et l\'intrication, ces machines fonctionnent de manière fondamentalement différente des ordinateurs classiques. Dans cet article, nous décomposons les concepts fondamentaux de l\'informatique quantique, en expliquant les qubits, les portes quantiques et les algorithmes quantiques en des termes accessibles. Nous discutons également des applications potentielles, du développement de nouveaux médicaments et matériaux à la révolution de la finance et de l\'intelligence artificielle, et examinons l\'état actuel de la course pour construire un ordinateur quantique évolutif et tolérant aux pannes.',
    views: 721,
    comments: [],
    viewHistory: generateViewHistory(new Date('2023-10-21'), 721),
  },
];

export const categories: Category[] = [
  { name: 'Technologie', slug: 'technologie' },
  { name: 'Actualité', slug: 'actualite' },
];

export const getPublishedArticles = () => {
    return articles
      .filter(article => article.status === 'published' && parseISO(article.publicationDate) <= new Date())
      .sort((a, b) => parseISO(b.publicationDate).getTime() - parseISO(a.publicationDate).getTime());
  };
  

export const getArticleBySlug = (slug: string) => {
  return articles.find((article) => article.slug === slug);
};

export const getArticlesByCategory = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    return getPublishedArticles().filter((article) => article.category === category.name);
};

export const searchArticles = (query: string) => {
    if (!query) return [];
    return getPublishedArticles().filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase())
    );
};

export const addArticle = (article: Omit<Article, 'slug' | 'publicationDate' | 'image' | 'views' | 'comments' | 'status' | 'viewHistory'> & { scheduledFor?: string }) => {
  const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const now = new Date();
  const scheduledDate = article.scheduledFor ? new Date(article.scheduledFor) : null;

  const isScheduled = scheduledDate && scheduledDate > now;

  const newArticle: Article = {
    ...article,
    slug,
    publicationDate: (isScheduled ? scheduledDate : now).toISOString(),
    status: isScheduled ? 'scheduled' : 'published',
    scheduledFor: article.scheduledFor,
    image: {
      id: String(articles.length + 1),
      src: `https://picsum.photos/seed/${articles.length + 1}/600/400`,
      alt: article.title,
      aiHint: 'placeholder image'
    },
    views: 0,
    comments: [],
    viewHistory: [],
  };
  articles.unshift(newArticle);
  return newArticle;
};

export const updateArticle = (slug: string, data: Partial<Omit<Article, 'slug' | 'publicationDate' | 'image' | 'status' | 'views' | 'comments' | 'viewHistory'>> & { scheduledFor?: string }) => {
  const articleIndex = articles.findIndex(a => a.slug === slug);
  if (articleIndex === -1) {
    return null;
  }

  const existingArticle = articles[articleIndex];

  // If title changes, slug should change too.
  const newSlug = data.title ? data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : slug;

  const now = new Date();
  const scheduledDate = data.scheduledFor ? new Date(data.scheduledFor) : (existingArticle.scheduledFor ? new Date(existingArticle.scheduledFor) : null);

  const isScheduled = scheduledDate && scheduledDate > now;
  
  const updatedArticle: Article = {
    ...existingArticle,
    ...data,
    slug: newSlug,
    status: isScheduled ? 'scheduled' : 'published',
    publicationDate: (isScheduled && scheduledDate ? scheduledDate : parseISO(existingArticle.publicationDate)).toISOString(),
    scheduledFor: data.scheduledFor || existingArticle.scheduledFor,
  };
  articles[articleIndex] = updatedArticle;
  return updatedArticle;
}
