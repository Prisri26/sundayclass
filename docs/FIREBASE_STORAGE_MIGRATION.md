# Firebase Storage Migration

Sundayclass now uses Firebase Storage for media uploads instead of Cloudinary.

## What moved

- Church branding logo uploads
- Student profile photo uploads
- Mobile spotlight photo uploads

## Required setup

1. Enable **Firebase Storage** in your Firebase project.
2. Publish the storage rules from [`/Users/prisri/Documents/Sundayclass/storage.rules`](/Users/prisri/Documents/Sundayclass/storage.rules).
3. Make sure your Firebase app config includes:
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` if you later move mobile config to env

## Deploy rules

If Firebase CLI is configured:

```bash
firebase deploy --only storage
```

## Fresh-start recommendation

If you want a true clean start:

1. Create a fresh Firebase project
2. Enable Auth, Firestore, and Storage
3. Apply `firestore.rules`
4. Apply `storage.rules`
5. Update website/mobile/Vercel Firebase env vars
6. Start onboarding again from scratch
