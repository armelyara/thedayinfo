export type Article = {
  slug: string;
  title: string;
  author: string;
  category: string;
  publicationDate: string;
  image: {
    id: string;
    src: string;
    alt: string;
    aiHint: string;
  };
  content: string;
};

export type Category = {
  name: string;
  slug: string;
};

export const categories: Category[] = [
  { name: 'Technology', slug: 'technology' },
  { name: 'Science', slug: 'science' },
  { name: 'Health & Wellness', slug: 'health-wellness' },
  { name: 'Business', slug: 'business' },
  { name: 'Culture', slug: 'culture' },
];

export let articles: Article[] = [
  {
    slug: 'the-future-of-ai-in-tech',
    title: 'The Future of Artificial Intelligence and Its Impact on Technology',
    author: 'Jane Doe',
    category: 'Technology',
    publicationDate: '2023-10-26',
    image: {
      id: "1",
      src: 'https://picsum.photos/seed/1/600/400',
      alt: 'Abstract AI visualization',
      aiHint: 'abstract AI'
    },
    content:
      'Artificial Intelligence is no longer a concept of science fiction; it\'s a reality that is reshaping our world. From machine learning algorithms that predict consumer behavior to natural language processing that powers our voice assistants, AI is at the heart of the most significant technological advancements of our time. This article explores the trajectory of AI development, its current applications across various industries, and the ethical considerations we must navigate as we move into an increasingly automated future. We will delve into deep learning, neural networks, and the quest for Artificial General Intelligence (AGI), providing a comprehensive overview for both tech enthusiasts and curious newcomers.',
  },
  {
    slug: 'exploring-the-cosmos',
    title: 'Exploring the Cosmos: New Discoveries in Space Exploration',
    author: 'John Smith',
    category: 'Science',
    publicationDate: '2023-10-25',
    image: {
      id: "2",
      src: 'https://picsum.photos/seed/2/600/400',
      alt: 'A colorful nebula in deep space',
      aiHint: 'nebula space'
    },
    content:
      'The final frontier continues to captivate our imagination, and recent advancements in space exploration have brought us closer to understanding the universe than ever before. This month, the James Webb Space Telescope has sent back breathtaking images of distant galaxies, revealing the birth of stars in stunning detail. Meanwhile, missions to Mars are uncovering more about the planet\'s watery past, fueling speculation about the possibility of extraterrestrial life. Join us as we journey through the latest findings, from the icy moons of Jupiter to the mysteries of dark matter, and celebrate the human ingenuity that makes these discoveries possible.',
  },
  {
    slug: 'mindfulness-in-the-digital-age',
    title: 'Mindfulness in the Digital Age: A Guide to Well-being',
    author: 'Emily White',
    category: 'Health & Wellness',
    publicationDate: '2023-10-24',
    image: {
      id: "3",
      src: 'https://picsum.photos/seed/3/600/400',
      alt: 'A person meditating peacefully outdoors',
      aiHint: 'meditation nature'
    },
    content:
      'In a world of constant notifications and digital distractions, finding a moment of peace can feel like a monumental task. Mindfulness, the practice of being present and fully aware of the current moment, offers a powerful antidote to the stress of modern life. This guide provides practical tips and techniques for incorporating mindfulness into your daily routine. We cover everything from simple breathing exercises and guided meditations to digital detox strategies and mindful technology use. Learn how to reduce anxiety, improve focus, and cultivate a deeper sense of well-being, even when you\'re surrounded by screens.',
  },
  {
    slug: 'the-rise-of-sustainable-business',
    title: 'The Rise of Sustainable Business: Profit Meets Purpose',
    author: 'Michael Brown',
    category: 'Business',
    publicationDate: '2023-10-23',
    image: {
      id: "4",
      src: 'https://picsum.photos/seed/4/600/400',
      alt: 'A green plant growing out of a pile of coins',
      aiHint: 'sustainable finance'
    },
    content:
      'A new paradigm is emerging in the corporate world, one where success is measured not just in financial returns, but also in social and environmental impact. Sustainable business practices are moving from the periphery to the core of corporate strategy as companies recognize the long-term value of environmental stewardship and social responsibility. This article examines the key drivers behind this shift, from changing consumer expectations to the increasing risks posed by climate change. We spotlight innovative companies that are leading the way in sustainability and offer insights for businesses looking to integrate purpose into their profit-making endeavors.',
  },
  {
    slug: 'from-graffiti-to-galleries',
    title: 'From Graffiti to Galleries: The Evolution of Street Art',
    author: 'Sarah Green',
    category: 'Culture',
    publicationDate: '2023-10-22',
    image: {
      id: "5",
      src: 'https://picsum.photos/seed/5/600/400',
      alt: 'A vibrant and complex graffiti mural on a brick wall',
      aiHint: 'graffiti wall'
    },
    content:
      'Once dismissed as vandalism, street art has undergone a remarkable transformation, evolving into a globally recognized and celebrated art form. Artists who once operated in the shadows are now commissioned for massive public murals and featured in prestigious art galleries. This cultural shift reflects a broader change in our perception of public space and artistic expression. We trace the history of street art from its origins in the graffiti subcultures of the 1970s to its current status as a powerful medium for social commentary and aesthetic innovation. Explore the works of pioneering artists and the movements that have defined this dynamic and accessible art form.',
  },
  {
    slug: 'quantum-computing-explained',
    title: 'Quantum Computing Explained: The Next Tech Revolution',
    author: 'David Chen',
    category: 'Technology',
    publicationDate: '2023-10-21',
    image: {
      id: "6",
      src: 'https://picsum.photos/seed/6/600/400',
      alt: 'Abstract representation of quantum bits',
      aiHint: 'quantum computing'
    },
    content:
      'Quantum computing promises to solve complex problems that are currently intractable for even the most powerful supercomputers. By harnessing the strange principles of quantum mechanics, such as superposition and entanglement, these machines operate in a fundamentally different way from classical computers. In this article, we break down the core concepts of quantum computing, explaining qubits, quantum gates, and quantum algorithms in accessible terms. We also discuss the potential applications, from developing new medicines and materials to revolutionizing finance and artificial intelligence, and look at the current state of the race to build a scalable, fault-tolerant quantum computer.',
  },
];

export const getArticleBySlug = (slug: string) => {
  return articles.find((article) => article.slug === slug);
};

export const getArticlesByCategory = (categorySlug: string) => {
    const category = categories.find(c => c.slug === categorySlug);
    if (!category) return [];
    return articles.filter((article) => article.category === category.name);
};

export const searchArticles = (query: string) => {
    if (!query) return [];
    return articles.filter(article => 
        article.title.toLowerCase().includes(query.toLowerCase()) ||
        article.content.toLowerCase().includes(query.toLowerCase())
    );
};

export const addArticle = (article: Omit<Article, 'slug' | 'publicationDate' | 'image'>) => {
  const slug = article.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
  const newArticle: Article = {
    ...article,
    slug,
    publicationDate: new Date().toISOString().split('T')[0],
    image: {
      id: String(articles.length + 1),
      src: `https://picsum.photos/seed/${articles.length + 1}/600/400`,
      alt: article.title,
      aiHint: 'placeholder image'
    }
  };
  articles.unshift(newArticle);
  return newArticle;
}
