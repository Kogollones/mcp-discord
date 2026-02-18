/**
 * Example: Create a private channel with specific users
 *
 * Usage:
 *   node examples/create-private-channel.js
 *
 * Edit the CONFIG object below before running
 */

import { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURATION - Edit these values
// ============================================
const CONFIG = {
    channelName: 'test-private',
    users: ['kogollones'],        // Discord usernames
    roles: [],                     // Role names (optional)
    initialMessage: 'Welcome to the private channel!'
};
// ============================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
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

    console.log(`✅ Logged in as ${client.user.tag}`);

    const guild = process.env.DISCORD_GUILD_ID
        ? await client.guilds.fetch(process.env.DISCORD_GUILD_ID)
        : client.guilds.cache.first();

    console.log(`📋 Guild: ${guild.name}`);

    // Build permission overwrites
    const permissionOverwrites = [{
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel]
    }];

    // Add users
    const members = await guild.members.fetch();
    for (const username of CONFIG.users) {
        const member = members.find(m => m.user.username.toLowerCase() === username.toLowerCase());
        if (member) {
            permissionOverwrites.push({
                id: member.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            });
            console.log(`✅ Added user: ${member.user.username}`);
        } else {
            console.log(`⚠️ User not found: ${username}`);
        }
    }

    // Add roles
    if (CONFIG.roles.length > 0) {
        const roles = await guild.roles.fetch();
        for (const roleName of CONFIG.roles) {
            const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
            if (role) {
                permissionOverwrites.push({
                    id: role.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                });
                console.log(`✅ Added role: ${role.name}`);
            } else {
                console.log(`⚠️ Role not found: ${roleName}`);
            }
        }
    }

    // Create channel
    const channel = await guild.channels.create({
        name: CONFIG.channelName,
        type: ChannelType.GuildText,
        permissionOverwrites
    });

    console.log(`✅ Channel created: #${channel.name} (${channel.id})`);

    // Send initial message
    if (CONFIG.initialMessage) {
        await channel.send(CONFIG.initialMessage);
        console.log('✅ Initial message sent');
    }

    console.log('\n🎉 Done!');
    client.destroy();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
