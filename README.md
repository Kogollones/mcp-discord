# MCP Discord Extended

[![Node.js](https://img.shields.io/badge/Node.js-≥20.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.25.1-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-orange)](https://modelcontextprotocol.io/)
[![Security](https://snyk.io/test/github/Kogollones/mcp-discord/badge.svg)](https://snyk.io/test/github/Kogollones/mcp-discord)

> **Discord MCP server with advanced server management capabilities**

Extended [Model Context Protocol](https://modelcontextprotocol.io/) server for Discord. Forked from [barryyip0625/mcp-discord](https://github.com/barryyip0625/mcp-discord) with additional features for complete server management.

---

## Features

| Category | Capabilities |
|----------|-------------|
| **Roles** | Create, edit, delete, assign, remove roles with full permission control |
| **Permissions** | Set, get, remove channel permission overwrites for roles/members |
| **Channels** | Text, voice, categories - create, edit, delete, organize |
| **Members** | List members, get detailed info, manage roles |
| **Messages** | Send, read, edit, delete, bulk delete, pin, move |
| **Reactions** | Add, remove, multiple reactions |
| **Forums** | Create posts, reply, manage forum channels |
| **Webhooks** | Create, edit, delete, send messages via webhooks |
| **Batch** | Execute multiple operations in a single call |

### v3.0 Advanced Features

| Feature | Description |
|---------|-------------|
| **Caching** | TTL-based in-memory cache for guilds, channels, roles, members |
| **Rate Limiting** | Priority queue (HIGH/NORMAL/LOW) with batch and sequential execution |
| **Sanitization** | Input validation for Discord limits (snowflakes, names, messages) |
| **Configuration** | Centralized config with CLI > ENV > file > defaults priority |

---

## Quick Start

### Requirements

- **Node.js** v20.0.0 or higher
- **Discord Bot** with Administrator permission
- **Bot Token** from [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

```bash
git clone https://github.com/Kogollones/mcp-discord.git
cd mcp-discord
npm install
```

### Quick Test

Test your bot connection in seconds:

```bash
# 1. Create .env file with your token
echo "DISCORD_TOKEN=your_bot_token_here" > .env

# 2. Test connection
node examples/test-connection.js
```

Or use the CLI:

```bash
node cli.js login
```

### CLI Tool

The included CLI makes common operations easy:

```bash
# Show help
node cli.js help

# List server info
node cli.js list-roles
node cli.js list-channels
node cli.js list-members

# Create channels
node cli.js channel-create --name my-channel
node cli.js channel-create --name private --private --users user1,user2

# Send messages
node cli.js message-send --channel 123456789 --message "Hello!"

# Manage roles
node cli.js role-create --name "New Role" --color "#FF0000"
```

### Configuration

#### Option 1: Environment Variables (Recommended)

Create a `.env` file in the project root:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_APPLICATION_ID=your_application_id_here
DISCORD_GUILD_ID=your_guild_id_here
```

#### Option 2: Config File

Create a `config.json` based on `config.example.json`:

```json
{
  "server": {
    "port": 8080,
    "logLevel": "info"
  },
  "discord": {
    "token": null,
    "gatewayIntents": ["Guilds", "GuildMessages", "MessageContent"]
  },
  "cache": {
    "ttlGuilds": 300000,
    "ttlChannels": 120000,
    "ttlRoles": 300000,
    "ttlMembers": 60000
  },
  "rateLimiter": {
    "maxConcurrent": 5,
    "highThreshold": 3,
    "queueTimeout": 30000
  }
}
```

#### Option 3: Claude Desktop Config

Add to your Claude Desktop (`claude_desktop_config.json`) or Claude Code settings:

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": [
        "C:/path/to/mcp-discord/build/index.js",
        "--token",
        "YOUR_DISCORD_BOT_TOKEN"
      ]
    }
  }
}
```

#### CLI Options

| Option | Description |
|--------|-------------|
| `--token` | Discord bot token |
| `--config` | Path to config file |
| `--transport` | Transport type: `stdio` or `http` |
| `--port` | HTTP server port (default: 8080) |
| `--log-level` | Log level: debug, info, warn, error |

---

## Tools Reference

### Server & Login
| Tool | Description |
|------|-------------|
| `discord_login` | Authenticate with Discord |
| `discord_get_server_info` | Get server details, channels, members count |
| `discord_send` | Send message to any channel |

### Channel Management
| Tool | Description |
|------|-------------|
| `discord_create_text_channel` | Create text channel |
| `discord_create_voice_channel` | Create voice channel with bitrate/user limit |
| `discord_edit_channel` | Edit name, topic, category, position, NSFW, slowmode |
| `discord_delete_channel` | Delete any channel |
| `discord_create_category` | Create category |
| `discord_edit_category` | Edit category |
| `discord_delete_category` | Delete category |

### Role Management
| Tool | Description |
|------|-------------|
| `discord_list_roles` | List all server roles |
| `discord_create_role` | Create role with color, permissions, hoist, mentionable |
| `discord_edit_role` | Modify role properties |
| `discord_delete_role` | Remove role |
| `discord_assign_role` | Give role to member |
| `discord_remove_role` | Take role from member |

### Permission Management
| Tool | Description |
|------|-------------|
| `discord_set_channel_permissions` | Set allow/deny permissions for role or member |
| `discord_get_channel_permissions` | View current permission overwrites |
| `discord_remove_channel_permissions` | Remove permission overwrites |

### Member Management
| Tool | Description |
|------|-------------|
| `discord_list_members` | List all members (filter bots optional) |
| `discord_get_member` | Get member details, roles, permissions |

### Message Management
| Tool | Description |
|------|-------------|
| `discord_read_messages` | Read channel messages (limit configurable) |
| `discord_delete_message` | Delete single message |
| `discord_bulk_delete_messages` | Delete up to 100 messages at once |
| `discord_edit_message` | Edit message content |
| `discord_pin_message` | Pin message |
| `discord_unpin_message` | Unpin message |
| `discord_move_messages` | Move messages between channels |

### Reactions
| Tool | Description |
|------|-------------|
| `discord_add_reaction` | Add emoji reaction |
| `discord_add_multiple_reactions` | Add multiple reactions at once |
| `discord_remove_reaction` | Remove reaction |

### Forums
| Tool | Description |
|------|-------------|
| `discord_get_forum_channels` | List forum channels |
| `discord_create_forum_post` | Create post with tags |
| `discord_get_forum_post` | Get post with messages |
| `discord_reply_to_forum` | Reply to post |
| `discord_delete_forum_post` | Delete post |

### Webhooks
| Tool | Description |
|------|-------------|
| `discord_create_webhook` | Create webhook |
| `discord_send_webhook_message` | Send via webhook |
| `discord_edit_webhook` | Edit webhook |
| `discord_delete_webhook` | Delete webhook |

### Batch Operations
| Tool | Description |
|------|-------------|
| `discord_batch_operations` | Execute multiple operations sequentially |

---

## Permission Names

Available permission flags for `discord_set_channel_permissions`:

```
ViewChannel          SendMessages         ReadMessageHistory
ManageMessages       ManageChannels       ManageRoles
Connect              Speak                MuteMembers
DeafenMembers        MoveMembers          ManageWebhooks
AddReactions         AttachFiles          EmbedLinks
CreateInstantInvite  UseExternalEmojis    ManageThreads
SendMessagesInThreads
```

---

## Examples

### Ready-to-use Scripts

Check the `examples/` folder for practical scripts:

| Script | Description |
|--------|-------------|
| `test-connection.js` | Verify bot connection |
| `create-private-channel.js` | Create private channels with users/roles |
| `send-announcement.js` | Send formatted embed announcements |
| `list-server-info.js` | Display server roles, channels, members |
| `bulk-role-assign.js` | Assign roles to multiple users |

```bash
# Edit CONFIG in the script, then run:
node examples/create-private-channel.js
```

### MCP Tool Examples

### Hide category from @everyone
```javascript
discord_set_channel_permissions({
  channelId: "CATEGORY_ID",
  targetId: "EVERYONE_ROLE_ID", // Same as Guild ID
  targetType: "role",
  deny: ["ViewChannel"]
})
```

### Allow role to access category
```javascript
discord_set_channel_permissions({
  channelId: "CATEGORY_ID",
  targetId: "ROLE_ID",
  targetType: "role",
  allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"]
})
```

### Create role with color
```javascript
discord_create_role({
  guildId: "SERVER_ID",
  name: "Developer",
  color: "#3498DB",
  hoist: true,
  mentionable: true
})
```

### Bulk delete messages
```javascript
discord_bulk_delete_messages({
  channelId: "CHANNEL_ID",
  limit: 50
})
```

---

## Dependencies

| Package | Version | Description |
|---------|---------|-------------|
| [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) | ^1.25.1 | MCP SDK |
| [discord.js](https://discord.js.org/) | ^14.25.1 | Discord API |
| [zod](https://zod.dev/) | ^4.2.1 | Schema validation |
| [express](https://expressjs.com/) | ^5.2.1 | HTTP server |
| [dotenv](https://www.npmjs.com/package/dotenv) | ^17.2.3 | Environment variables |

---

## Credits

- **Original:** [Barry Yip](https://github.com/barryyip0625/mcp-discord)
- **Extended by:** [Kogollones](https://github.com/Kogollones)

## License

[MIT](LICENSE) - Copyright (c) 2025 BarryY (Original), Kogollones (Extended)
