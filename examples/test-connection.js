/**
 * Example: Test bot connection
 *
 * Usage:
 *   node examples/test-connection.js
 */

import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds]
});

async function main() {
    console.log('🔄 Connecting to Discord...\n');

    if (!process.env.DISCORD_TOKEN) {
        console.log('❌ DISCORD_TOKEN not found in .env');
        console.log('   Create a .env file with: DISCORD_TOKEN=your_token_here');
        process.exit(1);
    }

    await client.login(process.env.DISCORD_TOKEN);

    await new Promise(resolve => {
        if (client.isReady()) resolve();
        else client.once('ready', resolve);
    });

    console.log('✅ Connection successful!\n');
    console.log('═'.repeat(40));
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`📋 ID: ${client.user.id}`);
    console.log(`📅 Created: ${client.user.createdAt.toDateString()}`);
    console.log('═'.repeat(40));
    console.log(`\n📊 Servers (${client.guilds.cache.size}):`);
    client.guilds.cache.forEach(g => {
        console.log(`   - ${g.name} (${g.memberCount} members)`);
    });
    console.log('\n🎉 Bot is ready to use!\n');

    client.destroy();
}

main().catch(err => {
    console.error('\n❌ Connection failed:', err.message);
    console.log('\nCommon issues:');
    console.log('   - Invalid token');
    console.log('   - Bot not invited to server');
    console.log('   - Network issues');
    process.exit(1);
});
