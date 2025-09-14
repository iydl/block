// Firebase Configuration
// Replace with your Firebase project credentials
const firebaseConfig = {
    apiKey: "AIzaSyC6z9d-NbWe3kEnXnP48qmfH2-kwW4Vz7E",
    authDomain: "block-abd5a.firebaseapp.com",
    databaseURL: "https://block-abd5a-default-rtdb.firebaseio.com",
    projectId: "block-abd5a",
    storageBucket: "block-abd5a.firebasestorage.app",
    messagingSenderId: "883132297964",
    appId: "1:883132297964:web:44634d8250fa29872a6bc9",
    measurementId: "G-E2XZX95N0T"
  };
  

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get, push, onValue, off } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Database API Class
class FirebaseAPI {
    constructor() {
        this.currentUser = null;
    }

    // Authentication
    async registerUser(username, email, password) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Create user profile in database
            await this.createUserProfile(user.uid, username, email);
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async loginUser(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Load user data from database
            const userData = await this.getUserData(user.uid);
            this.currentUser = { ...user, ...userData };
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logoutUser() {
        try {
            await signOut(auth);
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // User Management
    async createUserProfile(uid, username, email) {
        const userData = {
            uid: uid,
            username: username,
            email: email,
            balance: 100,
            rank: 'user',
            createdAt: new Date().toISOString(),
            totalWagered: 0,
            totalWon: 0,
            gamesPlayed: 0
        };

        await set(ref(database, `users/${uid}`), userData);
        return userData;
    }

    async getUserData(uid) {
        try {
            const snapshot = await get(ref(database, `users/${uid}`));
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    async updateUserBalance(uid, newBalance) {
        try {
            await set(ref(database, `users/${uid}/balance`), newBalance);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Leaderboard
    async getLeaderboard(limit = 10) {
        try {
            const snapshot = await get(ref(database, 'users'));
            if (!snapshot.exists()) return [];

            const users = snapshot.val();
            const leaderboard = Object.values(users)
                .sort((a, b) => b.balance - a.balance)
                .slice(0, limit);

            return leaderboard;
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    // Real-time leaderboard updates
    subscribeToLeaderboard(callback, limit = 10) {
        const leaderboardRef = ref(database, 'users');
        
        onValue(leaderboardRef, (snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                const leaderboard = Object.values(users)
                    .sort((a, b) => b.balance - a.balance)
                    .slice(0, limit);
                callback(leaderboard);
            }
        });

        // Return unsubscribe function
        return () => off(leaderboardRef);
    }

    // Game History
    async saveGameResult(uid, gameData) {
        try {
            const gameRef = push(ref(database, `games/${uid}`));
            await set(gameRef, {
                ...gameData,
                timestamp: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getGameHistory(uid, limit = 10) {
        try {
            const snapshot = await get(ref(database, `games/${uid}`));
            if (!snapshot.exists()) return [];

            const games = snapshot.val();
            return Object.values(games)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting game history:', error);
            return [];
        }
    }

    // Admin Functions
    async adminGiveMoney(targetUsername, amount) {
        try {
            // Find user by username
            const snapshot = await get(ref(database, 'users'));
            if (!snapshot.exists()) return { success: false, error: 'No users found' };

            const users = snapshot.val();
            const targetUser = Object.values(users).find(user => user.username === targetUsername);
            
            if (!targetUser) {
                return { success: false, error: 'User not found' };
            }

            const newBalance = targetUser.balance + amount;
            await this.updateUserBalance(targetUser.uid, newBalance);

            return { success: true, newBalance: newBalance };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async adminRemoveMoney(targetUsername, amount) {
        try {
            const snapshot = await get(ref(database, 'users'));
            if (!snapshot.exists()) return { success: false, error: 'No users found' };

            const users = snapshot.val();
            const targetUser = Object.values(users).find(user => user.username === targetUsername);
            
            if (!targetUser) {
                return { success: false, error: 'User not found' };
            }

            const newBalance = Math.max(0, targetUser.balance - amount);
            await this.updateUserBalance(targetUser.uid, newBalance);

            return { success: true, newBalance: newBalance };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export for use in other files
export { FirebaseAPI, auth, database };
