# Sunday School Attendance System — Firebase Setup Guide

## 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it `sunday-school-attendance` (or anything you like)
4. Disable Google Analytics (optional) → **Create project**

---

## 2. Enable Authentication

1. In the Firebase console, click **Authentication** → **Get started**
2. Click the **"Email/Password"** provider → Enable → Save
3. Go to **Users** tab → **Add user**
4. Create your admin/teacher account(s) with email & password

---

## 3. Create Firestore Database

1. Click **Firestore Database** → **Create database**
2. Choose **Production mode** (we'll set rules next)
3. Select a Cloud Firestore location close to you → **Enable**

---

## 4. Apply Security Rules

1. In Firestore, click the **Rules** tab
2. Replace the content with the contents of `firestore.rules` in the project root
3. Click **Publish**

---

## 5. Get Your Firebase Config

1. In Firebase console → **Project Settings** (gear icon)
2. Scroll to **"Your apps"** section
3. Click **"Add app"** → Choose **Web** `</>`
4. Register the app → Copy the `firebaseConfig` object

You'll see something like:
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

---

## 6. Add Config to the Website

Open `website/.env.local` and fill in your values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## 7. Add Config to the Mobile App

Open `mobile/lib/firebase.ts` and replace the placeholder values:

```ts
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  ...
};
```

---

## Running Locally

### Website
```bash
cd website
npm run dev
# Open http://localhost:3000
```

### Mobile App
```bash
cd mobile
npx expo start
# Press 'i' for iOS or 'a' for Android simulator
# Or scan QR code with Expo Go app
```

---

## Deployment

### Website → Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd website
vercel

# Add environment variables in the Vercel dashboard under:
# Project → Settings → Environment Variables
# (Same keys as .env.local)
```

### Mobile App → Expo (EAS Build)
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
cd mobile
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Publish OTA update
eas update
```

---

## Realtime Sync — How It Works

The website uses Firestore `onSnapshot()` listeners. This means:

- When a teacher saves attendance on the mobile app →
- Firestore updates the `attendance` collection →
- The website dashboard receives the update **instantly** via the listener →
- The stats cards and charts update **without any page refresh** ✅

No polling or manual refresh needed!
