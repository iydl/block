# 🔥 Firebase Setup - Detailed Step-by-Step Guide

## 📋 Prerequisites
- Google account
- 10 minutes of time
- Your game files ready

---

## 🚀 Step 1: Create Firebase Project

### 1.1 Go to Firebase Console
1. Open your browser and go to: https://console.firebase.google.com/
2. Sign in with your Google account

### 1.2 Create New Project
1. Click the **"Create a project"** button (blue button)
2. **Project name**: Enter `blocksmith-game`
3. **Google Analytics**: 
   - Toggle ON (recommended for tracking users)
   - Or toggle OFF if you don't want analytics
4. Click **"Continue"**

### 1.3 Configure Analytics (if enabled)
1. **Analytics account**: Choose "Default Account for Firebase"
2. **Analytics location**: Choose your country/region
3. **Data sharing**: Accept terms (required)
4. Click **"Create project"**

### 1.4 Wait for Setup
- Firebase will create your project (takes 1-2 minutes)
- Click **"Continue"** when ready

---

## 🔐 Step 2: Enable Authentication

### 2.1 Navigate to Authentication
1. In the **left sidebar**, look for "Authentication"
2. Click on **"Authentication"**

### 2.2 Get Started with Auth
1. You'll see a "Get started" button
2. Click **"Get started"**

### 2.3 Configure Sign-in Methods
1. Click on the **"Sign-in method"** tab at the top
2. You'll see a list of sign-in providers

### 2.4 Enable Email/Password
1. Find **"Email/Password"** in the list
2. Click on **"Email/Password"**
3. Toggle the **"Enable"** switch to **ON**
4. Click **"Save"** at the bottom

### 2.5 Verify Setup
- You should see "Email/Password" with a green checkmark
- This means authentication is now enabled

---

## 🗄️ Step 3: Create Realtime Database

### 3.1 Navigate to Database
1. In the **left sidebar**, click **"Realtime Database"**

### 3.2 Create Database
1. Click the **"Create Database"** button
2. **Security rules**: Choose **"Start in test mode"**
   - This allows read/write access for development
   - We'll secure it later
3. Click **"Next"**

### 3.3 Choose Location
1. **Database location**: Choose the location closest to your users
   - **us-central1** (Iowa, USA) - Good for North America
   - **europe-west1** (Belgium) - Good for Europe
   - **asia-southeast1** (Singapore) - Good for Asia
2. Click **"Done"**

### 3.4 Verify Database
- You should see your database URL
- It will look like: `https://blocksmith-game-default-rtdb.firebaseio.com/`

---

## ⚙️ Step 4: Get Configuration Code

### 4.1 Open Project Settings
1. Look for the **gear icon (⚙️)** next to "Project Overview" in the left sidebar
2. Click on the **gear icon**
3. Click **"Project settings"**

### 4.2 Add Web App
1. Scroll down to the **"Your apps"** section
2. Look for the **"</>"** icon (Web app icon)
3. Click the **"</>"** icon

### 4.3 Register Web App
1. **App nickname**: Enter `blocksmith-web`
2. **Firebase Hosting**: 
   - Check the box if you want free hosting
   - Or leave unchecked if using GitHub Pages
3. Click **"Register app"**

### 4.4 Copy Configuration
1. You'll see a code block with `firebaseConfig`
2. **Copy the entire config object** (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "blocksmith-game.firebaseapp.com",
  databaseURL: "https://blocksmith-game-default-rtdb.firebaseio.com",
  projectId: "blocksmith-game",
  storageBucket: "blocksmith-game.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### 4.5 Continue Setup
1. Click **"Continue to console"**
2. You can close the setup instructions

---

## 🔧 Step 5: Update Your Game Files

### 5.1 Update Firebase Configuration
1. Open your `firebase-database.js` file
2. Find this section:
```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    // ... etc
};
```

3. Replace it with your actual config from Step 4.4

### 5.2 Update HTML File
1. Open your `index.html` file
2. Replace the current script tags with:

```html
<!-- Firebase SDK -->
<script type="module">
  import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
  import { getDatabase } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';
  import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
</script>

<!-- Your Game Scripts -->
<script type="module" src="firebase-database.js"></script>
<script type="module" src="game-with-database.js"></script>
<script type="module">
  import { BlocksmithGameWithDatabase } from './game-with-database.js';
  
  let game;
  document.addEventListener('DOMContentLoaded', () => {
    game = new BlocksmithGameWithDatabase();
  });
</script>
```

---

## 🔒 Step 6: Set Up Security Rules

### 6.1 Navigate to Database Rules
1. Go to **"Realtime Database"** in the left sidebar
2. Click on the **"Rules"** tab

### 6.2 Update Rules
1. Replace the existing rules with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "usernames": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "games": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": "auth != null && auth.uid == $uid"
      }
    },
    "adminLogs": {
      ".read": "auth != null && root.child('users').child(auth.uid).child('rank').val() in ['admin', 'owner']",
      ".write": "auth != null && root.child('users').child(auth.uid).child('rank').val() in ['admin', 'owner']"
    }
  }
}
```

2. Click **"Publish"**

---

## ✅ Step 7: Test Your Setup

### 7.1 Open Your Game
1. Open `index.html` in your browser
2. You should see the login/register form

### 7.2 Create First Account
1. Click **"Register"**
2. Enter a username, email, and password
3. Click **"Create Account"**
4. **Important**: The first user automatically becomes the **Owner**!

### 7.3 Test Admin Console
1. After logging in, click on your balance **5 times quickly**
2. The admin console should open
3. Try a command like `.give yourusername 1000`

### 7.4 Check Firebase Console
1. Go back to Firebase Console
2. Click **"Realtime Database"** → **"Data"** tab
3. You should see your user data and any games played

---

## 🚨 Troubleshooting

### Problem: "Firebase not defined"
**Solution**: Make sure you're using the updated HTML with Firebase SDK imports

### Problem: "Permission denied"
**Solution**: Check that you've updated the database rules in Step 6

### Problem: "Authentication failed"
**Solution**: Verify that Email/Password is enabled in Authentication settings

### Problem: "Database not found"
**Solution**: Make sure you've created the Realtime Database and copied the correct URL

### Problem: "Admin console not opening"
**Solution**: 
- Make sure you're logged in
- Click the balance 5 times quickly (within 3 seconds)
- Only owners and admins can access the admin console

---

## 🎯 What You Should See

### In Firebase Console:
- **Authentication** → **Users**: Your registered users
- **Realtime Database** → **Data**: User data, games, leaderboard
- **Project Settings**: Your configuration

### In Your Game:
- **Login/Register forms** working
- **Real-time leaderboard** updating
- **Admin console** accessible (for owners/admins)
- **Game history** saving
- **Balances** persisting across sessions

---

## 🚀 Next Steps

1. **Test thoroughly** with multiple accounts
2. **Deploy to GitHub Pages** (see DEPLOYMENT_GUIDE.md)
3. **Share with friends** to test multiplayer features
4. **Monitor usage** in Firebase Console

Your game now has a complete database system with real-time multiplayer features! 🎉
