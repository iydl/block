# The Blocksmith - Mining Game

A sophisticated blockchain-themed mining game with provably fair mechanics, user accounts, and admin controls.

## Features

### Core Game Mechanics
- **Dual Mode System**: 90% Normal mode (steady multipliers up to 2.5x) and 10% Hot mode (rapid multipliers up to 10x)
- **Block Mining Simulation**: Visual progress bar representing block completion
- **Orphan Events**: Exponential risk increase as block approaches 100% completion
- **Real-time Multiplier**: Dynamic multiplier based on block progress and mode

### Provably Fair System
- **Seed-based Outcomes**: Server and client seeds determine game results
- **Transparent Verification**: Players can verify game outcomes using provided seeds
- **Pre-determined Results**: All outcomes are calculated before the game starts

### User Management
- **Account System**: Register/login with secure password hashing
- **Balance Management**: Starting balance of $1000
- **Password Changes**: Secure password update with current password verification
- **Game Statistics**: Track games played, total won/lost

### Ranking System
- **Owner**: Full administrative privileges (username: "iydl")
- **Admin**: Extensive permissions, cannot grant owner rank
- **Elite**: Special privileges granted by owners/admins
- **User**: Standard player rank

### Admin Console
- **Hidden Access**: Click balance 5 times to open (Owner/Admin only)
- **Money Management**: Give/remove money from players
- **Rank Management**: Set player ranks (with restrictions)
- **Command Logging**: All admin actions are logged

### Social Features
- **Live Leaderboard**: Top 10 players by balance
- **Recent Games**: Last 10 game results with details
- **Real-time Updates**: Live balance and game state updates

## How to Play

1. **Register/Login**: Create an account or login with existing credentials
2. **Place Bet**: Enter your bet amount and click "Place Bet"
3. **Watch Progress**: Monitor the block progress and multiplier
4. **Cash Out**: Click "Cash Out" to secure your winnings
5. **Risk Management**: Higher progress = higher risk of orphan events

## Game Modes

### Normal Mode (90% chance)
- Multiplier increases by +0.1x every 10% progress
- Maximum multiplier: 2.5x
- Steady, predictable growth

### Hot Mode (10% chance)
- Multiplier increases by +0.25x every 5% progress
- Maximum multiplier: 10x
- High-risk, high-reward gameplay

## Admin Commands

Access the admin console by clicking your balance 5 times (Owner/Admin only):

- `.give [amount] [player]` - Give money to a player
- `.remove [amount] [player]` - Remove money from a player
- `.rank [player] [rank]` - Set a player's rank

## Technical Details

### Storage
- User accounts stored in localStorage (temporary solution)
- Game results and leaderboard data persisted locally
- All data survives browser refreshes

### Security
- Password hashing using SHA-256
- Provably fair seed generation
- Admin action logging
- Input validation and sanitization

### Browser Compatibility
- Modern browsers with ES6+ support
- LocalStorage required for data persistence
- Responsive design for desktop and mobile

## Default Accounts

- **Owner**: Username: `iydl`, Password: `password`
- **Admin**: Can be created by owner using admin console
- **Elite**: Can be granted by owner/admin
- **Users**: Standard players with $1000 starting balance

## Installation

1. Download all files to a web server directory
2. Open `index.html` in a web browser
3. Register a new account or login with existing credentials
4. Start playing!

## File Structure

- `index.html` - Main game interface
- `styles.css` - Game styling and responsive design
- `game.js` - Core game logic and mechanics
- `crypto-js.min.js` - Cryptographic utilities
- `README.md` - This documentation

## Future Enhancements

- Database integration for persistent storage
- Real-time multiplayer features
- Advanced provably fair verification tools
- Mobile app development
- Enhanced admin analytics
- Tournament system
- Achievement system

Enjoy mining blocks and managing your balance in The Blocksmith!
