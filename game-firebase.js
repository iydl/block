// Blocksmith Game with Firebase Integration
// This version replaces localStorage with Firebase for published websites

import { FirebaseAPI } from './firebase-config.js';

class BlocksmithGameFirebase {
    constructor() {
        this.api = new FirebaseAPI();
        this.currentUser = null;
        this.gameState = 'waiting'; // waiting, mining, completed
        this.currentBet = 0;
        this.currentMultiplier = 1.0;
        this.blockProgress = 0;
        this.currentRound = 1;
        this.currentMode = 'Normal';
        this.serverSeed = '';
        this.serverSeedHash = '';
        this.clientSeed = '';
        this.orphanThreshold = 0;
        this.currentDifficulty = 1.0;
        
        this.config = {
            normalModeChance: 0.9,
            hotModeChance: 0.1,
            normalMaxMultiplier: 2.5,
            hotMaxMultiplier: 10.0,
            orphanBaseChance: 0.001,
            orphanMaxChance: 0.95,
            difficultyRange: [0.5, 3.0]
        };
        
        this.init();
    }
    
    async init() {
        console.log('Initializing Blocksmith Game with Firebase...');
        this.showLoading('Initializing...');
        
        try {
            // Check if user is already logged in
            await this.checkAuthState();
            
            this.setupEventListeners();
            this.updateLeaderboard();
            
            console.log('Game initialization complete');
        } catch (error) {
            console.error('Error initializing game:', error);
            this.showStatus('Error initializing game. Please refresh.', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    setupEventListeners() {
        // Auth forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const settingsForm = document.getElementById('settingsForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }
        
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
        
        // Game controls
        const betButton = document.getElementById('betButton');
        const cashoutButton = document.getElementById('cashoutButton');
        
        if (betButton) {
            betButton.addEventListener('click', () => this.placeBet());
        }
        
        if (cashoutButton) {
            cashoutButton.addEventListener('click', () => this.cashOut());
        }
        
        // Balance click for admin
        const balanceDisplay = document.getElementById('balanceDisplay');
        if (balanceDisplay) {
            balanceDisplay.addEventListener('click', () => this.handleBalanceClick());
        }
    }
    
    async checkAuthState() {
        // Firebase handles auth state automatically
        // This will be called when user logs in/out
        if (this.api.currentUser) {
            this.currentUser = this.api.currentUser;
            this.updateUI();
            this.loadGameHistory();
        } else {
            this.showAuthModal();
        }
    }
    
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }
        
        this.showLoading('Logging in...');
        
        try {
            const result = await this.api.loginUser(email, password);
            
            if (result.success) {
                this.currentUser = result.user;
                this.hideAuthModal();
                this.updateUI();
                this.loadGameHistory();
                this.showStatus('Login successful!', 'success');
            } else {
                this.showStatus(result.error, 'error');
            }
        } catch (error) {
            this.showStatus('Login failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (!username || !email || !password || !confirmPassword) {
            this.showStatus('Please fill in all fields', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showStatus('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.showStatus('Password must be at least 6 characters', 'error');
            return;
        }
        
        this.showLoading('Creating account...');
        
        try {
            const result = await this.api.registerUser(username, email, password);
            
            if (result.success) {
                this.currentUser = result.user;
                this.hideAuthModal();
                this.updateUI();
                this.showStatus('Account created successfully!', 'success');
            } else {
                this.showStatus(result.error, 'error');
            }
        } catch (error) {
            this.showStatus('Registration failed. Please try again.', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async logout() {
        this.showLoading('Logging out...');
        
        try {
            await this.api.logoutUser();
            this.currentUser = null;
            this.showAuthModal();
            this.showStatus('Logged out successfully', 'success');
        } catch (error) {
            this.showStatus('Logout failed', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async placeBet() {
        if (!this.currentUser) {
            this.showStatus('Please log in to play', 'error');
            return;
        }
        
        const betAmount = parseFloat(document.getElementById('betAmount').value);
        
        if (isNaN(betAmount) || betAmount <= 0) {
            this.showStatus('Please enter a valid bet amount', 'error');
            return;
        }
        
        if (betAmount > this.currentUser.balance) {
            this.showStatus('Insufficient balance', 'error');
            return;
        }
        
        this.currentBet = betAmount;
        this.gameState = 'mining';
        this.blockProgress = 0;
        this.currentMultiplier = 1.0;
        
        // Generate game outcome
        this.generateGameOutcome();
        this.updateDifficultyDisplay();
        
        // Update UI
        document.getElementById('betButton').disabled = true;
        document.getElementById('cashoutButton').disabled = false;
        document.getElementById('betAmount').disabled = true;
        
        this.updateUI();
        this.startMining();
    }
    
    async cashOut() {
        if (this.gameState !== 'mining') return;
        
        const winnings = this.currentBet * this.currentMultiplier;
        const profit = winnings - this.currentBet;
        
        // Update user balance
        this.currentUser.balance += profit;
        
        // Save to Firebase
        await this.api.updateUserBalance(this.currentUser.uid, this.currentUser.balance);
        
        // Save game result
        await this.api.saveGameResult(this.currentUser.uid, {
            bet: this.currentBet,
            multiplier: this.currentMultiplier,
            winnings: winnings,
            won: true,
            mode: this.currentMode,
            difficulty: this.currentDifficulty
        });
        
        this.endGame(true, winnings);
        this.showStatus(`Cashed out at ${this.currentMultiplier.toFixed(2)}x! Won $${this.formatNumber(winnings)}`, 'success');
    }
    
    async endGame(won, winnings = 0) {
        this.gameState = 'completed';
        
        // Update user balance if they lost
        if (!won) {
            this.currentUser.balance -= this.currentBet;
            await this.api.updateUserBalance(this.currentUser.uid, this.currentUser.balance);
            
            // Save game result
            await this.api.saveGameResult(this.currentUser.uid, {
                bet: this.currentBet,
                multiplier: this.currentMultiplier,
                winnings: 0,
                won: false,
                mode: this.currentMode,
                difficulty: this.currentDifficulty
            });
        }
        
        // Reset game state
        this.gameState = 'waiting';
        this.currentBet = 0;
        this.currentMultiplier = 1.0;
        this.blockProgress = 0;
        
        // Update UI
        document.getElementById('betButton').disabled = false;
        document.getElementById('cashoutButton').disabled = true;
        document.getElementById('betAmount').disabled = false;
        document.getElementById('blockFill').style.width = '0%';
        document.getElementById('blockPercentage').textContent = '0%';
        document.getElementById('multiplierValue').textContent = '1.00x';
        
        this.updateUI();
        this.updateLeaderboard();
        this.loadGameHistory();
        
        // Start next round after delay
        setTimeout(() => {
            this.currentRound++;
            this.gameState = 'waiting';
            this.updateUI();
        }, 3000);
    }
    
    async updateLeaderboard() {
        try {
            const leaderboard = await this.api.getLeaderboard(10);
            const leaderboardList = document.getElementById('leaderboardList');
            leaderboardList.innerHTML = '';
            
            leaderboard.forEach((account, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                
                let rankBadge = '';
                if (account.rank === 'owner') {
                    rankBadge = '<span class="rank-badge owner">OWNER</span>';
                } else if (account.rank === 'admin') {
                    rankBadge = '<span class="rank-badge admin">ADMIN</span>';
                } else if (account.rank === 'elite') {
                    rankBadge = '<span class="rank-badge elite">ELITE</span>';
                }
                
                item.innerHTML = `
                    <div class="leaderboard-rank">#${index + 1}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-username">${account.username} ${rankBadge}</div>
                        <div class="leaderboard-balance">$${this.formatNumber(account.balance)}</div>
                    </div>
                `;
                leaderboardList.appendChild(item);
            });
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    }
    
    async loadGameHistory() {
        if (!this.currentUser) return;
        
        try {
            const games = await this.api.getGameHistory(this.currentUser.uid, 10);
            const historyList = document.getElementById('historyList');
            
            if (!historyList) return;
            
            historyList.innerHTML = '';
            
            if (games.length === 0) {
                historyList.innerHTML = '<div class="history-item"><div class="history-info">No games played yet</div></div>';
                return;
            }
            
            games.forEach(game => {
                const historyElement = document.createElement('div');
                historyElement.className = 'history-item';
                historyElement.innerHTML = `
                    <div class="history-info">
                        <div class="history-round">${new Date(game.timestamp).toLocaleDateString()}</div>
                        <div class="history-multiplier">${game.multiplier.toFixed(2)}x (${game.mode})</div>
                    </div>
                    <div class="history-result ${game.won ? 'win' : 'loss'}">
                        ${game.won ? '+$' + this.formatNumber(game.winnings) : '-$' + this.formatNumber(game.bet)}
                    </div>
                `;
                historyList.appendChild(historyElement);
            });
        } catch (error) {
            console.error('Error loading game history:', error);
        }
    }
    
    // Real-time leaderboard updates
    subscribeToLeaderboard() {
        return this.api.subscribeToLeaderboard((leaderboard) => {
            const leaderboardList = document.getElementById('leaderboardList');
            leaderboardList.innerHTML = '';
            
            leaderboard.forEach((account, index) => {
                const item = document.createElement('div');
                item.className = 'leaderboard-item';
                
                let rankBadge = '';
                if (account.rank === 'owner') {
                    rankBadge = '<span class="rank-badge owner">OWNER</span>';
                } else if (account.rank === 'admin') {
                    rankBadge = '<span class="rank-badge admin">ADMIN</span>';
                } else if (account.rank === 'elite') {
                    rankBadge = '<span class="rank-badge elite">ELITE</span>';
                }
                
                item.innerHTML = `
                    <div class="leaderboard-rank">#${index + 1}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-username">${account.username} ${rankBadge}</div>
                        <div class="leaderboard-balance">$${this.formatNumber(account.balance)}</div>
                    </div>
                `;
                leaderboardList.appendChild(item);
            });
        });
    }
    
    // Admin commands with Firebase
    async executeAdminCommand() {
        if (!this.currentUser || this.currentUser.rank !== 'owner') {
            this.logAdminCommand('Access denied: Owner privileges required');
            return;
        }
        
        const commandInput = document.getElementById('adminCommandInput');
        const command = commandInput.value.trim();
        
        if (!command) {
            this.logAdminCommand('Please enter a command');
            return;
        }
        
        this.logAdminCommand(`> ${command}`);
        
        const parts = command.split(/\s+/).filter(part => part.length > 0);
        const cmd = parts[0].toLowerCase();
        
        if (cmd === '.give' && parts.length >= 3) {
            const player = parts[1];
            const amountStr = parts.slice(2).join(' ');
            const cleanAmountStr = amountStr.replace(/[$,\s]/g, '');
            const amount = parseFloat(cleanAmountStr);
            
            if (isNaN(amount) || amount <= 0) {
                this.logAdminCommand(`Invalid amount: "${amountStr}". Amount must be a positive number.`);
                return;
            }
            
            const result = await this.api.adminGiveMoney(player, amount);
            if (result.success) {
                this.logAdminCommand(`✓ Gave $${this.formatNumber(amount)} to ${player}. New balance: $${this.formatNumber(result.newBalance)}`);
                this.updateLeaderboard();
            } else {
                this.logAdminCommand(`Error: ${result.error}`);
            }
        } else if (cmd === '.remove' && parts.length >= 3) {
            const player = parts[1];
            const amountStr = parts.slice(2).join(' ');
            const cleanAmountStr = amountStr.replace(/[$,\s]/g, '');
            const amount = parseFloat(cleanAmountStr);
            
            if (isNaN(amount) || amount <= 0) {
                this.logAdminCommand(`Invalid amount: "${amountStr}". Amount must be a positive number.`);
                return;
            }
            
            const result = await this.api.adminRemoveMoney(player, amount);
            if (result.success) {
                this.logAdminCommand(`✓ Removed $${this.formatNumber(amount)} from ${player}. New balance: $${this.formatNumber(result.newBalance)}`);
                this.updateLeaderboard();
            } else {
                this.logAdminCommand(`Error: ${result.error}`);
            }
        } else {
            this.logAdminCommand(`Invalid command format. Expected: .give player amount or .remove player amount`);
        }
        
        commandInput.value = '';
    }
    
    // Utility functions (same as original)
    formatNumber(num) {
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    showLoading(status) {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            if (loadingStatus) {
                loadingStatus.textContent = status;
            }
        }
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    showStatus(message, type) {
        const statusDiv = document.getElementById('authStatus');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `auth-status ${type}`;
            statusDiv.style.display = 'block';
            
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    showAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'block';
        }
    }
    
    hideAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'none';
        }
    }
    
    updateUI() {
        if (this.currentUser) {
            document.getElementById('balanceDisplay').textContent = '$' + this.formatNumber(this.currentUser.balance);
            document.getElementById('usernameDisplay').textContent = this.currentUser.username;
            document.getElementById('userInfo').style.display = 'flex';
            document.getElementById('authSection').style.display = 'none';
        } else {
            document.getElementById('userInfo').style.display = 'none';
            document.getElementById('authSection').style.display = 'flex';
        }
    }
    
    // Game logic methods (same as original)
    generateGameOutcome() {
        this.serverSeed = this.generateRandomSeed();
        this.serverSeedHash = this.hashSeed(this.serverSeed);
        this.clientSeed = this.generateRandomSeed();
        
        const combinedSeed = this.serverSeed + this.clientSeed;
        
        const modeRandom = this.seedToNumber(combinedSeed, 0);
        this.currentMode = modeRandom < this.config.normalModeChance ? 'Normal' : 'Hot';
        
        const orphanRandom = this.seedToNumber(combinedSeed, 1);
        this.orphanThreshold = this.calculateOrphanThreshold(orphanRandom);
        
        const difficultyRandom = this.seedToNumber(combinedSeed, 2);
        this.currentDifficulty = this.config.difficultyRange[0] + 
            (difficultyRandom * (this.config.difficultyRange[1] - this.config.difficultyRange[0]));
        
        document.getElementById('gameMode').textContent = this.currentMode;
        this.updateDifficultyDisplay();
    }
    
    generateRandomSeed() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    hashSeed(seed) {
        return CryptoJS.SHA256(seed).toString();
    }
    
    seedToNumber(seed, index) {
        const hash = this.hashSeed(seed + index);
        return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
    }
    
    calculateOrphanThreshold(random) {
        const baseChance = this.config.orphanBaseChance;
        const maxChance = this.config.orphanMaxChance;
        return baseChance + (maxChance - baseChance) * Math.pow(random, 3);
    }
    
    startMining() {
        const miningInterval = setInterval(() => {
            if (this.gameState !== 'mining') {
                clearInterval(miningInterval);
                return;
            }
            
            this.updateMining();
        }, 50);
    }
    
    updateMining() {
        const increment = this.currentMode === 'Hot' ? 0.5 : 0.2;
        this.blockProgress += increment;
        
        if (this.currentMode === 'Normal') {
            this.currentMultiplier = 1.0 + (this.blockProgress / 100) * (this.config.normalMaxMultiplier - 1.0);
        } else {
            this.currentMultiplier = 1.0 + (this.blockProgress / 100) * (this.config.hotMaxMultiplier - 1.0);
        }
        
        document.getElementById('blockFill').style.width = this.blockProgress + '%';
        document.getElementById('blockPercentage').textContent = Math.round(this.blockProgress) + '%';
        document.getElementById('multiplierValue').textContent = this.currentMultiplier.toFixed(2) + 'x';
        
        if (this.shouldOrphan()) {
            this.handleOrphan();
            return;
        }
        
        if (this.blockProgress >= 100) {
            this.handleBlockComplete();
        }
    }
    
    shouldOrphan() {
        const progress = this.blockProgress / 100;
        const maxProgress = Math.max(0.1, 1.0 - (this.currentDifficulty - 0.5) * 0.3);
        
        if (progress >= maxProgress) {
            return true;
        }
        
        const normalizedProgress = progress / maxProgress;
        const baseOrphanChance = this.config.orphanBaseChance + 
            (this.config.orphanMaxChance - this.config.orphanBaseChance) * Math.pow(normalizedProgress, 3);
        
        return Math.random() < baseOrphanChance;
    }
    
    handleOrphan() {
        this.endGame(false);
        this.showStatus('Block orphaned! You lost your bet.', 'error');
    }
    
    handleBlockComplete() {
        const winnings = this.currentBet * this.currentMultiplier;
        this.currentUser.balance += winnings - this.currentBet;
        this.endGame(true, winnings);
        this.showStatus(`Block completed! Won $${this.formatNumber(winnings)}`, 'success');
    }
    
    updateDifficultyDisplay() {
        const difficultyValue = document.getElementById('difficultyValue');
        const difficultyFill = document.getElementById('difficultyFill');
        const difficultyDescription = document.getElementById('difficultyDescription');
        
        if (difficultyValue) {
            difficultyValue.textContent = this.currentDifficulty.toFixed(1) + 'x';
        }
        
        if (difficultyFill) {
            const minDiff = this.config.difficultyRange[0];
            const maxDiff = this.config.difficultyRange[1];
            const percentage = ((this.currentDifficulty - minDiff) / (maxDiff - minDiff)) * 100;
            difficultyFill.style.width = percentage + '%';
            
            if (this.currentDifficulty <= 0.8) {
                difficultyFill.style.background = 'linear-gradient(90deg, #00ff88 0%, #00d4aa 100%)';
            } else if (this.currentDifficulty <= 1.5) {
                difficultyFill.style.background = 'linear-gradient(90deg, #feca57 0%, #ff9ff3 100%)';
            } else {
                difficultyFill.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #ee5a24 100%)';
            }
        }
        
        if (difficultyDescription) {
            const maxProgress = Math.max(0.1, 1.0 - (this.currentDifficulty - 0.5) * 0.3);
            const maxProgressPercent = Math.round(maxProgress * 100);
            
            if (this.currentDifficulty <= 0.7) {
                difficultyDescription.textContent = `Can reach ~${maxProgressPercent}%`;
            } else if (this.currentDifficulty <= 1.2) {
                difficultyDescription.textContent = `Max ~${maxProgressPercent}%`;
            } else if (this.currentDifficulty <= 2.0) {
                difficultyDescription.textContent = `Breaks at ~${maxProgressPercent}%`;
            } else {
                difficultyDescription.textContent = `Very risky - ~${maxProgressPercent}%`;
            }
        }
    }
    
    handleBalanceClick() {
        if (!this.currentUser || this.currentUser.rank !== 'owner') return;
        
        this.balanceClickCount = (this.balanceClickCount || 0) + 1;
        
        if (this.balanceClickCount >= 5) {
            this.showAdminConsole();
            this.balanceClickCount = 0;
        }
        
        setTimeout(() => {
            this.balanceClickCount = 0;
        }, 3000);
    }
    
    showAdminConsole() {
        const adminModal = document.getElementById('adminModal');
        if (adminModal) {
            adminModal.style.display = 'block';
            this.setupAdminConsole();
        }
    }
    
    setupAdminConsole() {
        const commandInput = document.getElementById('adminCommandInput');
        if (commandInput) {
            commandInput.focus();
            commandInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.executeAdminCommand();
                }
            });
        }
    }
    
    logAdminCommand(message) {
        const log = document.getElementById('adminLog');
        const timestamp = new Date().toLocaleTimeString();
        log.innerHTML += `[${timestamp}] ${message}\n`;
        log.scrollTop = log.scrollHeight;
    }
}

// Export for use
export { BlocksmithGameFirebase };
