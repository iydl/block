# 🔥 Firebase Setup - Super Simple Guide

## 🎯 What We're Doing
We're going to create a free database for your game so players can:
- Create accounts
- Save their money
- See a shared leaderboard
- Use admin commands

---

## 📱 Step 1: Go to Firebase

1. **Open your web browser**
2. **Type this URL**: `https://console.firebase.google.com/`
3. **Press Enter**

You should see a page that says "Firebase" with a "Get started" button.

---

## 🆕 Step 2: Create Project

1. **Click the blue "Get started" button**
2. **Click "Create a project"** (blue button)
3. **Project name**: Type `blocksmith-game`
4. **Click "Continue"**
5. **Google Analytics**: Click "Enable Google Analytics" (or disable if you don't want it)
6. **Click "Continue"**
7. **Click "Create project"**
8. **Wait for it to finish** (takes 1-2 minutes)
9. **Click "Continue"**

---

## 🔐 Step 3: Enable Login System

1. **Look at the left side menu** - you should see a list
2. **Click "Authentication"** (it has a key icon 🔑)
3. **Click "Get started"** (blue button)
4. **Click "Sign-in method"** (tab at the top)
5. **Find "Email/Password"** in the list
6. **Click on "Email/Password"**
7. **Turn ON the "Enable" switch** (toggle it to the right)
8. **Click "Save"**

You should see a green checkmark next to "Email/Password"

---

## 🗄️ Step 4: Create Database

1. **Click "Realtime Database"** in the left menu (it has a database icon 🗄️)
2. **Click "Create Database"** (blue button)
3. **Choose "Start in test mode"** (this is safe for now)
4. **Click "Next"**
5. **Choose a location** (pick the one closest to you):
   - **us-central1** (United States)
   - **europe-west1** (Europe)
   - **asia-southeast1** (Asia)
6. **Click "Done"**

You should see a URL that looks like: `https://blocksmith-game-default-rtdb.firebaseio.com/`

---

## ⚙️ Step 5: Get Your Code

1. **Look for a gear icon ⚙️** next to "Project Overview" in the left menu
2. **Click the gear icon**
3. **Click "Project settings"**
4. **Scroll down** until you see "Your apps"
5. **Click the "</>" icon** (Web app icon)
6. **App nickname**: Type `blocksmith-web`
7. **Click "Register app"**
8. **Copy the code** that looks like this:

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

9. **Click "Continue to console"**

---

## 🔧 Step 6: Update Your Game

1. **Open your `firebase-database.js` file**
2. **Find this section** (around line 15):

```javascript
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};
```

3. **Replace it** with the code you copied from Step 5
4. **Save the file**

---

## 🔒 Step 7: Set Security Rules

1. **Go back to Firebase** (in your browser)
2. **Click "Realtime Database"** in the left menu
3. **Click "Rules"** (tab at the top)
4. **Replace all the text** with this:

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

5. **Click "Publish"**

---

## ✅ Step 8: Test Your Game

1. **Open your `index.html` file** in your browser
2. **Click "Register"**
3. **Create an account**:
   - Username: `testuser`
   - Email: `test@example.com`
   - Password: `password123`
4. **Click "Create Account"**
5. **You should be logged in!**

### Test Admin Console:
1. **Click on your balance 5 times quickly**
2. **Admin console should open**
3. **Try typing**: `.give testuser 1000`
4. **Press Enter**

---

## 🎉 You're Done!

Your game now has:
- ✅ **User accounts** that save
- ✅ **Real-time leaderboard**
- ✅ **Admin commands**
- ✅ **Persistent data**

---

## 🆘 If Something Goes Wrong

### Problem: "Firebase not defined"
**Solution**: Make sure you updated the config in `firebase-database.js`

### Problem: "Permission denied"
**Solution**: Make sure you copied the security rules in Step 7

### Problem: "Authentication failed"
**Solution**: Make sure Email/Password is enabled in Step 3

### Problem: "Admin console not opening"
**Solution**: 
- Make sure you're logged in
- Click balance 5 times quickly
- Only the first user becomes "Owner"

---

## 📞 Need Help?

If you get stuck on any step, just tell me:
1. **Which step** you're on
2. **What you see** on your screen
3. **What error** (if any) you're getting

I'll help you through it! 🚀
