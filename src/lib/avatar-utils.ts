// src/lib/avatar-utils.ts

/**
 * Génère une URL d'avatar cohérente pour un auteur donné
 * @param authorName - Le nom de l'auteur
 * @returns L'URL de l'avatar
 */
export function getAuthorAvatar(authorName: string): string {
    // Pour l'auteur principal du blog, utiliser un avatar spécifique
    if (authorName === 'Armel Yara') {
      return 'https://api.dicebear.com/7.x/avataaars/svg?seed=armelyara&backgroundColor=b6e3f4&eyes=default&mouth=smile';
    }
    
    // Pour les visiteurs anonymes ou autres utilisateurs
    const cleanName = authorName.replace(/[^a-zA-Z0-9]/g, '');
    return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}`;
  }
  
  /**
   * Génère un nom d'auteur anonyme et le stocke dans localStorage
   * @returns Le nom d'auteur anonyme
   */
  export function getAnonymousAuthorName(): string {
    if (typeof window === 'undefined') return 'Visiteur Anonyme';
  
    let authorName = localStorage.getItem('anonymous-commenter-name');
    if (!authorName) {
      const randomNumber = Math.floor(Math.random() * 10000);
      authorName = `Visiteur Anonyme #${randomNumber}`;
      localStorage.setItem('anonymous-commenter-name', authorName);
    }
    return authorName;
  }