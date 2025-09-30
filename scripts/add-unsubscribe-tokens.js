// scripts/add-unsubscribe-tokens.js
// scripts/add-unsubscribe-tokens.js
require('dotenv').config({ path: '.env.local' }); // ← Ajouter cette ligne EN PREMIER

const admin = require('firebase-admin');
const crypto = require('crypto');

// Initialiser Firebase Admin
function initializeFirebase() {
  if (admin.apps.length === 0) {
    // Utiliser les credentials depuis les variables d'environnement
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase credentials manquantes dans les variables d\'environnement');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    
    console.log('✅ Firebase Admin initialisé');
  }
}

async function addTokensToSubscribers() {
  try {
    console.log('🚀 Début de la migration...\n');
    
    initializeFirebase();
    const db = admin.firestore();
    
    // Récupérer tous les subscribers
    const snapshot = await db.collection('subscribers').get();
    
    if (snapshot.empty) {
      console.log('ℹ️  Aucun subscriber trouvé dans la base de données.');
      return;
    }
    
    console.log(`📊 ${snapshot.size} subscriber(s) trouvé(s)\n`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Traiter chaque subscriber
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Vérifier si le token existe déjà
      if (data.unsubscribeToken) {
        console.log(`⏭️  ${data.email} - Token déjà présent, ignoré`);
        skippedCount++;
        continue;
      }
      
      // Générer un nouveau token
      const token = crypto.randomBytes(32).toString('hex');
      
      // Mettre à jour le document
      await doc.ref.update({ 
        unsubscribeToken: token 
      });
      
      console.log(`✅ ${data.email} - Token ajouté: ${token.substring(0, 8)}...`);
      updatedCount++;
    }
    
    console.log('\n📈 Résumé de la migration:');
    console.log(`   ✅ Mis à jour: ${updatedCount}`);
    console.log(`   ⏭️  Ignorés: ${skippedCount}`);
    console.log(`   📊 Total: ${snapshot.size}`);
    console.log('\n🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
addTokensToSubscribers()
  .then(() => {
    console.log('\n✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });