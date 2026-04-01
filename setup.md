# PowerTrainingCoach

## Overview
PowerTrainingCoach is a native mobile application that generates personalized, AI-powered training programs based on coach-reviewed plans for combat athletes. Users complete a questionnaire about their sport, goals, and schedule, then receive a detailed periodized plan complete with exercises, sets/reps and coaching notes. The app stands out from similar apps by being more tailored and specialized for combat sports.

## Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Expo / EAS** account for cloud builds
- **React Native** development environment setup
  - For iOS: Xcode and CocoaPods (macOS) if building locally
  - For Android: Android Studio and Android SDK if building locally
- A Firebase project with authentication and Firestore enabled
- OpenAI API key for Firebase Functions Secret Manager
- Stripe account for payment processing

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/FCBFAN05/powertrainingcoach.git
   cd powertrainingcoach
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Set up a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Authentication (Email/Password and Google Sign-In)
   - Create a Firestore database
   - Add `google-services.json` for Android and `GoogleService-Info.plist` for iOS
  - Configure Firebase JS SDK values with `EXPO_PUBLIC_FIREBASE_*` environment variables if you need to override the defaults in `src/services/config/firebase.js`
  - Configure Stripe client-safe values with Expo environment variables if needed
  - Stripe function endpoints default to `https://us-central1-${EXPO_PUBLIC_FIREBASE_PROJECT_ID}.cloudfunctions.net`
    and can be overridden with `EXPO_PUBLIC_STRIPE_FUNCTIONS_BASE_URL` if you use a different project or region
  - Store Stripe server secrets in Firebase Secret Manager:
    `firebase functions:secrets:set STRIPE_SECRET_KEY`
    `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`
  - Store the OpenAI server secret in Firebase Secret Manager:
    `firebase functions:secrets:set OPENAI_API_KEY`
  - Optional consultation-booking runtime env vars for Cloud Functions:
    `CONSULTATION_CHECKOUT_HOLD_MINUTES`
    `CONSULTATION_CANCELLATION_WINDOW_HOURS`
    `CONSULTATION_MAX_BOOKING_WINDOW_DAYS`
    `CONSULTATION_DEFAULT_CURRENCY`

4. **Configure Google Sign-In**
   - Provide `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - Provide `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

5. **Start the Expo development server**
   ```bash
   npx expo start --clear
   ```

   For Android:
   ```bash
   npm run android
   ```

   For iOS (macOS only):
   ```bash
   npm run ios
   ```

### EAS Builds

Log in once:
```bash
npx expo login
```

Then build with EAS:

For Android:
```bash
npm run build:android
```

For iOS:
```bash
npm run build:ios
```

### Deployment

**For iOS & Android:**
Follow the standard app store and Google Play deployment processes.

## Third-Party Components & Libraries

### Frontend Framework & UI
- **React Native** - Framework for building native mobile applications
  - Will provide iOS and Android native components
  - Shares codebase across iOS and Android platforms
  - Code migration from React to React Native is in progress

### State Management
- **MobX** (`latest`) - Reactive state management library
  - Provides reactive state management for the application
- **mobx-react-lite** (`latest`) - MobX integration for React
  - Used with the `observer` HOC to make React components reactive to MobX state changes in the native screen tree

### Routing & Navigation
- **Expo Router** - File-based routing for the native app
  - Provides navigation structure for iOS and Android

### Payment Processing
- **@stripe/stripe-react-native** - Stripe's native SDK for iOS and Android
- **stripe** (`^20.1.0`) - Stripe Node.js SDK for backend payment processing
  - Used in subscription and payment features

### Backend & Database
- **Firebase** (`12.6.0`) - Backend-as-a-Service platform
  - Authentication, Firestore database, and hosting
  - Used in service models for backend operations
- **firebase-admin** (`^13.6.0`) - Firebase Admin SDK for server-side operations
  - Used in Cloud Functions for secure backend operations

### API Integration
- **openai** (`^6.15.0`) - OpenAI API client
  - Powers the AI-driven training program generation
  - Used in `src/core/generatePlan.js` for creating personalized workout plans

### Development & Build Tools
- **Expo / Expo Router** - Native app runtime, routing, and development tooling
- **React Native CLI** - Build tools for native app development (iOS and Android)

## Project Structure

```
app/
├── _layout.jsx          # Root Expo Router layout
├── index.jsx            # Auth-aware app entry route
├── modal.jsx            # Modal route
├── (auth)/              # Authentication routes
└── (tabs)/              # Main tab routes

src/
├── assets/              # Images and static resources
├── core/                # Core application logic
│   ├── generatePlan.js
│   └── resolvePromise.js
├── data/                # Application data and templates
├── screens/             # Screen UI components
│   └── screens/
├── services/            # Business logic services
│   ├── config/
│   │   ├── apiConfig.js
│   │   ├── firebase.js
│   │   └── firebaseSdk.js
│   ├── models/
│   └── utils/
├── theme/               # Theme configuration
└── StripeProviderWrapper.jsx

functions/
└── index.js             # Firebase Cloud Functions
```

### Key Directories

- **`/app`** - Expo Router routes only
- **`/src/core`** - Core business logic for training plan generation
- **`/src/services`** - Business logic, data models, and external service integration
- **`/src/screens`** - Native application screen components
- **`/src/data`** - Application data including training plans and instructions
- **`/src/assets`** - Static app assets
- **`/functions`** - Firebase Cloud Functions for backend operations
- **`/scripts`** - Utility scripts for development and deployment
- **`/docs`** - Documentation and instructions

## Consultation Booking Backend

The backend now includes calendar-style consultation booking endpoints,
temporary slot holds during checkout, Stripe charge-at-booking checkout,
48-hour cancellation refund handling, and a scheduled reconciliation job for
expiring abandoned checkout reservations.

See [docs/consultation-booking-backend.md](docs/consultation-booking-backend.md)
for the API contract and runtime configuration.
