/**
 * Example: Bulk role assignment
 *
 * Usage:
 *   node examples/bulk-role-assign.js
 *
 * Edit the CONFIG object below before running
 */

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// CONFIGURATION - Edit these values
// ============================================
const CONFIG = {
    roleName: 'Miembros',           // Role to assign
    users: ['user1', 'user2'],      // Discord usernames
    dryRun: true                    // Set to false to actually assign
};
// ============================================

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

    console.log(`✅ Logged in as ${client.user.tag}`);

    const guild = process.env.DISCORD_GUILD_ID
        ? await client.guilds.fetch(process.env.DISCORD_GUILD_ID)
        : client.guilds.cache.first();

    console.log(`📋 Guild: ${guild.name}`);

    // Find role
    const roles = await guild.roles.fetch();
    const role = roles.find(r => r.name.toLowerCase() === CONFIG.roleName.toLowerCase());

    if (!role) {
        console.log(`❌ Role not found: ${CONFIG.roleName}`);
        console.log('Available roles:', roles.map(r => r.name).join(', '));
        client.destroy();
        process.exit(1);
    }

    console.log(`✅ Found role: ${role.name}`);

    // Find members
    const members = await guild.members.fetch();
    const results = { success: [], notFound: [], error: [] };

    for (const username of CONFIG.users) {
        const member = members.find(m => m.user.username.toLowerCase() === username.toLowerCase());

        if (!member) {
            results.notFound.push(username);
            continue;
        }

        if (member.roles.cache.has(role.id)) {
            console.log(`⚠️ ${username} already has role ${role.name}`);
            continue;
        }

        if (CONFIG.dryRun) {
            console.log(`🔍 [DRY RUN] Would assign ${role.name} to ${username}`);
            results.success.push(username);
        } else {
            try {
                await member.roles.add(role, 'Bulk assignment via CLI');
                console.log(`✅ Assigned ${role.name} to ${username}`);
                results.success.push(username);
            } catch (err) {
                console.log(`❌ Failed to assign to ${username}: ${err.message}`);
                results.error.push({ username, error: err.message });
            }
        }
    }

    console.log('\n📊 Summary:');
    console.log(`   Success: ${results.success.length}`);
    console.log(`   Not found: ${results.notFound.length}`);
    console.log(`   Errors: ${results.error.length}`);

    if (CONFIG.dryRun) {
        console.log('\n⚠️ DRY RUN - No changes made. Set dryRun: false to apply.');
    }

    console.log('\n🎉 Done!');
    client.destroy();
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
