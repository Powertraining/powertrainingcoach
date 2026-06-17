/**
 * Script to upload training plans to Firebase Storage
 * 
 * Prerequisites:
 * 1. Install firebase-admin: npm install firebase-admin
 * 2. Download service account key from Firebase Console
 *    - Go to Project Settings > Service Accounts
 *    - Click "Generate new private key"
 *    - Save as serviceAccountKey.json in project root
 * 
 * Usage: node scripts/uploadTrainingPlans.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Check for service account key
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Error: serviceAccountKey.json not found');
  console.log('\nPlease download your service account key from Firebase Console:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Select your project (powertrainingcoach)');
  console.log('3. Go to Project Settings > Service Accounts');
  console.log('4. Click "Generate new private key"');
  console.log('5. Save the file as serviceAccountKey.json in the project root');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'power-training-coach.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function uploadPlans() {
  const plansDir = path.join(__dirname, '..', 'src/data/baseTrainingPlans');
  
  // Get all JSON files
  const files = fs.readdirSync(plansDir).filter(f => f.endsWith('.json'));
  
  if (files.length === 0) {
    console.log('No training plan files found in src/data/baseTrainingPlans/');
    return;
  }

  console.log(`Found ${files.length} training plan(s) to upload...\n`);

  for (const file of files) {
    const filePath = path.join(plansDir, file);
    const destination = `baseTrainingPlans/${file}`;
    
    try {
      await bucket.upload(filePath, {
        destination: destination,
        metadata: {
          contentType: 'application/json',
          cacheControl: 'public, max-age=3600'
        }
      });
      console.log(`✅ Uploaded: ${file}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    }
  }
  
  console.log('\n✨ Upload complete!');
  console.log('\nNext step: Set CORS on your bucket by running:');
  console.log('gsutil cors set cors.json gs://power-training-coach.firebasestorage.app');
}

uploadPlans().catch(console.error);
