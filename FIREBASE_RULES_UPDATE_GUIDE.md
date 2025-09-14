# Firebase Security Rules Update Guide

## Problem
The leaderboard is showing "permission_denied" because the current Firebase security rules don't allow reading all users' data for the leaderboard.

## Solution
Update the Firebase security rules to allow authenticated users to read the users collection for leaderboard purposes.

## Steps to Fix

### 1. Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `block-abd5a`

### 2. Navigate to Realtime Database
1. Click on "Realtime Database" in the left sidebar
2. Click on the "Rules" tab

### 3. Replace the Rules
Replace the current rules with the new rules from `FIREBASE_RULES_LEADERBOARD_FIX.json`:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('users').child(auth.uid).child('rank').val() == 'admin' || root.child('users').child(auth.uid).child('rank').val() == 'owner')",
        ".write": "auth != null && auth.uid == $uid"
      },
      ".read": "auth != null"
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
      ".read": "auth != null && (root.child('users').child(auth.uid).child('rank').val() == 'admin' || root.child('users').child(auth.uid).child('rank').val() == 'owner')",
      ".write": "auth != null && (root.child('users').child(auth.uid).child('rank').val() == 'admin' || root.child('users').child(auth.uid).child('rank').val() == 'owner')"
    }
  }
}
```

### 4. Publish the Rules
1. Click "Publish" button
2. Confirm the changes

## What Changed
- Added `.read": "auth != null"` to the main `users` collection
- This allows any authenticated user to read all users' data (needed for leaderboard)
- Individual user data still requires ownership or admin/owner rank
- All other security remains the same

## Security Notes
- Only authenticated users can read the users collection
- Users can still only write to their own data
- Admin/Owner users can read any user's data
- Game history and admin logs remain properly secured

After updating the rules, the leaderboard should work immediately!
