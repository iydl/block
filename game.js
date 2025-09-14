// The Blocksmith Game - Main JavaScript File

class BlocksmithGame {
    constructor() {
        this.currentUser = null;
        this.gameState = 'waiting'; // waiting, betting, mining, finished
        this.currentRound = 1;
        this.currentMultiplier = 1.0;
        this.currentBet = 0;
        this.currentMode = 'normal'; // normal, hot
        this.blockProgress = 0;
        this.orphanThreshold = 0;
        this.gameInterval = null;
        this.balanceClickCount = 0;
        this.balanceClickTimeout = null;
        
        // Provably Fair System
        this.serverSeed = null;
        this.clientSeed = null;
        this.serverSeedHash = null;
        
        // Game Configuration
        this.config = {
            normalModeChance: 0.9,
            hotModeChance: 0.1,
            normalMultiplierRate: 0.1, // +0.1x per 10%
            hotMultiplierRate: 0.25, // +0.25x per 5%
            normalMaxMultiplier: 2.5,
            hotMaxMultiplier: 10.0,
            orphanBaseChance: 0.001,
            orphanMaxChance: 0.95,
            difficultyRange: [0.5, 3.0] // Min and max difficulty
        };
        
        this.currentDifficulty = 1.0;
        
        this.init();
    }
    
    init() {
        console.log('Initializing Blocksmith Game...');
        this.showLoading('Initializing...');
        
        // Simulate initialization time
        setTimeout(() => {
            this.setupEventListeners();
            this.loadAccounts();
            this.checkAuthState();
            this.updateLeaderboard();
            this.loadGameHistory();
            console.log('Game initialization complete');
            this.hideLoading();
        }, 800);
    }
    
    setupEventListeners() {
        // Auth forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const settingsForm = document.getElementById('settingsForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        } else {
            console.error('Login form not found');
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        } else {
            console.error('Register form not found');
        }
        
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handlePasswordChange(e));
        }
        
        // Auth tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchAuthTab(e.target.dataset.tab));
        });
        
        // Game controls
        document.getElementById('betButton').addEventListener('click', () => this.placeBet());
        document.getElementById('cashoutButton').addEventListener('click', () => this.cashOut());
    }
    
    // Authentication System
    async handleLogin(e) {
        e.preventDefault();
        console.log('Login attempt started');
        
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        console.log('Username:', username);
        
        const accounts = this.getAccounts();
        console.log('Total accounts:', accounts.length);
        
        const user = accounts.find(acc => acc.username === username);
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (user && await this.verifyPassword(password, user.password)) {
            console.log('Login successful');
            this.showLoading('Logging in...');
            
            // Simulate loading time
            setTimeout(() => {
                this.currentUser = { ...user }; // Create a copy to avoid reference issues
                this.saveCurrentUser();
                this.showGame();
                this.updateUI();
                this.closeModal('authModal');
                this.hideLoading();
                this.showStatus('Welcome back, ' + username + '!', 'success');
            }, 1000);
        } else {
            console.log('Login failed');
            this.showStatus('Invalid username or password', 'error');
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        console.log('Register attempt started');
        
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        console.log('Username:', username);
        console.log('Password length:', password.length);
        
        if (password !== confirmPassword) {
            console.log('Passwords do not match');
            this.showStatus('Passwords do not match', 'error');
            return;
        }
        
        if (password.length < 6) {
            console.log('Password too short');
            this.showStatus('Password must be at least 6 characters', 'error');
            return;
        }
        
        const accounts = this.getAccounts();
        if (accounts.find(acc => acc.username === username)) {
            console.log('Username already exists');
            this.showStatus('Username already exists', 'error');
            return;
        }
        
        console.log('Creating new user...');
        const hashedPassword = await this.hashPassword(password);
        const newUser = {
            username: username,
            password: hashedPassword,
            balance: 1000, // Starting balance
            rank: 'user',
            createdAt: new Date().toISOString(),
            gamesPlayed: 0,
            totalWon: 0,
            totalLost: 0
        };
        
        accounts.push(newUser);
        this.saveAccounts(accounts);
        
        console.log('User created successfully');
        this.showLoading('Creating account...');
        
        // Simulate loading time
        setTimeout(() => {
            this.showStatus('Account created successfully!', 'success');
            this.switchAuthTab('login');
            document.getElementById('loginUsername').value = username;
            this.hideLoading();
        }, 800);
    }
    
    async handlePasswordChange(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        
        if (newPassword !== confirmPassword) {
            this.showStatus('New passwords do not match', 'error');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showStatus('New password must be at least 6 characters', 'error');
            return;
        }
        
        if (!(await this.verifyPassword(currentPassword, this.currentUser.password))) {
            this.showStatus('Current password is incorrect', 'error');
            return;
        }
        
        const accounts = this.getAccounts();
        const userIndex = accounts.findIndex(acc => acc.username === this.currentUser.username);
        
        if (userIndex !== -1) {
            accounts[userIndex].password = await this.hashPassword(newPassword);
            this.saveAccounts(accounts);
            this.currentUser = accounts[userIndex];
            this.saveCurrentUser();
            this.closeModal('settingsModal');
            this.showStatus('Password updated successfully!', 'success');
        }
    }
    
    // Password hashing (simplified - in production use proper bcrypt)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async verifyPassword(password, hash) {
        const hashedPassword = await this.hashPassword(password);
        return hashedPassword === hash;
    }
    
    // Account Management
    getAccounts() {
        const accounts = localStorage.getItem('blocksmith_accounts');
        return accounts ? JSON.parse(accounts) : [];
    }
    
    saveAccounts(accounts) {
        localStorage.setItem('blocksmith_accounts', JSON.stringify(accounts));
    }
    
    saveCurrentUser() {
        if (this.currentUser) {
            localStorage.setItem('blocksmith_current_user', JSON.stringify(this.currentUser));
        }
    }
    
    saveUserData() {
        if (!this.currentUser) {
            console.log('No current user to save');
            return;
        }
        
        const accounts = this.getAccounts();
        const userIndex = accounts.findIndex(acc => acc.username === this.currentUser.username);
        
        if (userIndex !== -1) {
            const oldBalance = accounts[userIndex].balance;
            accounts[userIndex] = { ...this.currentUser };
            this.saveAccounts(accounts);
            console.log(`User data saved: ${this.currentUser.username}, Balance: $${oldBalance} → $${this.currentUser.balance}`);
            
            // Verify the save worked
            const savedAccounts = this.getAccounts();
            const savedUser = savedAccounts.find(acc => acc.username === this.currentUser.username);
            if (savedUser) {
                console.log(`Verification: Saved balance is $${savedUser.balance}`);
            }
        } else {
            console.log('User not found in accounts array:', this.currentUser.username);
        }
    }
    
    loadCurrentUser() {
        const user = localStorage.getItem('blocksmith_current_user');
        return user ? JSON.parse(user) : null;
    }
    
    checkAuthState() {
        console.log('Checking auth state...');
        const user = this.loadCurrentUser();
        if (user) {
            console.log('User found in localStorage:', user.username, 'Balance:', user.balance);
            
            // Load fresh user data from accounts to ensure we have the latest balance
            const accounts = this.getAccounts();
            const freshUser = accounts.find(acc => acc.username === user.username);
            if (freshUser) {
                console.log('Fresh user data found:', freshUser.username, 'Balance:', freshUser.balance);
                this.currentUser = { ...freshUser };
                this.saveCurrentUser(); // Update the stored current user
            } else {
                console.log('No fresh user data found, using cached data');
                this.currentUser = { ...user };
            }
            console.log('Final current user balance:', this.currentUser.balance);
            this.showGame();
            this.updateUI();
        } else {
            console.log('No user found, showing auth modal');
            this.showAuth();
        }
    }
    
    logout() {
        this.showLoading('Logging out...');
        
        // Simulate loading time
        setTimeout(() => {
            this.currentUser = null;
            localStorage.removeItem('blocksmith_current_user');
            this.showAuth();
            this.hideLoading();
            this.showStatus('Logged out successfully', 'success');
        }, 600);
    }
    
    // Loading Screen Management
    showLoading(status = 'Loading...') {
        const loadingScreen = document.getElementById('loadingScreen');
        const loadingStatus = document.getElementById('loadingStatus');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
            loadingScreen.classList.remove('hidden');
            if (loadingStatus) {
                loadingStatus.textContent = status;
            }
        }
    }
    
    hideLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
            loadingScreen.classList.add('hidden');
        }
    }
    
    // UI Management
    showAuth() {
        console.log('Showing auth modal');
        const authModal = document.getElementById('authModal');
        const gameContainer = document.getElementById('gameContainer');
        
        if (authModal) {
            authModal.style.display = 'block';
        } else {
            console.error('Auth modal not found');
        }
        
        if (gameContainer) {
            gameContainer.style.display = 'none';
        } else {
            console.error('Game container not found');
        }
    }
    
    showGame() {
        console.log('Showing game interface');
        const authModal = document.getElementById('authModal');
        const gameContainer = document.getElementById('gameContainer');
        
        if (authModal) {
            authModal.style.display = 'none';
        } else {
            console.error('Auth modal not found');
        }
        
        if (gameContainer) {
            gameContainer.style.display = 'block';
        } else {
            console.error('Game container not found');
        }
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    switchAuthTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.auth-tab').forEach(tab => tab.classList.remove('active'));
        
        document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
        document.getElementById(tab + 'Tab').classList.add('active');
    }
    
    updateUI() {
        if (!this.currentUser) return;
        
        document.getElementById('currentUsername').textContent = this.currentUser.username;
        document.getElementById('currentRank').textContent = this.currentUser.rank.toUpperCase();
        document.getElementById('currentRank').className = `user-rank ${this.currentUser.rank}`;
        document.getElementById('balanceAmount').textContent = '$' + this.formatNumber(this.currentUser.balance);
        document.getElementById('roundNumber').textContent = this.currentRound;
    }
    
    showStatus(message, type = 'info') {
        // Show in game status
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            const messageElement = statusElement.querySelector('.status-message');
            if (messageElement) {
                messageElement.textContent = message;
                messageElement.className = `status-message ${type}`;
                
                setTimeout(() => {
                    messageElement.className = 'status-message';
                }, 5000);
            }
        }
        
        // Show in auth status
        const authStatus = document.getElementById('authStatus');
        if (authStatus) {
            const authMessage = authStatus.querySelector('.status-message');
            if (authMessage) {
                authMessage.textContent = message;
                authStatus.className = `auth-status ${type}`;
                authStatus.style.display = 'block';
                
                setTimeout(() => {
                    authStatus.style.display = 'none';
                }, 5000);
            }
        }
    }
    
    // Game Logic
    placeBet() {
        if (this.gameState !== 'waiting') return;
        
        const betAmount = parseFloat(document.getElementById('betAmount').value);
        if (betAmount <= 0 || betAmount > this.currentUser.balance) {
            this.showStatus('Invalid bet amount', 'error');
            return;
        }
        
        // Additional safety check: ensure bet doesn't exceed available balance
        if (betAmount >= this.currentUser.balance) {
            this.showStatus('Bet amount too high - please bet less than your total balance', 'error');
            return;
        }
        
        this.currentBet = betAmount;
        this.currentUser.balance -= betAmount;
        this.gameState = 'betting';
        
        // Save updated balance
        this.saveUserData();
        
        // Generate provably fair outcome
        this.generateGameOutcome();
        
        // Start the game
        this.startMining();
        this.updateUI();
        this.updateLeaderboard();
    }
    
    generateGameOutcome() {
        // Generate server seed
        this.serverSeed = this.generateRandomSeed();
        this.serverSeedHash = this.hashSeed(this.serverSeed);
        
        // Generate client seed (could be user-provided)
        this.clientSeed = this.generateRandomSeed();
        
        // Determine game mode
        const combinedSeed = this.serverSeed + this.clientSeed;
        const modeRandom = this.seedToNumber(combinedSeed, 0);
        this.currentMode = modeRandom < this.config.normalModeChance ? 'normal' : 'hot';
        
        // Determine orphan threshold
        const orphanRandom = this.seedToNumber(combinedSeed, 1);
        this.orphanThreshold = this.calculateOrphanThreshold(orphanRandom);
        
        // Determine difficulty
        const difficultyRandom = this.seedToNumber(combinedSeed, 2);
        this.currentDifficulty = this.config.difficultyRange[0] + 
            (difficultyRandom * (this.config.difficultyRange[1] - this.config.difficultyRange[0]));
        
        console.log('Game Outcome Generated:');
        console.log('Server Seed Hash:', this.serverSeedHash);
        console.log('Mode:', this.currentMode);
        console.log('Orphan Threshold:', this.orphanThreshold);
        console.log('Difficulty:', this.currentDifficulty);
    }
    
    calculateOrphanThreshold(random) {
        // Exponential increase in orphan chance as progress approaches 100%
        const baseChance = this.config.orphanBaseChance;
        const maxChance = this.config.orphanMaxChance;
        
        // Use exponential function to create increasing risk
        const progress = random;
        const orphanChance = baseChance + (maxChance - baseChance) * Math.pow(progress, 3);
        
        return Math.min(orphanChance, maxChance);
    }
    
    startMining() {
        this.gameState = 'mining';
        this.blockProgress = 0;
        this.currentMultiplier = 1.0;
        
        document.getElementById('betButton').disabled = true;
        document.getElementById('cashoutButton').disabled = false;
        document.getElementById('gameMode').textContent = this.currentMode.toUpperCase();
        document.getElementById('gameMode').className = `game-mode ${this.currentMode}`;
        
        // Update difficulty display
        this.updateDifficultyDisplay();
        
        this.gameInterval = setInterval(() => {
            this.updateMining();
        }, 100);
    }
    
    updateMining() {
        // Increase block progress
        this.blockProgress += 0.5; // 0.5% per update
        
        // Calculate multiplier based on mode
        if (this.currentMode === 'normal') {
            this.currentMultiplier = 1.0 + (this.blockProgress / 10) * this.config.normalMultiplierRate;
            this.currentMultiplier = Math.min(this.currentMultiplier, this.config.normalMaxMultiplier);
        } else {
            this.currentMultiplier = 1.0 + (this.blockProgress / 5) * this.config.hotMultiplierRate;
            this.currentMultiplier = Math.min(this.currentMultiplier, this.config.hotMaxMultiplier);
        }
        
        // Update UI
        document.getElementById('blockFill').style.width = this.blockProgress + '%';
        document.getElementById('blockPercentage').textContent = Math.round(this.blockProgress) + '%';
        document.getElementById('multiplierValue').textContent = this.currentMultiplier.toFixed(2) + 'x';
        
        // Check for orphan event
        if (this.shouldOrphan()) {
            this.handleOrphan();
            return;
        }
        
        // Check if block is complete
        if (this.blockProgress >= 100) {
            this.handleBlockComplete();
        }
    }
    
    shouldOrphan() {
        // Calculate orphan probability based on progress and difficulty
        const progress = this.blockProgress / 100;
        
        // Calculate the maximum possible progress based on difficulty
        // Higher difficulty = lower max progress (breaks earlier)
        // Lower difficulty = higher max progress (can get closer to 100%)
        const maxProgress = Math.max(0.1, 1.0 - (this.currentDifficulty - 0.5) * 0.3);
        
        // If we've exceeded the difficulty-based max progress, force orphan
        if (progress >= maxProgress) {
            return true;
        }
        
        // Base orphan chance increases exponentially as we approach max progress
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
        this.endGame(true);
        this.showStatus('Block completed! You won!', 'success');
    }
    
    cashOut() {
        if (this.gameState !== 'mining') return;
        
        this.endGame(true);
        this.showStatus('Cashed out at ' + this.currentMultiplier.toFixed(2) + 'x!', 'success');
    }
    
    endGame(won) {
        clearInterval(this.gameInterval);
        this.gameState = 'finished';
        
        let winnings = 0;
        if (won) {
            winnings = this.currentBet * this.currentMultiplier;
            this.currentUser.balance += winnings;
            this.currentUser.totalWon += winnings;
        } else {
            this.currentUser.totalLost += this.currentBet;
        }
        
        this.currentUser.gamesPlayed++;
        
        // Check if user needs balance recovery (all users get $100 when they lose everything)
        if (this.currentUser.balance <= 0) {
            this.currentUser.balance = 100; // Give $100 recovery balance
            this.showStatus('Balance recovered! You received $100 to continue playing.', 'success');
        }
        
        // Save updated user data to accounts
        this.saveUserData();
        
        // Save game result
        this.saveGameResult(won, winnings);
        
        // Reset UI
        document.getElementById('betButton').disabled = false;
        document.getElementById('cashoutButton').disabled = true;
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
    
    saveGameResult(won, winnings) {
        const gameResult = {
            username: this.currentUser.username,
            round: this.currentRound,
            bet: this.currentBet,
            multiplier: this.currentMultiplier,
            won: won,
            winnings: winnings,
            mode: this.currentMode,
            timestamp: new Date().toISOString(),
            serverSeedHash: this.serverSeedHash
        };
        
        const games = this.getRecentGames();
        games.unshift(gameResult);
        if (games.length > 50) games.pop(); // Keep only last 50 games
        
        localStorage.setItem('blocksmith_recent_games', JSON.stringify(games));
    }
    
    getRecentGames() {
        const games = localStorage.getItem('blocksmith_recent_games');
        return games ? JSON.parse(games) : [];
    }
    
    
    loadGameHistory() {
        if (!this.currentUser) return;
        
        const games = this.getRecentGames();
        const userGames = games.filter(game => game.username === this.currentUser.username);
        const historyList = document.getElementById('historyList');
        
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (userGames.length === 0) {
            historyList.innerHTML = '<div class="history-item"><div class="history-info">No games played yet</div></div>';
            return;
        }
        
        userGames.slice(0, 10).forEach(game => {
            const historyElement = document.createElement('div');
            historyElement.className = 'history-item';
            historyElement.innerHTML = `
                <div class="history-info">
                    <div class="history-round">Round #${game.round}</div>
                    <div class="history-multiplier">${game.multiplier.toFixed(2)}x (${game.mode})</div>
                </div>
                <div class="history-result ${game.won ? 'win' : 'loss'}">
                    ${game.won ? '+$' + this.formatNumber(game.winnings) : '-$' + this.formatNumber(game.bet)}
                </div>
            `;
            historyList.appendChild(historyElement);
        });
    }
    
    // Leaderboard
    updateLeaderboard() {
        const accounts = this.getAccounts();
        const sortedAccounts = accounts
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 10);
        
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = '';
        
        sortedAccounts.forEach((account, index) => {
            const item = document.createElement('div');
            item.className = `leaderboard-item ${account.username === this.currentUser?.username ? 'current-user' : ''}`;
            item.innerHTML = `
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-username">
                    ${account.username}
                    ${account.rank === 'owner' ? '<span class="rank-badge owner">Owner</span>' : ''}
                    ${account.rank === 'admin' ? '<span class="rank-badge admin">Admin</span>' : ''}
                    ${account.rank === 'elite' ? '<span class="rank-badge elite">Elite</span>' : ''}
                </div>
                <div class="leaderboard-balance">$${this.formatNumber(account.balance)}</div>
            `;
            leaderboardList.appendChild(item);
        });
    }
    
    updateDifficultyDisplay() {
        const difficultyValue = document.getElementById('difficultyValue');
        const difficultyFill = document.getElementById('difficultyFill');
        const difficultyDescription = document.getElementById('difficultyDescription');
        
        if (difficultyValue) {
            difficultyValue.textContent = this.currentDifficulty.toFixed(1) + 'x';
        }
        
        if (difficultyFill) {
            // Calculate fill percentage based on difficulty range
            const minDiff = this.config.difficultyRange[0];
            const maxDiff = this.config.difficultyRange[1];
            const percentage = ((this.currentDifficulty - minDiff) / (maxDiff - minDiff)) * 100;
            difficultyFill.style.width = percentage + '%';
            
            // Change color based on difficulty (higher difficulty = more dangerous)
            if (this.currentDifficulty <= 0.8) {
                // Very low difficulty - can get very close to 100%
                difficultyFill.style.background = 'linear-gradient(90deg, #00ff88 0%, #00d4aa 100%)';
            } else if (this.currentDifficulty <= 1.5) {
                // Medium difficulty
                difficultyFill.style.background = 'linear-gradient(90deg, #feca57 0%, #ff9ff3 100%)';
            } else {
                // High difficulty - breaks much earlier
                difficultyFill.style.background = 'linear-gradient(90deg, #ff6b6b 0%, #ee5a24 100%)';
            }
        }
        
        if (difficultyDescription) {
            // Calculate max possible progress for this difficulty
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
    
    // Admin System
    handleBalanceClick() {
        if (!this.currentUser || this.currentUser.rank !== 'owner') return;
        
        this.balanceClickCount++;
        
        if (this.balanceClickCount >= 5) {
            this.openAdminConsole();
            this.balanceClickCount = 0;
        }
        
        clearTimeout(this.balanceClickTimeout);
        this.balanceClickTimeout = setTimeout(() => {
            this.balanceClickCount = 0;
        }, 2000);
    }
    
    openAdminConsole() {
        document.getElementById('adminModal').style.display = 'block';
        
        // Focus on command input and add Enter key support
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
    
    executeAdminCommand() {
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
        
        // Parse command - split by spaces and filter out empty strings
        const parts = command.split(/\s+/).filter(part => part.length > 0);
        const cmd = parts[0].toLowerCase();
        
        console.log('Command parts:', parts);
        console.log('Command:', cmd);
        console.log('Parts length:', parts.length);
        
        if (cmd === '.give' && parts.length >= 3) {
            // Handle cases where amount might have spaces or special characters
            const player = parts[1];
            const amountStr = parts.slice(2).join(' '); // Join remaining parts in case amount has spaces
            this.handleGiveCommand(player, amountStr);
        } else if (cmd === '.remove' && parts.length >= 3) {
            const player = parts[1];
            const amountStr = parts.slice(2).join(' '); // Join remaining parts in case amount has spaces
            this.handleRemoveCommand(player, amountStr);
        } else {
            this.logAdminCommand(`Invalid command format. Expected: .give player amount or .remove player amount`);
            this.logAdminCommand(`Received: "${command}" (${parts.length} parts)`);
        }
        
        // Clear input
        commandInput.value = '';
    }
    
    handleGiveCommand(player, amountStr) {
        console.log('Give command - Player:', player, 'Amount string:', amountStr);
        
        // Clean the amount string - remove common currency symbols and commas
        const cleanAmountStr = amountStr.replace(/[$,\s]/g, '');
        const amount = parseFloat(cleanAmountStr);
        
        console.log('Cleaned amount string:', cleanAmountStr);
        console.log('Parsed amount:', amount);
        
        if (isNaN(amount) || amount <= 0) {
            this.logAdminCommand(`Invalid amount: "${amountStr}". Amount must be a positive number.`);
            return;
        }
        
        const accounts = this.getAccounts();
        const targetUser = accounts.find(acc => acc.username === player);
        
        if (!targetUser) {
            this.logAdminCommand(`User "${player}" not found`);
            return;
        }
        
        targetUser.balance += amount;
        this.saveAccounts(accounts);
        this.updateLeaderboard();
        this.logAdminCommand(`✓ Gave $${this.formatNumber(amount)} to ${player}. New balance: $${this.formatNumber(targetUser.balance)}`);
    }
    
    handleRemoveCommand(player, amountStr) {
        console.log('Remove command - Player:', player, 'Amount string:', amountStr);
        
        // Clean the amount string - remove common currency symbols and commas
        const cleanAmountStr = amountStr.replace(/[$,\s]/g, '');
        const amount = parseFloat(cleanAmountStr);
        
        console.log('Cleaned amount string:', cleanAmountStr);
        console.log('Parsed amount:', amount);
        
        if (isNaN(amount) || amount <= 0) {
            this.logAdminCommand(`Invalid amount: "${amountStr}". Amount must be a positive number.`);
            return;
        }
        
        const accounts = this.getAccounts();
        const targetUser = accounts.find(acc => acc.username === player);
        
        if (!targetUser) {
            this.logAdminCommand(`User "${player}" not found`);
            return;
        }
        
        const oldBalance = targetUser.balance;
        targetUser.balance = Math.max(0, targetUser.balance - amount);
        this.saveAccounts(accounts);
        this.updateLeaderboard();
        this.logAdminCommand(`✓ Removed $${this.formatNumber(amount)} from ${player}. Balance: $${this.formatNumber(oldBalance)} → $${this.formatNumber(targetUser.balance)}`);
    }
    
    logAdminCommand(message) {
        const log = document.getElementById('adminLog');
        const timestamp = new Date().toLocaleTimeString();
        log.innerHTML += `[${timestamp}] ${message}\n`;
        log.scrollTop = log.scrollHeight;
    }
    
    // Utility Functions
    formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    generateRandomSeed() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    
    hashSeed(seed) {
        // Simple hash function (in production, use proper crypto)
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
    
    seedToNumber(seed, index) {
        // Convert seed to number between 0 and 1
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash + index) / 2147483647; // Normalize to 0-1
    }
    
    loadAccounts() {
        console.log('Loading accounts...');
        // Initialize with owner account if it doesn't exist
        const accounts = this.getAccounts();
        console.log('Current accounts:', accounts.length);
        
        if (!accounts.find(acc => acc.username === 'iydl')) {
            console.log('Creating owner account...');
            const ownerAccount = {
                username: 'iydl',
                password: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // "password" hashed
                balance: 100, // All users start with $100
                rank: 'owner',
                createdAt: new Date().toISOString(),
                gamesPlayed: 0,
                totalWon: 0,
                totalLost: 0
            };
            accounts.push(ownerAccount);
            this.saveAccounts(accounts);
            console.log('Owner account created');
        } else {
            console.log('Owner account already exists');
        }
    }
}

// Global Functions
function openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
}

function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

function logout() {
    game.logout();
}

function placeBet() {
    game.placeBet();
}

function cashOut() {
    game.cashOut();
}

function handleBalanceClick() {
    game.handleBalanceClick();
}

function executeAdminCommand() {
    game.executeAdminCommand();
}

function fillCommand(command) {
    const commandInput = document.getElementById('adminCommandInput');
    if (commandInput) {
        commandInput.value = command;
        commandInput.focus();
    }
}

function setBetAmount(amount) {
    if (game && game.currentUser) {
        const maxBet = game.currentUser.balance;
        const betAmount = Math.min(amount, maxBet);
        document.getElementById('betAmount').value = betAmount;
        
        // Update button states
        document.querySelectorAll('.quick-bet-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }
}

function setBetFraction(fraction) {
    if (game && game.currentUser) {
        let betAmount;
        
        if (fraction === 1) {
            // ALL IN: Use one cent less than max balance for safety
            betAmount = Math.max(0, game.currentUser.balance - 0.01);
        } else {
            // Other fractions: Use exact fraction
            betAmount = game.currentUser.balance * fraction;
        }
        
        document.getElementById('betAmount').value = betAmount.toFixed(2);
        
        // Update button states
        document.querySelectorAll('.fraction-bet-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }
}

// Debug function to check data storage
function debugDataStorage() {
    console.log('=== DATA STORAGE DEBUG ===');
    const accounts = JSON.parse(localStorage.getItem('blocksmith_accounts') || '[]');
    console.log('All accounts in localStorage:', accounts);
    
    const currentUser = JSON.parse(localStorage.getItem('blocksmith_current_user') || 'null');
    console.log('Current user in localStorage:', currentUser);
    
    if (game && game.currentUser) {
        console.log('Game current user:', game.currentUser);
    }
    console.log('=== END DEBUG ===');
}

// Test function to manually change balance
function testBalanceChange(amount) {
    if (game && game.currentUser) {
        console.log(`Testing balance change: $${game.currentUser.balance} → $${amount}`);
        game.currentUser.balance = amount;
        game.saveUserData();
        game.updateUI();
        console.log('Balance updated and saved');
    } else {
        console.log('No current user found');
    }
}

// Test function to show loading screen
function testLoading(status = 'Testing...') {
    if (game) {
        game.showLoading(status);
        setTimeout(() => {
            game.hideLoading();
        }, 3000);
    }
}

// Test function to verify ALL IN safety
function testAllIn() {
    if (game && game.currentUser) {
        console.log('Testing ALL IN safety...');
        console.log('Current balance:', game.currentUser.balance);
        
        // Simulate ALL IN click
        const allInBtn = document.querySelector('.fraction-bet-btn[onclick*="setBetFraction(1)"]');
        if (allInBtn) {
            allInBtn.click();
            const betAmount = parseFloat(document.getElementById('betAmount').value);
            console.log('ALL IN bet amount:', betAmount);
            console.log('Expected amount (balance - 0.01):', game.currentUser.balance - 0.01);
            console.log('Safety margin preserved:', betAmount < game.currentUser.balance);
        }
    } else {
        console.log('No current user found');
    }
}

// Test function to verify difficulty system
function testDifficulty() {
    console.log('=== Testing Difficulty System ===');
    const testDifficulties = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
    
    testDifficulties.forEach(diff => {
        const maxProgress = Math.max(0.1, 1.0 - (diff - 0.5) * 0.3);
        const maxProgressPercent = Math.round(maxProgress * 100);
        console.log(`Difficulty ${diff.toFixed(1)}x: Max progress ~${maxProgressPercent}%`);
    });
}

// Test function to debug admin commands
function testAdminCommand(command) {
    console.log('=== Testing Admin Command ===');
    console.log('Command:', command);
    
    const parts = command.split(/\s+/).filter(part => part.length > 0);
    console.log('Parts:', parts);
    console.log('Parts length:', parts.length);
    
    if (parts.length >= 3) {
        const cmd = parts[0].toLowerCase();
        const player = parts[1];
        const amountStr = parts.slice(2).join(' ');
        const cleanAmountStr = amountStr.replace(/[$,\s]/g, '');
        const amount = parseFloat(cleanAmountStr);
        
        console.log('Command:', cmd);
        console.log('Player:', player);
        console.log('Amount string:', amountStr);
        console.log('Cleaned amount:', cleanAmountStr);
        console.log('Parsed amount:', amount);
        console.log('Is valid amount:', !isNaN(amount) && amount > 0);
    }
}

// Initialize Game
let game;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    try {
        game = new BlocksmithGame();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});
