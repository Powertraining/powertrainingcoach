# PowerTrainingCoach

PowerTrainingCoach is an Expo/React Native app for combat-sport athletes. This README focuses on the repeatable steps needed to run and test the project locally.

One-time project setup such as Firebase project creation, native Firebase files, and the base app configuration is already in place in this repo. You only need to revisit that setup if you are intentionally switching Firebase projects or rotating local env values.

## Prerequisites

- Node.js 22 and npm
- Android Studio and an emulator if you want to run Android locally
- Xcode and CocoaPods if you want to run iOS locally on macOS
- Firebase CLI if you want to run Cloud Functions locally

## Install dependencies

```bash
npm install
npm --prefix functions install
```

If you already have the shared `.env.local`, no extra Firebase setup is needed to start developing. The repo already includes `google-services.json`, `GoogleService-Info.plist`, and default Firebase JS config values in `src/services/config/firebase.js`.

## Run the app

Start the Expo dev server:

```bash
npm start
```

Build and launch the native app:

```bash
npm run android
```

```bash
npm run ios
```

Notes:

- `npm start` starts Metro/Expo. Use it when you already have a native development build installed.
- `npm run android` and `npm run ios` create or refresh the native development build and launch it.
- Use a native development build for Google sign-in and other native integrations. Expo Go is not enough for the full app flow.

## Test

Run the committed Cloud Functions unit test:

```bash
npm --prefix functions test
```

Start the Functions emulator when you need to exercise backend endpoints locally:

```bash
npm --prefix functions run serve
```

The root `npm test` Jest script is not the reliable test entry point right now because there are no committed app Jest tests yet. The backend test above is the automated test that currently passes in this repo.

## Build

Create release builds with EAS:

```bash
npm run build:android
```

```bash
npm run build:ios
```

## Related docs

- `docs/consultation-booking-backend.md`
- `setup.md`
