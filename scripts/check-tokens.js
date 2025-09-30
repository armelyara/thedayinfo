// scripts/check-tokens.js
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

function initializeFirebase() {
  if (admin.apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase credentials manquantes');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
}

async function checkTokens() {
  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║       Vérification des Tokens - The Day Info             ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    initializeFirebase();
    const db = admin.firestore();
    
    console.log('📡 Connexion à Firestore...');
    const snapshot = await db.collection('subscribers').get();
    
    if (snapshot.empty) {
      console.log('ℹ️  Aucun subscriber trouvé.');
      return;
    }
    
    console.log(`📊 ${snapshot.size} subscriber(s) trouvé(s)\n`);
    
    let withToken = 0;
    let withoutToken = 0;
    const missingTokens = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.unsubscribeToken) {
        withToken++;
        console.log(`✅ ${data.email} - Token présent: ${data.unsubscribeToken.substring(0, 8)}...`);
      } else {
        withoutToken++;
        console.log(`❌ ${data.email} - Pas de token`);
        missingTokens.push(data.email);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 Résumé de la vérification:');
    console.log('='.repeat(60));
    console.log(`   ✅ Avec token: ${withToken}`);
    console.log(`   ❌ Sans token: ${withoutToken}`);
    console.log(`   📊 Total: ${snapshot.size}`);
    console.log('='.repeat(60));
    
    if (withoutToken > 0) {
      console.log('\n⚠️  Subscribers sans token:');
      missingTokens.forEach(email => console.log(`   - ${email}`));
      console.log('\n💡 Conseil: Exécute à nouveau le script de migration');
    } else {
      console.log('\n🎉 Tous les subscribers ont un token !');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

checkTokens()
  .then(() => {
    console.log('\n✨ Vérification terminée\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });