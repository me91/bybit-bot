// INSTALAR DEPENDÊNCIAS AUTOMATICAMENTE
const { execSync } = require('child_process');
try {
  console.log('📦 A instalar dependências...');
  execSync('npm install discord.js axios node-cron express', { stdio: 'inherit' });
  console.log('✅ Dependências instaladas!');
} catch (error) {
  console.log('⚠️ Já instalado');
}

// O TEU CÓDIGO CONTINUA AQUI...
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
// ... resto do teu código
