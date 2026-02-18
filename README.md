# MCP Discord Extended

[![Node.js](https://img.shields.io/badge/Node.js-≥20.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-14.25.1-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Compatible-orange)](https://modelcontextprotocol.io/)

> **Discord MCP server with advanced server management capabilities**

Extended [Model Context Protocol](https://modelcontextprotocol.io/) server for Discord. Forked from [barryyip0625/mcp-discord](https://github.com/barryyip0625/mcp-discord) with additional features for complete server management.

---

## Features

### MCP Tools

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

### Advanced Features

| Feature | Description |
|---------|-------------|
| **Caching** | TTL-based in-memory cache for guilds, channels, roles, members |
| **Rate Limiting** | Priority queue (HIGH/NORMAL/LOW) with batch and sequential execution |
| **Sanitization** | Input validation for Discord limits (snowflakes, names, messages) |
| **Configuration** | Centralized config with CLI > ENV > file > defaults priority |
| **CLI Tool** | Command-line interface for common Discord operations |
| **Examples** | Ready-to-use scripts for testing and automation |

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

```bash
# Create .env file
echo "DISCORD_TOKEN=your_bot_token_here" > .env

# Test connection
node cli.js login
```

---

## CLI Tool

```bash
node cli.js help                    # Show all commands
node cli.js login                   # Test connection

# Server info
node cli.js list-roles
node cli.js list-channels
node cli.js list-members

# Channels
node cli.js channel-create --name my-channel
node cli.js channel-create --name private --private --users user1,user2
node cli.js channel-delete --id 123456789

# Messages
node cli.js message-send --channel 123456789 --message "Hello!"

# Roles
node cli.js role-create --name "Admin" --color "#FF0000"
```

---

## Configuration

### Environment Variables (Recommended)

Create `.env` file:

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_GUILD_ID=your_guild_id_here
```

### Claude Desktop / Claude Code

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "discord": {
      "command": "node",
      "args": ["path/to/mcp-discord/build/index.js", "--token", "YOUR_TOKEN"]
    }
  }
}
```

---

## MCP Tools Reference

### Server & Login
| Tool | Description |
|------|-------------|
| `discord_login` | Authenticate with Discord |
| `discord_get_server_info` | Get server details |
| `discord_send` | Send message to channel |

### Channels
| Tool | Description |
|------|-------------|
| `discord_create_text_channel` | Create text channel |
| `discord_create_voice_channel` | Create voice channel |
| `discord_edit_channel` | Edit channel properties |
| `discord_delete_channel` | Delete channel |
| `discord_create_category` | Create category |
| `discord_edit_category` | Edit category |
| `discord_delete_category` | Delete category |

### Roles
| Tool | Description |
|------|-------------|
| `discord_list_roles` | List all roles |
| `discord_create_role` | Create role with color/permissions |
| `discord_edit_role` | Modify role |
| `discord_delete_role` | Delete role |
| `discord_assign_role` | Assign role to member |
| `discord_remove_role` | Remove role from member |

### Permissions
| Tool | Description |
|------|-------------|
| `discord_set_channel_permissions` | Set allow/deny for role/member |
| `discord_get_channel_permissions` | View permission overwrites |
| `discord_remove_channel_permissions` | Remove overwrites |

### Members
| Tool | Description |
|------|-------------|
| `discord_list_members` | List all members |
| `discord_get_member` | Get member details |

### Messages
| Tool | Description |
|------|-------------|
| `discord_read_messages` | Read channel messages |
| `discord_delete_message` | Delete message |
| `discord_bulk_delete_messages` | Delete up to 100 messages |
| `discord_edit_message` | Edit message |
| `discord_pin_message` | Pin message |
| `discord_unpin_message` | Unpin message |
| `discord_move_messages` | Move between channels |

### Reactions
| Tool | Description |
|------|-------------|
| `discord_add_reaction` | Add emoji reaction |
| `discord_add_multiple_reactions` | Add multiple reactions |
| `discord_remove_reaction` | Remove reaction |

### Forums
| Tool | Description |
|------|-------------|
| `discord_get_forum_channels` | List forums |
| `discord_create_forum_post` | Create post |
| `discord_get_forum_post` | Get post |
| `discord_reply_to_forum` | Reply to post |
| `discord_delete_forum_post` | Delete post |

### Webhooks
| Tool | Description |
|------|-------------|
| `discord_create_webhook` | Create webhook |
| `discord_send_webhook_message` | Send via webhook |
| `discord_edit_webhook` | Edit webhook |
| `discord_delete_webhook` | Delete webhook |

### Batch
| Tool | Description |
|------|-------------|
| `discord_batch_operations` | Execute multiple operations |

---

## Examples

See `examples/` folder:

| Script | Description |
|--------|-------------|
| `test-connection.js` | Quick connection test |
| `create-private-channel.js` | Create private channels |
| `send-announcement.js` | Send embed announcements |
| `list-server-info.js` | Display server info |
| `bulk-role-assign.js` | Assign roles in bulk |

```bash
node examples/test-connection.js
```

---

## Dependencies

| Package | Description |
|---------|-------------|
| @modelcontextprotocol/sdk | MCP SDK |
| discord.js | Discord API |
| zod | Schema validation |
| express | HTTP server |
| dotenv | Environment variables |

---

## Credits

- **Original:** [Barry Yip](https://github.com/barryyip0625/mcp-discord)
- **Extended by:** [Kogollones](https://github.com/Kogollones)

## License

[MIT](LICENSE)
