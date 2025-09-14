# 🗄️ Complete Database Setup Guide

## 🎯 What This Database System Provides

### ✅ **User Management**
- **Secure Authentication**: Email/password login with Firebase Auth
- **User Profiles**: Username, email, balance, rank, stats
- **Account Security**: Password changes, password reset
- **User Validation**: Username uniqueness, email validation

### ✅ **Game Data Storage**
- **Real-time Balances**: All players see live balance updates
- **Game History**: Every game result saved with full details
- **Leaderboard**: Top 10 players updated in real-time
- **Statistics**: Total wagered, total won, games played

### ✅ **Admin System**
- **Rank-based Permissions**: Owner > Admin > Elite > User
- **Admin Commands**: Give money, remove money, change ranks, ban users
- **Action Logging**: All admin actions are logged with timestamps
- **Permission System**: Granular control over admin abilities

### ✅ **Real-time Features**
- **Live Leaderboard**: Updates instantly when any player's balance changes
- **Instant Notifications**: Players see results immediately
- **Multiplayer Experience**: True shared leaderboard across all players

---

## 🚀 Quick Setup (10 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name: `blocksmith-game`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Authentication
1. In the left sidebar, click "Authentication"
2. Click "Get started" button
3. Click on the "Sign-in method" tab at the top
4. Find "Email/Password" in the list and click on it
5. Toggle "Enable" to ON
6. Click "Save" at the bottom

### Step 3: Create Realtime Database
1. In the left sidebar, click "Realtime Database"
2. Click "Create Database" button
3. Choose "Start in test mode" (for development)
4. Select a location closest to your users (e.g., us-central1)
5. Click "Done"

### Step 4: Get Configuration
1. Click the gear icon (⚙️) next to "Project Overview" in the left sidebar
2. Click "Project settings"
3. Scroll down to the "Your apps" section
4. Click the "</>" (Web) icon to add a web app
5. App nickname: "blocksmith-web"
6. Check "Also set up Firebase Hosting" (optional)
7. Click "Register app"
8. Copy the `firebaseConfig` object that appears

### Step 5: Update Configuration
Replace the config in `firebase-database.js`:

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

### Step 6: Update Your HTML
Replace your current game script with:

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

## 🗂️ Database Structure

### Users Collection
```
users/
├── {uid}/
│   ├── uid: "firebase-user-id"
│   ├── username: "player1"
│   ├── email: "player1@example.com"
│   ├── balance: 1000
│   ├── rank: "user" | "elite" | "admin" | "owner"
│   ├── createdAt: "2024-01-15T10:30:00Z"
│   ├── lastLogin: "2024-01-15T10:30:00Z"
│   ├── totalWagered: 5000
│   ├── totalWon: 3000
│   ├── gamesPlayed: 25
│   ├── isActive: true
│   ├── adminPermissions: ["give_money", "remove_money"]
│   ├── lastAdminAction: "2024-01-15T10:30:00Z"
│   └── lastBalanceUpdate: "2024-01-15T10:30:00Z"
```

### Usernames Lookup
```
usernames/
├── player1: "firebase-user-id"
├── player2: "firebase-user-id"
└── admin1: "firebase-user-id"
```

### Games History
```
games/
├── {uid}/
│   ├── {gameId}/
│   │   ├── bet: 100
│   │   ├── multiplier: 2.5
│   │   ├── winnings: 250
│   │   ├── won: true
│   │   ├── mode: "Normal" | "Hot"
│   │   ├── difficulty: 1.2
│   │   ├── progress: 85.5
│   │   ├── timestamp: "2024-01-15T10:30:00Z"
│   │   └── gameId: "auto-generated-id"
```

### Admin Logs
```
adminLogs/
├── {logId}/
│   ├── adminUid: "admin-user-id"
│   ├── action: "give_money" | "remove_money" | "change_rank" | "ban_user"
│   ├── details: { targetUser: "player1", amount: 1000 }
│   └── timestamp: "2024-01-15T10:30:00Z"
```

---

## 🔐 Security Rules

### Database Rules (Firebase Console → Realtime Database → Rules)
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

---

## 👑 Admin System

### Rank Hierarchy
1. **Owner**: Full access to everything
2. **Admin**: Can manage users, give/remove money, change ranks
3. **Elite**: Special privileges (can be customized)
4. **User**: Standard player

### Admin Commands
```
.give player amount     - Give money to player
.remove player amount   - Remove money from player
.rank player rank       - Change player rank (user/elite/admin/owner)
.ban player            - Ban a player
```

### Permission System
- **give_money**: Can give money to players
- **remove_money**: Can remove money from players
- **change_rank**: Can change player ranks
- **ban_user**: Can ban/unban players

---

## 🎮 Game Features

### Real-time Updates
- **Leaderboard**: Updates instantly when any player's balance changes
- **Balance**: Your balance updates immediately after each game
- **Game History**: Saved automatically after each game

### User Experience
- **Persistent Accounts**: Login from any device
- **Secure Authentication**: Firebase handles all security
- **Password Management**: Change password, reset password
- **Account Recovery**: Email-based password reset

### Admin Experience
- **Click Balance 5 Times**: Opens admin console (for owners/admins)
- **Command Interface**: Type commands like `.give player 1000`
- **Action Logging**: All admin actions are logged
- **Permission Checking**: Only authorized users can use admin features

---

## 📊 Analytics & Monitoring

### Firebase Console Features
- **Authentication**: See user sign-ups, logins
- **Database**: Monitor reads/writes, storage usage
- **Performance**: Track loading times, errors
- **Usage**: See daily/monthly active users

### Custom Analytics
- **Game Statistics**: Total games played, total wagered
- **User Behavior**: Most active players, average session time
- **Admin Actions**: Track all administrative actions

---

## 💰 Pricing & Limits

### Firebase Free Tier
- **Database**: 1GB storage
- **Reads**: 50,000/day
- **Writes**: 50,000/day
- **Authentication**: Unlimited users
- **Hosting**: 10GB bandwidth/month

### Estimated Usage
- **1,000 active players**: ~$5-10/month
- **10,000 active players**: ~$50-100/month
- **100,000 active players**: ~$500-1000/month

---

## 🚀 Deployment Steps

### 1. Local Testing
```bash
# Test with Firebase emulator
firebase emulators:start
```

### 2. Deploy to Production
```bash
# Deploy to Firebase Hosting
firebase deploy
```

### 3. Custom Domain
1. Buy domain from Namecheap/GoDaddy
2. Add custom domain in Firebase Hosting
3. Update DNS settings

---

## 🔧 Troubleshooting

### Common Issues
- **"Permission denied"**: Check Firebase security rules
- **"User not found"**: Verify username exists in database
- **"Insufficient permissions"**: Check user rank and permissions
- **Slow loading**: Optimize database queries

### Debug Commands
```javascript
// Check current user
console.log(game.currentUser);

// Check database connection
console.log(blocksmithDB);

// Test admin permissions
console.log(await blocksmithDB.checkAdminPermission(uid, 'give_money'));
```

---

## 🎯 Next Steps

1. **Set up Firebase project**
2. **Update configuration files**
3. **Test locally**
4. **Deploy to GitHub Pages/Netlify**
5. **Share with friends!**

Your game will now have:
- ✅ **Real multiplayer leaderboard**
- ✅ **Secure user accounts**
- ✅ **Admin management system**
- ✅ **Persistent data storage**
- ✅ **Real-time updates**
