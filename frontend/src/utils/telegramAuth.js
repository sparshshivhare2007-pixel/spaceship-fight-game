export const initTelegramAuth = () => {
  // Check if running in Telegram WebApp
  if (window.Telegram && window.Telegram.WebApp) {
    const webApp = window.Telegram.WebApp;
    webApp.ready();
    webApp.expand();
    
    // Get user data
    const user = webApp.initDataUnsafe?.user;
    
    if (user) {
      return {
        id: user.id,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        photoUrl: user.photo_url,
        languageCode: user.language_code
      };
    }
  }
  
  // Mock user for development
  return {
    id: Date.now(),
    username: 'player_' + Math.floor(Math.random() * 1000),
    firstName: 'Guest',
    isMock: true
  };
};

export const getTelegramInitData = () => {
  if (window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp.initData;
  }
  return '';
};
