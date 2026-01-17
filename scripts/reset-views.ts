// One-time script to reset all article view counts to 0
// This removes the inflated view counts from the old auto-increment logic

import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../src/lib/auth';

async function resetViews() {
  console.log("🔄 Initializing Firebase Admin...");
  await initializeFirebaseAdmin();
  const db = getFirestore();

  console.log("📚 Fetching all articles...");
  const articlesRef = db.collection("articles");
  const snapshot = await articlesRef.get();

  if (snapshot.empty) {
    console.log("❌ No articles found!");
    return;
  }

  console.log(`📊 Found ${snapshot.size} articles`);

  // Firestore has a limit of 500 operations per batch
  const batches: any[] = [];
  let currentBatch = db.batch();
  let operationCount = 0;
  let totalArticles = 0;

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const currentViews = data.views || 0;

    // Reset views and viewHistory only (likes/dislikes removed from codebase)
    currentBatch.update(docSnapshot.ref, {
      views: 0,
      viewHistory: [],
    });

    console.log(`  📄 ${docSnapshot.id}: views=${currentViews} → 0`);

    operationCount++;
    totalArticles++;

    // If we've hit 500 operations, start a new batch
    if (operationCount === 500) {
      batches.push(currentBatch);
      currentBatch = db.batch();
      operationCount = 0;
    }
  });

  // Add the last batch if it has operations
  if (operationCount > 0) {
    batches.push(currentBatch);
  }

  console.log(`\n💾 Committing ${batches.length} batch(es) to Firestore...`);

  // Commit all batches
  for (let i = 0; i < batches.length; i++) {
    await batches[i].commit();
    console.log(`  ✅ Batch ${i + 1}/${batches.length} committed`);
  }

  console.log(`\n✅ Successfully reset ${totalArticles} articles!`);
  console.log("   - All views set to 0");
  console.log("   - All viewHistory cleared");
  console.log("\n🎉 View tracking will now start fresh with accurate counts!");

  process.exit(0);
}

resetViews().catch((error) => {
  console.error("❌ Error resetting views:", error);
  process.exit(1);
});
