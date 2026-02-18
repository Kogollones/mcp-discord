# Examples

This folder contains practical examples for using the MCP Discord server.

## Quick Start

1. Copy `.env.example` to `.env` and add your bot token:
   ```bash
   cp .env.example .env
   # Edit .env with your token
   ```

2. Run any example:
   ```bash
   node examples/test-connection.js
   ```

## Available Examples

| File | Description | Usage |
|------|-------------|-------|
| `test-connection.js` | Quick bot connection test | `node examples/test-connection.js` |
| `create-private-channel.js` | Create private channel with specific users | Edit CONFIG, then run |
| `send-announcement.js` | Send formatted embed announcement | Edit CONFIG with channel ID |
| `list-server-info.js` | Display server roles, channels, members | `node examples/list-server-info.js` |
| `bulk-role-assign.js` | Assign role to multiple users | Edit CONFIG, has dry-run mode |

## Using the CLI

The CLI provides a simpler interface for common operations:

```bash
# Show help
node cli.js help

# Test connection
node cli.js login

# List server info
node cli.js list-roles
node cli.js list-channels
node cli.js list-members --limit 20

# Create channels
node cli.js channel-create --name my-channel
node cli.js channel-create --name private --private --users user1,user2
node cli.js channel-create --name staff --private --users admin --roles "Staff Role"

# Delete channel
node cli.js channel-delete --id 123456789

# Send message
node cli.js message-send --channel 123456789 --message "Hello World!"

# Create role
node cli.js role-create --name "New Role" --color "#FF6B6B"
```

## Configuration

All examples use the `.env` file:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_GUILD_ID=your_server_id_here  # Optional, for auto-select
```

## NPM Scripts

```bash
npm run cli -- help           # Run CLI
npm run cli -- login          # Test connection
npm run test:connection       # Quick test
```

## Customizing Examples

Each example file has a `CONFIG` object at the top that you can edit:

```javascript
const CONFIG = {
    channelName: 'my-channel',
    users: ['username1', 'username2'],
    roles: ['RoleName'],
    initialMessage: 'Welcome!'
};
```
