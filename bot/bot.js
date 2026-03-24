const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://your-game-domain.com';
const API_URL = process.env.API_URL || 'http://localhost:3001';

const bot = new Telegraf(BOT_TOKEN);

// Start command
bot.start((ctx) => {
  const welcomeMessage = `
🚀 **SPACESHIP FIGHT GAME** 🚀
╔══════════════════════════════════╗
║  Multiplayer Spaceship Combat!   ║
╚══════════════════════════════════╝

**✨ GAME MODES:**
⚔️ 1v1 Duels - 2 players
👥 2v2 Team Battles - 4 players  
🔫 Squad Mode - 4 player battle royale
🚀 4v4 Epic Battles - 8 players

**🎮 HOW TO PLAY:**
1. Click PLAY NOW below
2. Create room or join with Room ID
3. Get all players ready
4. Host starts the game!
5. Use ← → ↑ ↓ to move
6. Press SPACE to shoot!

**🏆 FEATURES:**
• Real-time multiplayer combat
• Room-based matchmaking
• Host-controlled game start
• Leaderboards & rankings
• Telegram integrated

**💡 TIP:** Share your Room ID with friends to play together!
  `;

  ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🎮 PLAY NOW', APP_URL)],
      [Markup.button.callback('🏆 Leaderboard', 'leaderboard'), Markup.button.callback('ℹ️ Help', 'help')],
      [Markup.button.url('📢 Join Community', 'https://t.me/your_channel')]
    ])
  });
});

// Leaderboard callback
bot.action('leaderboard', async (ctx) => {
  try {
    const response = await axios.get(`${API_URL}/api/leaderboard`);
    const leaderboard = response.data;
    
    if (leaderboard.length === 0) {
      return ctx.editMessageText('🏆 No scores yet! Be the first to play! 🏆');
    }
    
    let message = '🏆 **TOP PLAYERS** 🏆\n\n';
    leaderboard.forEach((player, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📌';
      message += `${medal} *${player.player_name}*\n`;
      message += `   Score: ${player.total_score} pts\n`;
      message += `   Games: ${player.games_played} | Wins: ${player.games_won}\n\n`;
    });
    
    await ctx.editMessageText(message, { parse_mode: 'Markdown' });
    
    // Add back button
    await ctx.reply('⬅️ Back to main menu?', Markup.inlineKeyboard([
      [Markup.button.callback('⬅️ Back', 'back')]
    ]));
  } catch (error) {
    console.error('Leaderboard error:', error);
    ctx.reply('❌ Error loading leaderboard. Please try again.');
  }
});

// Help callback
bot.action('help', (ctx) => {
  const helpMessage = `
🎮 **GAME CONTROLS**

**Movement:** Arrow Keys (← → ↑ ↓)
**Shoot:** Spacebar
**Ready:** Click ready button in lobby
**Start:** Host clicks start when all ready

**📋 ROOM CODES**
• Create room → Get 8-digit code
• Share code with friends
• Friends join via "Join Room"

**⚙️ GAME RULES**
• Last ship standing wins
• Each hit deals 25 damage
• 100 health per ship
• Eliminations give +10 points

**🛠️ COMMANDS**
/start - Launch game
/help - Show this menu
/leaderboard - View rankings
/about - Game info
  `;
  
  ctx.editMessageText(helpMessage, { parse_mode: 'Markdown' });
});

// Back callback
bot.action('back', (ctx) => {
  ctx.deleteMessage();
  const welcomeMessage = `
🚀 **SPACESHIP FIGHT GAME** 🚀

Click PLAY NOW to start battling!
  `;
  
  ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.webApp('🎮 PLAY NOW', APP_URL)],
      [Markup.button.callback('🏆 Leaderboard', 'leaderboard'), Markup.button.callback('ℹ️ Help', 'help')]
    ])
  });
});

// Help command
bot.help((ctx) => {
  ctx.reply(`
🎮 **SPACESHIP FIGHT - HELP**

**Quick Start:**
1. Click "PLAY NOW" button
2. Enter your name
3. Create room or join with code
4. Wait for players
5. Click READY
6. Host clicks START

**Controls:**
• Arrow Keys - Move spaceship
• Spacebar - Fire lasers

**Game Modes:**
• 1v1: 2 players duel
• 2v2: 4 players team battle
• Squad: 4 player free-for-all
• 4v4: 8 player team war

More info: /about
  `, { parse_mode: 'Markdown' });
});

// About command
bot.command('about', (ctx) => {
  ctx.reply(`
🚀 **ABOUT SPACESHIP FIGHT**

Version: 1.0.0
Platform: Telegram Mini App
Developer: Your Name

**Features:**
• Real-time multiplayer
• Room-based matchmaking
• 4 exciting game modes
• Global leaderboards
• Smooth canvas gameplay

**Tech Stack:**
• React + Canvas
• Node.js + Socket.io
• Telegram Bot API
• SQLite database

Enjoy the game! ⭐
  `);
});

// Leaderboard command
bot.command('leaderboard', async (ctx) => {
  try {
    const response = await axios.get(`${API_URL}/api/leaderboard`);
    const leaderboard = response.data;
    
    if (leaderboard.length === 0) {
      return ctx.reply('🏆 No scores yet! Play now to top the leaderboard! 🏆');
    }
    
    let message = '🏆 **LEADERBOARD** 🏆\n\n';
    leaderboard.forEach((player, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📌';
      message += `${medal} *${player.player_name}*\n`;
      message += `   Total Score: ${player.total_score}\n`;
      message += `   Games: ${player.games_played} | Wins: ${player.games_won}\n\n`;
    });
    
    ctx.reply(message, { parse_mode: 'Markdown' });
  } catch (error) {
    ctx.reply('❌ Error loading leaderboard');
  }
});

// Stats command
bot.command('stats', async (ctx) => {
  try {
    const response = await axios.get(`${API_URL}/health`);
    const stats = response.data;
    
    ctx.reply(`
📊 **SERVER STATISTICS**

Active Rooms: ${stats.rooms || 0}
Server Status: ${stats.status}
Uptime: ${Math.floor(process.uptime())} seconds
    `);
  } catch (error) {
    ctx.reply('❌ Server status unavailable');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('❌ An error occurred. Please try again.');
});

// Launch bot
bot.launch().then(() => {
  console.log(`
  🤖 SPACESHIP FIGHT BOT 🤖
  ═══════════════════════════════
  🚀 Bot is running!
  📱 Telegram: @${bot.botInfo.username}
  🌐 WebApp URL: ${APP_URL}
  🎮 Game Server: ${API_URL}
  ═══════════════════════════════
  `);
});

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
