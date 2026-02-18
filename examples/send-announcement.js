/**
 * Example: Send an announcement to a channel
 *
 * Usage:
 *   node examples/send-announcement.js
 *
 * Edit the CONFIG object below before running
 */

import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURATION - Edit these values
// ============================================
const CONFIG = {
    channelId: '123456789012345678',  // Target channel ID
    announcement: {
        title: '📢 Server Announcement',
        description: 'This is an important announcement!',
        color: '#FF6B6B',
        fields: [
            { name: 'Topic 1', value: 'Details here', inline: false },
            { name: 'Topic 2', value: 'More details', inline: false }
        ],
        footer: 'Server Administration'
    }
};
// ============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

async function main() {
    console.log('🔄 Connecting...');

    await client.login(process.env.DISCORD_TOKEN);

    await new Promise(resolve => {
        if (client.isReady()) resolve();
        else client.once('ready', resolve);
    });

    console.log(`✅ Logged in as ${client.user.tag}`);

    const channel = await client.channels.fetch(CONFIG.channelId);
    if (!channel) throw new Error('Channel not found');

    console.log(`📋 Channel: #${channel.name}`);

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle(CONFIG.announcement.title)
        .setDescription(CONFIG.announcement.description)
        .setColor(CONFIG.announcement.color)
        .addFields(CONFIG.announcement.fields)
        .setFooter({ text: CONFIG.announcement.footer })
        .setTimestamp();

    const message = await channel.send({ embeds: [embed] });

    console.log(`✅ Announcement sent! (ID: ${message.id})`);
    console.log('\n🎉 Done!');

    client.destroy();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
