# PowerTrainingCoach

## Overview
PowerTrainingCoach is a native mobile application that generates personalized, AI-powered training programs based on coach-reviewed plans for combat athletes. Users complete a questionnaire about their sport, goals, and schedule, then receive a detailed periodized plan complete with exercises, sets/reps and coaching notes. The app stands out from similar apps by being more tailored and specialized for combat sports.

## Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **React Native** CLI and development environment setup
  - For iOS: Xcode and CocoaPods (macOS)
  - For Android: Android Studio and Android SDK
- A Firebase project with authentication and Firestore enabled
- OpenAI API key
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
   - Configure Stripe API keys as environment variables in Firebase Cloud Functions
   - The application reads configuration from Firebase

4. **Run the development server**
   
   For iOS (macOS only):
   ```bash
   npm run ios
   ```
   
   For Android:
   ```bash
   npm run android
   ```
   
   For web preview:
   ```bash
   npm run web
   ```

### Building for Production

For iOS:
```bash
npm run build:ios
```

For Android:
```bash
npm run build:android
```

For web distribution:
```bash
npm run build
```

The web build output will be in the `dist` directory.

### Deployment

**For iOS & Android:**
Follow the standard app store and Google Play deployment processes.

**For web version:**
Deploy to Firebase Hosting:
```bash
firebase deploy
```

This will deploy both the frontend (from `dist`) and Cloud Functions.

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
  - Used with the `observer` HOC to make React components reactive to MobX state changes
  - Components: `FeedBackPresenter.jsx`, `LoginPresenter.jsx`, `MyProfilePresenter.jsx`, `AppLayout.jsx`, `SignUpPresenter.jsx`, `UpBarPresenter.jsx`

### Routing & Navigation
- **React Navigation** (planned) - Navigation library for React Native
  - Will replace react-router-dom for native navigation
  - Provides native-like navigation experience on iOS and Android

### Payment Processing
- **@stripe/react-stripe-js** (`^5.4.1`) - React components for Stripe integration
- **@stripe/stripe-js** (`^8.5.3`) - Stripe's JavaScript library
- **stripe** (`^20.1.0`) - Stripe Node.js SDK for backend payment processing
  - Used in subscription and payment features

### Backend & Database
- **Firebase** (`^12.6.0`) - Backend-as-a-Service platform
  - Authentication, Firestore database, and hosting
  - Used in service models for backend operations
- **firebase-admin** (`^13.6.0`) - Firebase Admin SDK for server-side operations
  - Used in Cloud Functions for secure backend operations

### API Integration
- **openai** (`^6.15.0`) - OpenAI API client
  - Powers the AI-driven training program generation
  - Used in `app/core/generatePlan.js` for creating personalized workout plans

### Development & Build Tools
- **Vite** (`latest`) - Modern build tool for web version
  - Configuration in `vite.config.js`
  - Provides fast HMR (Hot Module Replacement) for web development
- **@vitejs/plugin-react** (`latest`) - React plugin for Vite with JSX support
- **React Native CLI** - Build tools for native app development (iOS and Android)

## Project Structure

```
app/
├── assets/              # Images, fonts, static resources
├── components/          # Reusable UI components
├── core/                # Core application logic
│   ├── generatePlan.js  # AI-powered training plan generation
│   └── resolvePromise.js# Promise resolution utilities
├── data/                # Application data
│   ├── baseTrainingPlans/ # Base training plan templates
│   └── instructions/    # Training instruction markdown files
├── entry/               # Application entry points
│   ├── index.jsx        # Main entry point
│   └── app/             # App layout structure
├── navigation/          # Navigation/routing logic
├── screens/             # Screen implementations
│   ├── presenters/      # Business logic presenters (containers)
│   │   ├── AppPresenter.jsx
│   │   ├── LoginPresenter.jsx
│   │   ├── SignUpPresenter.jsx
│   │   ├── SubscriptionPresenter.jsx
│   │   └── ...
│   └── screens/         # Screen UI components (presentational)
│       ├── StartView.jsx
│       ├── LoginView.jsx
│       ├── SignUpView.jsx
│       ├── DayDetailView.jsx
│       └── ...
├── services/            # Business logic services
│   ├── config/          # Configuration files
│   │   ├── apiConfig.js # API configuration
│   │   └── firebase.js  # Firebase setup
│   ├── models/          # Data models and services
│   │   ├── authService.js
│   │   ├── dbService.js
│   │   ├── firebaseModel.js
│   │   ├── CombatModel.js
│   │   ├── trainingPlanService.js
│   │   └── mobxReactiveModel.js
│   └── utils/           # Utility functions
│       ├── promptBuilder.js
│       └── stripeClient.js
├── styles/              # Shared component styles
└── theme/               # Theme configuration and styling
    └── style.css
```

### Key Directories

- **`/app/core`** - Core business logic for training plan generation
- **`/app/entry`** - Application entry points and initialization
- **`/app/services`** - Business logic, data models, and external service integration
- **`/app/screens`** - UI components split into presenters (logic) and screens (views)
- **`/app/data`** - Application data including base training plans and instructions
- **`/functions`** - Firebase Cloud Functions for backend operations
- **`/scripts`** - Utility scripts for development and deployment
- **`/root`** - Web entry point (index.html)
- **`/docs`** - Documentation and instructions

