# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "cultural-annotation-tool")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Enable Firestore Database

1. In the Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database
5. Click "Done"

## 3. Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Click "Web" icon to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

## 4. Update Configuration

Replace the placeholder values in `firebase-config.js` with your actual Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-actual-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-actual-sender-id",
    appId: "your-actual-app-id"
};
```

## 5. Configure Firestore Security Rules (Optional)

For production use, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /cultural_annotations/{document} {
      allow read, write: if true; // Adjust based on your security needs
    }
  }
}
```

## 6. Deploy to GitHub Pages

1. Push your code to a GitHub repository
2. Go to repository Settings > Pages
3. Select "GitHub Actions" as the source
4. The workflow will automatically deploy your site

Your annotation tool will be available at: `https://yourusername.github.io/repository-name`