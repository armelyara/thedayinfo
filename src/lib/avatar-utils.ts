// src/lib/avatar-utils.ts

/**
 * Récupère l'URL de l'avatar de l'auteur principal depuis le profil
 * Note: Cette fonction doit être appelée côté serveur pour accéder au profil
 */
export function getAuthorAvatarFromProfile(profileImageUrl?: string, authorName?: string): string {
  // Si on a une photo de profil, l'utiliser
  if (profileImageUrl) {
    return profileImageUrl;
  }
  
  // Sinon, utiliser un avatar par défaut pour l'auteur
  if (authorName === 'Armel Yara') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=armelyara&backgroundColor=b6e3f4&eyes=default&mouth=smile';
  }
  
  // Pour les visiteurs anonymes
  const cleanName = (authorName || 'anonymous').replace(/[^a-zA-Z0-9]/g, '');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}`;
}

/**
 * Génère une URL d'avatar pour les commentaires (côté client)
 */
export function getAuthorAvatar(authorName: string): string {
  if (authorName === 'Armel Yara') {
    // Pour les commentaires, utiliser un avatar cohérent
    // La vraie photo sera affichée dans l'en-tête de l'article
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=armelyara&backgroundColor=b6e3f4&eyes=default&mouth=smile';
  }
  
  const cleanName = authorName.replace(/[^a-zA-Z0-9]/g, '');
  return `https://api.dicebear.com/7.x/initials/svg?seed=${cleanName}`;
}

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