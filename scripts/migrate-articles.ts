import { config } from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { initializeFirebaseAdmin } from '@/lib/auth';
import { getFirestore } from 'firebase-admin/firestore';

async function migrateArticles() {
  console.log('Démarrage de la migration...');
  
  await initializeFirebaseAdmin();
  const db = getFirestore();
  
  const articlesSnapshot = await db.collection('articles').get();
  
  console.log(`📊 ${articlesSnapshot.docs.length} articles trouvés`);
  
  const batch = db.batch();
  let count = 0;
  
  articlesSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    
    // Ajouter les champs manquants
    const updates: any = {};
    
    if (data.likes === undefined) {
      updates.likes = 0;
      console.log(`  • Article "${data.title}" : ajout likes`);
    }
    
    if (data.dislikes === undefined) {
      updates.dislikes = 0;
      console.log(`  • Article "${data.title}" : ajout dislikes`);
    }
    
    if (!data.viewHistory || data.viewHistory.length === 0) {
      updates.viewHistory = [];
      console.log(`  • Article "${data.title}" : ajout viewHistory`);
    }
    
    if (Object.keys(updates).length > 0) {
      batch.update(doc.ref, updates);
      count++;
    }
  });
  
  if (count > 0) {
    await batch.commit();
    console.log(`\n${count} articles migrés avec succès`);
  } else {
    console.log('\nTous les articles sont déjà à jour');
  }
  
  process.exit(0);
}

migrateArticles().catch((error) => {
  console.error('Erreur lors de la migration:', error);
  process.exit(1);
});