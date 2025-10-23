const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cron = require('node-cron');
const express = require('express');

// SERVIDOR WEB PARA 24/7
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    bot: 'Bybit Listing Bot',
    message: '🤖 Bot funcionando 24/7 no Koyeb! 🚀'
  });
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor web na porta ${PORT}`);
});

// CONFIGURAÇÃO
const config = {
  discordToken: process.env.DISCORD_TOKEN || 'SEU_TOKEN_AQUI', 
  channelId: '1430196421168070717',
  checkInterval: '*/2 * * * *'
};

// Lista para armazenar anúncios já detectados
let detectedAnnouncements = new Set();

// Cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// FUNÇÃO PARA BYBIT - PÁGINA DE ANÚNCIOS
async function checkBybitListings() {
    try {
        console.log('🔍 A verificar anúncios da Bybit...');

        const response = await axios.get('https://announcements.bybit.com/?category=new_crypto&page=1', {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = response.data;

        // Extrair títulos e links dos anúncios
        const announcements = [];

        // Procura por elementos de anúncio na estrutura da Bybit
        const articleRegex = /<article[\s\S]*?<\/article>/g;
        let articleMatch;

        while ((articleMatch = articleRegex.exec(html)) !== null) {
            const articleHtml = articleMatch[0];

            // Extrair título e link
            const titleMatch = articleHtml.match(/<h3[^>]*>([^<]*)<\/h3>/);
            const linkMatch = articleHtml.match(/<a[^>]*href="([^"]*)"[^>]*>/);

            if (titleMatch && linkMatch) {
                const title = titleMatch[1].trim();
                const link = linkMatch[1];

                const fullLink = link.startsWith('http') ? link : `https://announcements.bybit.com${link}`;
                const announcementKey = `BYBIT_${title}`;

                // Só adiciona se for novo
                if (!detectedAnnouncements.has(announcementKey)) {
                    announcements.push({
                        title: title,
                        link: fullLink,
                        key: announcementKey
                    });
                }
            }
        }

        // Processar novos anúncios
        for (const announcement of announcements.slice(0, 5)) {
            detectedAnnouncements.add(announcement.key);

            const embed = new EmbedBuilder()
                .setTitle('🔵 🚀 NOVA LISTAGEM BYBIT!')
                .setDescription(`**${announcement.title}**`)
                .addFields(
                    { name: '🔗 Anúncio Oficial', value: `[Clique aqui para ver](${announcement.link})`, inline: true },
                    { name: '⏰ Detetado', value: new Date().toLocaleString('pt-PT'), inline: true },
                    { name: '💎 Exchange', value: 'Bybit', inline: true }
                )
                .setColor(0x0080FF)
                .setTimestamp()
                .setFooter({ text: 'Bybit Crypto Listings • Monitor Ativo' });

            const channel = client.channels.cache.get(config.channelId);
            if (channel) {
                await channel.send({ 
                    content: '@everyone 📢 **🚀🚀🚀 NOVA LISTAGEM BYBIT DETETADA! 🚀🚀🚀**',
                    embeds: [embed] 
                });
                console.log(`🚀 NOVA LISTAGEM BYBIT: ${announcement.title}`);
            }
        }

        if (announcements.length === 0) {
            console.log('ℹ️ Nenhum anúncio novo na Bybit');
        }

    } catch (error) {
        console.error('❌ Erro ao verificar anúncios Bybit:', error.message);
    }
}

// Quando o bot fica online
client.once('ready', () => {
    console.log(`✅ Bot online como ${client.user.tag}`);
    console.log(`📊 Monitorizando anúncios Bybit a cada 2 minutos...`);

    // Agenda verificações periódicas
    cron.schedule(config.checkInterval, () => {
        checkBybitListings();
    });

    // Verifica imediatamente ao iniciar
    checkBybitListings();
});

// Comando simples de teste
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '!listings') {
        await checkBybitListings();
        message.reply('✅ Verificação de anúncios executada!');
    }

    if (message.content === '!status') {
        message.reply(`🤖 Bot ativo! Monitorizando anúncios Bybit. Anúncios detectados: ${detectedAnnouncements.size}`);
    }

    if (message.content === '!test') {
        message.reply('✅ Bot está funcionando!');
    }
});

// Inicia o bot
client.login(config.discordToken)
    .then(() => {
        console.log('🚀 A iniciar bot...');
    })
    .catch(error => {
        console.error('❌ Erro ao iniciar bot:', error.message);
    });

console.log('📝 Bot carregado! A iniciar...');
