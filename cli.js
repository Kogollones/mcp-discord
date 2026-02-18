#!/usr/bin/env node
/**
 * MCP Discord CLI - Command line tool for Discord operations
 * Usage: node cli.js <command> [options]
 */

import { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// Parse command line args
const args = process.argv.slice(2);
const command = args[0];

const COMMANDS = {
    'channel-create': {
        desc: 'Create a channel',
        args: '--name <name> [--private] [--users <user1,user2>] [--roles <role1,role2>]'
    },
    'channel-delete': {
        desc: 'Delete a channel',
        args: '--id <channel_id>'
    },
    'message-send': {
        desc: 'Send a message to a channel',
        args: '--channel <id> --message <text>'
    },
    'list-roles': {
        desc: 'List all roles',
        args: ''
    },
    'list-members': {
        desc: 'List all members',
        args: '[--limit <n>]'
    },
    'list-channels': {
        desc: 'List all channels',
        args: ''
    },
    'role-create': {
        desc: 'Create a role',
        args: '--name <name> [--color <hex>]'
    },
    'login': {
        desc: 'Test bot connection',
        args: ''
    }
};

function parseArgs(argList) {
    const result = {};
    for (let i = 0; i < argList.length; i++) {
        if (argList[i].startsWith('--')) {
            const key = argList[i].slice(2);
            const value = argList[i + 1]?.startsWith('--') ? true : argList[i + 1];
            result[key] = value;
            if (value !== true) i++;
        }
    }
    return result;
}

function showHelp() {
    console.log('\n📌 MCP Discord CLI\n');
    console.log('Usage: node cli.js <command> [options]\n');
    console.log('Commands:');
    for (const [cmd, info] of Object.entries(COMMANDS)) {
        console.log(`  ${cmd.padEnd(20)} ${info.desc}`);
        if (info.args) console.log(`                       ${info.args}`);
    }
    console.log('\nEnvironment variables (from .env):');
    console.log('  DISCORD_TOKEN       Bot token (required)');
    console.log('  DISCORD_GUILD_ID    Server ID (optional, for auto-select)');
    console.log('');
}

async function waitForReady() {
    return new Promise(resolve => {
        if (client.isReady()) return resolve();
        client.once('ready', resolve);
    });
}

async function getGuild(guildId) {
    if (guildId) return client.guilds.fetch(guildId);
    const guilds = client.guilds.cache;
    if (guilds.size === 1) return guilds.first();
    console.log('Available guilds:');
    guilds.forEach(g => console.log(`  ${g.name} (${g.id})`));
    throw new Error('Use --guild <id> to specify');
}

// Command handlers
const handlers = {
    'login': async (opts) => {
        console.log(`✅ Logged in as ${client.user.tag}`);
        console.log(`📋 Bot ID: ${client.user.id}`);
        const guilds = client.guilds.cache;
        console.log(`📋 Servers: ${guilds.size}`);
        guilds.forEach(g => console.log(`   - ${g.name} (${g.id})`));
    },

    'list-roles': async (opts, guild) => {
        const roles = await guild.roles.fetch();
        console.log(`\n📋 Roles in ${guild.name}:\n`);
        roles.filter(r => r.name !== '@everyone')
            .sorted((a, b) => b.position - a.position)
            .forEach(r => {
                const members = r.members.size;
                console.log(`  ${r.name.padEnd(25)} ${r.hexColor}  (${members} members)`);
            });
    },

    'list-members': async (opts, guild) => {
        const members = await guild.members.fetch();
        const limit = parseInt(opts.limit) || 50;
        console.log(`\n📋 Members in ${guild.name} (${members.size} total, showing ${limit}):\n`);
        members.first(limit).forEach(m => {
            const roles = m.roles.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ');
            console.log(`  ${m.user.username.padEnd(20)} ${roles ? `[${roles}]` : ''}`);
        });
    },

    'list-channels': async (opts, guild) => {
        const channels = await guild.channels.fetch();
        console.log(`\n📋 Channels in ${guild.name}:\n`);
        const categories = channels.filter(c => c.type === ChannelType.GuildCategory);
        const uncategorized = channels.filter(c => c.type !== ChannelType.GuildCategory && !c.parentId);

        categories.forEach(cat => {
            console.log(`\n📁 ${cat.name.toUpperCase()}`);
            channels.filter(c => c.parentId === cat.id)
                .sorted((a, b) => a.position - b.position)
                .forEach(c => {
                    const type = c.type === 0 ? '📝' : c.type === 2 ? '🔊' : c.type === 15 ? '📰' : '❓';
                    console.log(`   ${type} ${c.name} (${c.id})`);
                });
        });

        if (uncategorized.size > 0) {
            console.log(`\n📁 UNCATEGORIZED`);
            uncategorized.forEach(c => {
                const type = c.type === 0 ? '📝' : c.type === 2 ? '🔊' : '❓';
                console.log(`   ${type} ${c.name} (${c.id})`);
            });
        }
    },

    'channel-create': async (opts, guild) => {
        const name = opts.name;
        if (!name) throw new Error('--name required');

        const options = {
            name,
            type: ChannelType.GuildText,
            reason: 'Created via CLI'
        };

        if (opts.private === true || opts.users || opts.roles) {
            options.permissionOverwrites = [{
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            }];

            if (opts.users) {
                const members = await guild.members.fetch();
                for (const username of opts.users.split(',')) {
                    const member = members.find(m => m.user.username.toLowerCase() === username.toLowerCase());
                    if (member) {
                        options.permissionOverwrites.push({
                            id: member.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                        });
                    } else {
                        console.log(`⚠️ User not found: ${username}`);
                    }
                }
            }

            if (opts.roles) {
                const roles = await guild.roles.fetch();
                for (const roleName of opts.roles.split(',')) {
                    const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
                    if (role) {
                        options.permissionOverwrites.push({
                            id: role.id,
                            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                        });
                    } else {
                        console.log(`⚠️ Role not found: ${roleName}`);
                    }
                }
            }
        }

        const channel = await guild.channels.create(options);
        console.log(`✅ Channel created: #${channel.name} (${channel.id})`);
    },

    'channel-delete': async (opts, guild) => {
        const id = opts.id;
        if (!id) throw new Error('--id required');
        const channel = await guild.channels.fetch(id);
        await channel.delete('Deleted via CLI');
        console.log(`✅ Channel deleted: #${channel.name}`);
    },

    'message-send': async (opts, guild) => {
        const channelId = opts.channel;
        const message = opts.message;
        if (!channelId || !message) throw new Error('--channel and --message required');

        const channel = await guild.channels.fetch(channelId);
        const msg = await channel.send(message);
        console.log(`✅ Message sent to #${channel.name} (ID: ${msg.id})`);
    },

    'role-create': async (opts, guild) => {
        const name = opts.name;
        if (!name) throw new Error('--name required');

        const roleData = { name, reason: 'Created via CLI' };
        if (opts.color) roleData.color = opts.color;

        const role = await guild.roles.create(roleData);
        console.log(`✅ Role created: ${role.name} (${role.id})`);
    }
};

async function main() {
    if (!command || command === 'help' || command === '--help') {
        showHelp();
        process.exit(0);
    }

    if (!COMMANDS[command]) {
        console.log(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }

    if (!process.env.DISCORD_TOKEN) {
        console.log('❌ DISCORD_TOKEN not found in .env');
        process.exit(1);
    }

    try {
        await client.login(process.env.DISCORD_TOKEN);
        await waitForReady();

        const opts = parseArgs(args.slice(1));
        const guild = await getGuild(opts.guild || process.env.DISCORD_GUILD_ID);

        await handlers[command](opts, guild);

        client.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        client.destroy();
        process.exit(1);
    }
}

main();
