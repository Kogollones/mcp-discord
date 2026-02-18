# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2025-12-26

### Added
- **Role Management**
  - `discord_list_roles` - List all server roles
  - `discord_create_role` - Create roles with color, permissions, hoist, mentionable
  - `discord_edit_role` - Edit role properties
  - `discord_delete_role` - Delete roles
  - `discord_assign_role` - Assign role to member
  - `discord_remove_role` - Remove role from member

- **Permission Management**
  - `discord_set_channel_permissions` - Set permission overwrites for roles/members
  - `discord_get_channel_permissions` - Get current permission overwrites
  - `discord_remove_channel_permissions` - Remove permission overwrites

- **Voice Channels**
  - `discord_create_voice_channel` - Create voice channels with bitrate/user limit

- **Category Management**
  - `discord_create_category` - Create channel categories
  - `discord_edit_category` - Edit category name/position
  - `discord_delete_category` - Delete categories

- **Member Management**
  - `discord_list_members` - List all members (with bot filter option)
  - `discord_get_member` - Get detailed member info

- **Message Management**
  - `discord_bulk_delete_messages` - Delete up to 100 messages at once
  - `discord_edit_message` - Edit message content
  - `discord_pin_message` - Pin messages
  - `discord_unpin_message` - Unpin messages
  - `discord_move_messages` - Move messages between channels

- **Batch Operations**
  - `discord_batch_operations` - Execute multiple operations in sequence

### Changed
- Updated Node.js requirement to >=20.0.0
- Updated all dependencies to latest versions
- Improved error handling

### Security
- Updated @modelcontextprotocol/sdk to 1.25.1
- Updated discord.js to 14.25.1
- Updated zod to 4.2.1
- Updated express to 5.2.1
- Updated dotenv to 17.2.3

## [1.3.4] - Original Release

Original version by [Barry Yip](https://github.com/barryyip0625/mcp-discord).

### Features
- Discord bot login
- Send messages
- Read messages
- Delete messages
- Add/remove reactions
- Forum channel management
- Webhook management
- Text channel creation/deletion
