/**
 * Example: List server information (roles, channels, members)
 *
 * Usage:
 *   node examples/list-server-info.js
 */

import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

async function main() {
    console.log('🔄 Connecting...');

    await client.login(process.env.DISCORD_TOKEN);

    await new Promise(resolve => {
        if (client.isReady()) resolve();
        else client.once('ready', resolve);
    });

    console.log(`✅ Logged in as ${client.user.tag}\n`);

    const guild = process.env.DISCORD_GUILD_ID
        ? await client.guilds.fetch(process.env.DISCORD_GUILD_ID)
        : client.guilds.cache.first();

    console.log('═'.repeat(50));
    console.log(`📋 SERVER: ${guild.name}`);
    console.log(`   ID: ${guild.id}`);
    console.log(`   Owner: ${guild.ownerId}`);
    console.log('═'.repeat(50));

    // Roles
    console.log('\n📛 ROLES:\n');
    const roles = await guild.roles.fetch();
    roles.filter(r => r.name !== '@everyone')
        .sorted((a, b) => b.position - a.position)
        .forEach(r => {
            console.log(`   ${r.hexColor} ${r.name.padEnd(25)} (${r.members.size} members)`);
        });

    // Channels
    console.log('\n📁 CHANNELS:\n');
    const channels = await guild.channels.fetch();

    const byType = {
        [ChannelType.GuildText]: '📝 Text',
        [ChannelType.GuildVoice]: '🔊 Voice',
        [ChannelType.GuildCategory]: '📁 Category',
        [ChannelType.GuildAnnouncement]: '📢 Announcement',
        [ChannelType.GuildForum]: '💬 Forum'
    };

    channels.sorted((a, b) => {
        if (a.type === ChannelType.GuildCategory && b.type !== ChannelType.GuildCategory) return -1;
        if (a.type !== ChannelType.GuildCategory && b.type === ChannelType.GuildCategory) return 1;
        return a.position - b.position;
    }).forEach(c => {
        const type = byType[c.type] || '❓ Unknown';
        console.log(`   ${type.padEnd(12)} ${c.name}`);
    });

    // Members
    console.log('\n👥 MEMBERS:\n');
    const members = await guild.members.fetch();
    const humans = members.filter(m => !m.user.bot);
    const bots = members.filter(m => m.user.bot);

    console.log(`   Total: ${members.size}`);
    console.log(`   Humans: ${humans.size}`);
    console.log(`   Bots: ${bots.size}`);
    console.log('\n   Online now:');
    members.filter(m => m.presence?.status === 'online').first(10).forEach(m => {
        console.log(`      - ${m.user.username}`);
    });

    console.log('\n═'.repeat(50));
    console.log('🎉 Done!\n');

    client.destroy();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
