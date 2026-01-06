# PowerTrainingCoach

## Team Members
- **Melvin Emanuel Trösch**, 202914: Project Coordination, API (OpenAI, Stripe)
- **William Max Antoine Weber**, 203801: Views and Presenters
- **Ilyes Rouibi**, 202995: Firebase (Authentication, Storage, Persistence, Deployment)
- **Lucas Bourgos**, 185631: Views and Presenters

## Overview
PowerTrainingCoach is a web application that generates personalized, AI-powered training programs for combat athletes. Users complete a questionnaire about their sport, goals, and schedule, then receive a detailed periodized plan complete with exercises, sets/reps, coaching notes, and embedded YouTube tutorial videos.

## Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- A Firebase project with authentication and Firestore enabled
- OpenAI API key
- Stripe account for payment processing

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lburgos-rouibi-trosch-wmaweber-HT25-Project
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
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:8080`

### Building for Production

```bash
npm run build
```

The built files will be output to the `dist` directory.

### Deployment

Deploy to Firebase Hosting:
```bash
firebase deploy
```

This will deploy both the frontend (from `dist`) and Cloud Functions.

## Third-Party Components & Libraries

### Frontend Framework & UI
- **React** (`^latest`) - UI library for building interactive user interfaces
  - Used throughout the application for component-based architecture
  - Features: `useState`, `useEffect`, `useMemo` hooks in presenters and views

### State Management
- **MobX** (`latest`) - Reactive state management library
  - Provides reactive state management for the application
- **mobx-react-lite** (`latest`) - MobX integration for React
  - Used with the `observer` HOC to make React components reactive to MobX state changes
  - Components: `FeedBackPresenter.jsx`, `LoginPresenter.jsx`, `MyProfilePresenter.jsx`, `AppLayout.jsx`, `SignUpPresenter.jsx`, `UpBarPresenter.jsx`

### Routing
- **react-router-dom** (`latest`) - Client-side routing library
  - Provides navigation between different views (`Outlet`, `useLocation` hooks)
  - Used in `AppLayout.jsx` for page navigation

### Payment Processing
- **@stripe/react-stripe-js** (`^5.4.1`) - React components for Stripe integration
- **@stripe/stripe-js** (`^8.5.3`) - Stripe's JavaScript library
- **stripe** (`^20.1.0`) - Stripe Node.js SDK for backend payment processing
  - Used in `SubscriptionPlanView.jsx` for checkout sessions
  - Used in `PaymentSuccessView.jsx` for customer portal management

### Backend & Database
- **Firebase** (`^12.6.0`) - Backend-as-a-Service platform
  - Authentication, Firestore database, and hosting
  - Used in `src/models/firebaseModel.js`, `src/config/firebase.js`
- **firebase-admin** (`^13.6.0`) - Firebase Admin SDK for server-side operations
  - Used in Cloud Functions for secure backend operations

### API Integration
- **openai** (`^6.15.0`) - OpenAI API client
  - Powers the AI-driven training program generation
  - Used in `src/generatePlan.js` for creating personalized workout plans

### Development & Build Tools
- **Vite** (`latest`) - Modern build tool and development server
  - Configuration in `vite.config.js`
  - Provides fast HMR (Hot Module Replacement) for development
- **@vitejs/plugin-react** (`latest`) - React plugin for Vite with JSX support

## Project Structure

- **`/src`** - Main application source code
  - **`/reactjs`** - React presenters and layout components
  - **`/views`** - View components for different pages
  - **`/models`** - Business logic and service classes
  - **`/config`** - Configuration files (Firebase, API)
  - **`/utils`** - Utility functions (Stripe, prompt building)
  - **`/instructions`** - Training instruction markdown files
  - **`style.css`** - Global styles
- **`/functions`** - Firebase Cloud Functions for backend operations
- **`/test`** - Test files and test data
- **`vite.config.js`** - Vite build configuration
- **`jest.config.cjs`** - Jest testing configuration
- **`firebase.json`** - Firebase hosting and functions configuration

