// Firebase Database Structure and API for Blocksmith Game
// This handles all user data, authentication, and admin functions

import { initializeApp } from 'firebase/app';
import { 
    getDatabase, 
    ref, 
    set, 
    get, 
    push, 
    onValue, 
    off, 
    update,
    query,
    orderByChild,
    limitToLast,
    equalTo
} from 'firebase/database';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    onAuthStateChanged,
    updatePassword,
    sendPasswordResetEmail
} from 'firebase/auth';

// Firebase Configuration - Your actual config
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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

class BlocksmithDatabase {
    constructor() {
        this.currentUser = null;
        this.authStateListener = null;
        this.setupAuthStateListener();
    }

    // Authentication State Management
    setupAuthStateListener() {
        this.authStateListener = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in
                const userData = await this.getUserData(user.uid);
                this.currentUser = { ...user, ...userData };
                console.log('User signed in:', this.currentUser);
            } else {
                // User is signed out
                this.currentUser = null;
                console.log('User signed out');
            }
        });
    }

    // User Registration
    async registerUser(username, email, password) {
        try {
            // Check if username already exists
            const usernameExists = await this.checkUsernameExists(username);
            if (usernameExists) {
                return { success: false, error: 'Username already taken' };
            }

            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user profile in database
            const userData = {
                uid: user.uid,
                username: username,
                email: email,
                balance: 100, // Starting balance
                rank: 'user', // Default rank
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                totalWagered: 0,
                totalWon: 0,
                gamesPlayed: 0,
                isActive: true,
                // Admin/owner specific fields
                adminPermissions: [],
                lastAdminAction: null
            };

            // Set initial owner if this is the first user
            const isFirstUser = await this.isFirstUser();
            if (isFirstUser) {
                userData.rank = 'owner';
                userData.balance = 100; // Owner starts with same balance
                userData.adminPermissions = ['give_money', 'remove_money', 'change_rank', 'ban_user'];
            }

            await set(ref(database, `users/${user.uid}`), userData);
            
            // Also store by username for easy lookup
            await set(ref(database, `usernames/${username}`), user.uid);

            return { success: true, user: userData };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // User Login
    async loginUser(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update last login time
            await update(ref(database, `users/${user.uid}`), {
                lastLogin: new Date().toISOString()
            });

            // Load user data
            const userData = await this.getUserData(user.uid);
            this.currentUser = { ...user, ...userData };

            return { success: true, user: this.currentUser };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // User Logout
    async logoutUser() {
        try {
            await signOut(auth);
            this.currentUser = null;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Get User Data
    async getUserData(uid) {
        try {
            const snapshot = await get(ref(database, `users/${uid}`));
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Check if username exists
    async checkUsernameExists(username) {
        try {
            const snapshot = await get(ref(database, `usernames/${username}`));
            return snapshot.exists();
        } catch (error) {
            console.error('Error checking username:', error);
            return false;
        }
    }

    // Check if this is the first user (for owner assignment)
    async isFirstUser() {
        try {
            const snapshot = await get(ref(database, 'users'));
            return !snapshot.exists() || Object.keys(snapshot.val()).length === 0;
        } catch (error) {
            console.error('Error checking first user:', error);
            return false;
        }
    }

    // Update User Balance
    async updateUserBalance(uid, newBalance) {
        try {
            await update(ref(database, `users/${uid}`), {
                balance: newBalance,
                lastBalanceUpdate: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating balance:', error);
            return { success: false, error: error.message };
        }
    }

    // Get Leaderboard
    async getLeaderboard(limit = 10) {
        try {
            const leaderboardQuery = query(
                ref(database, 'users'),
                orderByChild('balance'),
                limitToLast(limit)
            );
            
            const snapshot = await get(leaderboardQuery);
            if (!snapshot.exists()) return [];

            const users = snapshot.val();
            return Object.values(users)
                .filter(user => user.isActive !== false)
                .sort((a, b) => b.balance - a.balance)
                .slice(0, limit);
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            return [];
        }
    }

    // Real-time Leaderboard
    subscribeToLeaderboard(callback, limit = 10) {
        const leaderboardQuery = query(
            ref(database, 'users'),
            orderByChild('balance'),
            limitToLast(limit)
        );
        
        onValue(leaderboardQuery, (snapshot) => {
            if (snapshot.exists()) {
                const users = snapshot.val();
                const leaderboard = Object.values(users)
                    .filter(user => user.isActive !== false)
                    .sort((a, b) => b.balance - a.balance)
                    .slice(0, limit);
                callback(leaderboard);
            }
        });

        return () => off(leaderboardQuery);
    }

    // Save Game Result
    async saveGameResult(uid, gameData) {
        try {
            const gameRef = push(ref(database, `games/${uid}`));
            const gameResult = {
                ...gameData,
                timestamp: new Date().toISOString(),
                gameId: gameRef.key
            };
            
            await set(gameRef, gameResult);

            // Update user stats
            const userData = await this.getUserData(uid);
            const updates = {
                gamesPlayed: (userData.gamesPlayed || 0) + 1,
                totalWagered: (userData.totalWagered || 0) + gameData.bet
            };

            if (gameData.won) {
                updates.totalWon = (userData.totalWon || 0) + (gameData.winnings - gameData.bet);
            }

            await update(ref(database, `users/${uid}`), updates);

            return { success: true, gameId: gameRef.key };
        } catch (error) {
            console.error('Error saving game result:', error);
            return { success: false, error: error.message };
        }
    }

    // Get Game History
    async getGameHistory(uid, limit = 10) {
        try {
            const gamesQuery = query(
                ref(database, `games/${uid}`),
                orderByChild('timestamp'),
                limitToLast(limit)
            );
            
            const snapshot = await get(gamesQuery);
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
    async adminGiveMoney(targetUsername, amount, adminUid) {
        try {
            // Check admin permissions
            const hasPermission = await this.checkAdminPermission(adminUid, 'give_money');
            if (!hasPermission) {
                return { success: false, error: 'Insufficient permissions' };
            }

            // Find target user
            const targetUid = await this.getUidByUsername(targetUsername);
            if (!targetUid) {
                return { success: false, error: 'User not found' };
            }

            const targetUser = await this.getUserData(targetUid);
            const newBalance = targetUser.balance + amount;

            await this.updateUserBalance(targetUid, newBalance);

            // Log admin action
            await this.logAdminAction(adminUid, 'give_money', {
                targetUser: targetUsername,
                amount: amount,
                newBalance: newBalance
            });

            return { success: true, newBalance: newBalance };
        } catch (error) {
            console.error('Error giving money:', error);
            return { success: false, error: error.message };
        }
    }

    async adminRemoveMoney(targetUsername, amount, adminUid) {
        try {
            const hasPermission = await this.checkAdminPermission(adminUid, 'remove_money');
            if (!hasPermission) {
                return { success: false, error: 'Insufficient permissions' };
            }

            const targetUid = await this.getUidByUsername(targetUsername);
            if (!targetUid) {
                return { success: false, error: 'User not found' };
            }

            const targetUser = await this.getUserData(targetUid);
            const newBalance = Math.max(0, targetUser.balance - amount);

            await this.updateUserBalance(targetUid, newBalance);

            await this.logAdminAction(adminUid, 'remove_money', {
                targetUser: targetUsername,
                amount: amount,
                newBalance: newBalance
            });

            return { success: true, newBalance: newBalance };
        } catch (error) {
            console.error('Error removing money:', error);
            return { success: false, error: error.message };
        }
    }

    async adminChangeRank(targetUsername, newRank, adminUid) {
        try {
            const hasPermission = await this.checkAdminPermission(adminUid, 'change_rank');
            if (!hasPermission) {
                return { success: false, error: 'Insufficient permissions' };
            }

            const targetUid = await this.getUidByUsername(targetUsername);
            if (!targetUid) {
                return { success: false, error: 'User not found' };
            }

            // Prevent non-owners from creating owners
            const adminUser = await this.getUserData(adminUid);
            if (newRank === 'owner' && adminUser.rank !== 'owner') {
                return { success: false, error: 'Only owners can assign owner rank' };
            }

            await update(ref(database, `users/${targetUid}`), {
                rank: newRank,
                lastRankChange: new Date().toISOString(),
                rankChangedBy: adminUid
            });

            await this.logAdminAction(adminUid, 'change_rank', {
                targetUser: targetUsername,
                newRank: newRank
            });

            return { success: true };
        } catch (error) {
            console.error('Error changing rank:', error);
            return { success: false, error: error.message };
        }
    }

    async adminBanUser(targetUsername, adminUid) {
        try {
            const hasPermission = await this.checkAdminPermission(adminUid, 'ban_user');
            if (!hasPermission) {
                return { success: false, error: 'Insufficient permissions' };
            }

            const targetUid = await this.getUidByUsername(targetUsername);
            if (!targetUid) {
                return { success: false, error: 'User not found' };
            }

            await update(ref(database, `users/${targetUid}`), {
                isActive: false,
                bannedAt: new Date().toISOString(),
                bannedBy: adminUid
            });

            await this.logAdminAction(adminUid, 'ban_user', {
                targetUser: targetUsername
            });

            return { success: true };
        } catch (error) {
            console.error('Error banning user:', error);
            return { success: false, error: error.message };
        }
    }

    // Helper Functions
    async getUidByUsername(username) {
        try {
            const snapshot = await get(ref(database, `usernames/${username}`));
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error getting UID by username:', error);
            return null;
        }
    }

    async checkAdminPermission(uid, permission) {
        try {
            const userData = await this.getUserData(uid);
            if (!userData) return false;

            // Owner has all permissions
            if (userData.rank === 'owner') return true;

            // Check specific permissions
            return userData.adminPermissions && userData.adminPermissions.includes(permission);
        } catch (error) {
            console.error('Error checking admin permission:', error);
            return false;
        }
    }

    async logAdminAction(adminUid, action, details) {
        try {
            const logRef = push(ref(database, 'adminLogs'));
            await set(logRef, {
                adminUid: adminUid,
                action: action,
                details: details,
                timestamp: new Date().toISOString()
            });

            // Update last admin action
            await update(ref(database, `users/${adminUid}`), {
                lastAdminAction: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    // Password Management
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.currentUser) {
                return { success: false, error: 'No user logged in' };
            }

            // Re-authenticate user
            const credential = await signInWithEmailAndPassword(
                auth, 
                this.currentUser.email, 
                currentPassword
            );

            // Update password
            await updatePassword(credential.user, newPassword);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Error Message Helper
    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'Email is already registered';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Try again later';
            default:
                return error.message;
        }
    }

    // Cleanup
    destroy() {
        if (this.authStateListener) {
            this.authStateListener();
        }
    }
}

// Export singleton instance
export const blocksmithDB = new BlocksmithDatabase();
export { auth, database };
