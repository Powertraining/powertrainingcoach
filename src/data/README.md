# Base Training Plans

This folder contains template training plans that should be uploaded to Firebase Storage.

## Structure

Each training plan is a JSON file with the following structure:

```json
{
  "name": "Plan Name",
  "description": "Description of the plan",
  "sport": ["Boxing", "MMA", "BJJ"],  // Array of supported sports
  "sessionsPerWeek": 3,                // Number (1-5)
  "goal": ["strength", "power"],       // Array: strength, power, hypertrophy
  "experience": ["beginner", "intermediate", "advanced", "all"],
  "summary": "Short summary for the overview",
  "weeks": [
    {
      "week": 1,
      "days": [
        {
          "day": 1,
          "exercises": [
            {
              "name": "Exercise Name",
              "sets": "4",
              "reps": "8",
              "notes": "Instructions"
            }
          ]
        }
      ]
    }
  ]
}
```

## Uploading to Firebase Storage

### Option 1: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (powertrainingcoach)
3. Navigate to **Storage** in the left sidebar
4. Create a folder called `baseTrainingPlans`
5. Upload each `.json` file to this folder

### Option 2: Using Firebase CLI

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Upload files using gsutil (comes with Google Cloud SDK)
gsutil cp baseTrainingPlans/*.json gs://powertrainingcoach.firebasestorage.app/baseTrainingPlans/
```

### Option 3: Using the Firebase Admin SDK (Node.js script)

Create a script `uploadPlans.js`:

```javascript
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize with your service account
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: 'powertrainingcoach.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function uploadPlans() {
  const plansDir = './baseTrainingPlans';
  const files = fs.readdirSync(plansDir).filter(f => f.endsWith('.json'));
  
  for (const file of files) {
    const filePath = path.join(plansDir, file);
    await bucket.upload(filePath, {
      destination: `baseTrainingPlans/${file}`,
      metadata: {
        contentType: 'application/json'
      }
    });
    console.log(`Uploaded: ${file}`);
  }
}

uploadPlans().then(() => console.log('Done!'));
```

## Firebase Storage Rules

Make sure your Firebase Storage rules allow reading the training plans:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read access to base training plans for authenticated users
    match /baseTrainingPlans/{planPath=**} {
      allow read: if request.auth != null;
    }

    // Allow read access to live prompt instructions and images
    match /instructions/{instructionPath=**} {
      allow read: if request.auth != null;
    }
  }
}
```

## Filtering Logic

Plans are filtered based on user's questionnaire inputs:

- **Sport**: Matches if the plan's `sport` array contains the user's selected sport, "all", or "general"
- **Sessions per week**: Matches if within ±1 of the user's preference
- **Goal**: Matches if the plan's `goal` array contains the user's selected goal or "general"
- **Experience**: Matches if the plan's `experience` array contains the user's level or "all"

## Current Plans

| File | Name | Sports | Days | Goals |
|------|------|--------|------|-------|
| `boxing_strength_3days.json` | Boxing Strength Foundation | Boxing, MMA, Muay Thai | 3 | Strength, Power |
| `bjj_hypertrophy_4days.json` | BJJ Hypertrophy Builder | BJJ, Wrestling, Judo, MMA | 4 | Hypertrophy |
| `mma_general_5days.json` | MMA Complete Fighter | All sports | 5 | Strength, Power, Hypertrophy |
