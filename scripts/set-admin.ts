/**
 * One-shot script: grant the `admin: true` custom claim to a Firebase user.
 *
 * Usage (run locally, never in the app):
 *   FIREBASE_SERVICE_ACCOUNT='<json>' npx tsx scripts/set-admin.ts <uid|email>
 *
 * After running, the user must SIGN OUT and SIGN IN again so their new session
 * cookie carries the claim (existing cookies/tokens are not retroactively
 * updated). Verify with: the token's `admin` field should be true.
 */
import admin from 'firebase-admin';

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: npx tsx scripts/set-admin.ts <uid|email>');
    process.exit(1);
  }

  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!sa) {
    console.error('FIREBASE_SERVICE_ACCOUNT env var is required.');
    process.exit(1);
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(sa)) });
  }

  const user = target.includes('@')
    ? await admin.auth().getUserByEmail(target)
    : await admin.auth().getUser(target);

  await admin.auth().setCustomUserClaims(user.uid, { admin: true });

  console.log(`OK: admin=true set for uid=${user.uid} (${user.email ?? 'no email'}).`);
  console.log('Now sign out and sign in again to refresh the session cookie.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
