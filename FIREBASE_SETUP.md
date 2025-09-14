# Firebase Setup Guide for Blocksmith Game

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: "blocksmith-game"
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In Firebase Console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

### Step 3: Create Realtime Database
1. Go to "Realtime Database"
2. Click "Create Database"
3. Choose "Start in test mode" (for development)
4. Select a location (choose closest to your users)
5. Click "Done"

### Step 4: Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps"
3. Click "Web" icon (</>)
4. Enter app nickname: "blocksmith-web"
5. Click "Register app"
6. Copy the `firebaseConfig` object

### Step 5: Update Configuration
Replace the config in `firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-actual-app-id"
};
```

### Step 6: Install Firebase SDK
Add to your HTML `<head>`:

```html
<!-- Firebase SDK -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
  import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
</script>
```

## 🔒 Security Rules

### Database Rules
In Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "leaderboard": {
      ".read": "auth != null",
      ".write": false
    },
    "games": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    }
  }
}
```

## 📊 Database Structure

```
blocksmith-game/
├── users/
│   ├── {uid}/
│   │   ├── username: "player1"
│   │   ├── email: "player1@example.com"
│   │   ├── balance: 1000
│   │   ├── rank: "user"
│   │   ├── totalWagered: 5000
│   │   ├── totalWon: 3000
│   │   └── gamesPlayed: 25
├── games/
│   ├── {uid}/
│   │   ├── {gameId}/
│   │   │   ├── bet: 100
│   │   │   ├── multiplier: 2.5
│   │   │   ├── won: true
│   │   │   ├── winnings: 250
│   │   │   └── timestamp: "2024-01-15T10:30:00Z"
```

## 💰 Pricing

### Free Tier Limits
- **Database**: 1GB storage
- **Reads**: 50,000/day
- **Writes**: 50,000/day
- **Authentication**: Unlimited users
- **Hosting**: 10GB bandwidth/month

### Paid Plans
- **Blaze Plan**: Pay-as-you-go
- **Database**: $0.18/GB/month after 1GB
- **Reads**: $0.06 per 100,000 after free tier
- **Writes**: $0.18 per 100,000 after free tier

## 🚀 Deployment Options

### Option 1: Firebase Hosting (Free)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Option 2: Netlify (Free)
1. Connect GitHub repository
2. Build command: (none needed)
3. Publish directory: (your project folder)
4. Deploy automatically on push

### Option 3: Vercel (Free)
1. Connect GitHub repository
2. Framework: Static Site
3. Deploy automatically

## 🔧 Integration Steps

1. **Replace localStorage with Firebase API**
2. **Update authentication system**
3. **Implement real-time leaderboard**
4. **Add proper error handling**
5. **Test with multiple users**

## 📱 Mobile App Potential

Firebase also supports:
- **iOS/Android apps**
- **React Native**
- **Flutter**
- **Unity games**

## 🛡️ Security Best Practices

1. **Enable App Check** (prevents abuse)
2. **Set up proper database rules**
3. **Use HTTPS only**
4. **Implement rate limiting**
5. **Monitor usage in Firebase Console**

## 📈 Scaling Considerations

- **Database sharding** for millions of users
- **CDN** for global performance
- **Caching** for frequently accessed data
- **Background functions** for complex operations
