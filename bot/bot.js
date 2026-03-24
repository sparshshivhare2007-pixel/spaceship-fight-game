const { Telegraf } = require('telegraf');
const dotenv = require('dotenv');

dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const APP_URL = process.env.APP_URL || 'https://your-game-domain.com';

const bot = new Telegraf(BOT_TOKEN);

// Start command - creates WebApp button
bot.start((ctx) => {
  const welcomeMessage = `
🚀 **Spaceship Fight Game** 🚀

Battle against friends in epic spaceship combat!

**Game Modes:**
• ⚔️ 1v1 Duels
• 👥 2v2 Team Battles  
• 🔫 4-Player Squad
• 🚀 8-Player Epic Battles

**How to Play:**
1. Click the button below to open the game
2. Create a room or join with Room ID
3. Only the host can start the game
4. Use arrow keys to move, space to shoot!

**Features:**
✅ Create private rooms with unique ID
✅ Join friends via Room ID
✅ Host-only start control
✅ Real-time multiplayer combat
  `;

  ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🎮 Play Now', web_app: { url: APP_URL } }]
      ]
    }
  });
});

// Help command
bot.help((ctx) => {
  ctx.reply(`
🎮 **Game Commands:**

/start - Launch the game
/help - Show this help message
/about - Game information

**Game Controls:**
Arrow Keys - Move spaceship
Spacebar - Shoot lasers
  `);
});

// About command
bot.about((ctx) => {
  ctx.reply(`
🚀 **Spaceship Fight** v1.0

Multiplayer spaceship combat game built as Telegram Mini App.

• Real-time battles
• Room-based matchmaking
• Host-controlled start
• Multiple game modes

Enjoy the game! ⭐
  `);
});

// Set bot commands in BotFather format
bot.telegram.setMyCommands([
  { command: 'start', description: 'Launch the game' },
  { command: 'help', description: 'Show game controls' },
  { command: 'about', description: 'Game information' }
]);

bot.launch();

console.log('🤖 Spaceship Fight Bot is running...');

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
