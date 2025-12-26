export const toolList = [
    {
        name: "discord_create_category",
        description: "Creates a new category in a Discord server.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                name: { type: "string" },
                position: { type: "number" },
                reason: { type: "string" }
            },
            required: ["guildId", "name"]
        }
    },
    {
        name: "discord_edit_category",
        description: "Edits an existing Discord category (name and position).",
        inputSchema: {
            type: "object",
            properties: {
                categoryId: { type: "string" },
                name: { type: "string" },
                position: { type: "number" },
                reason: { type: "string" }
            },
            required: ["categoryId"]
        }
    },
    {
        name: "discord_delete_category",
        description: "Deletes a Discord category by ID.",
        inputSchema: {
            type: "object",
            properties: {
                categoryId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["categoryId"]
        }
    },
    {
        name: "discord_login",
        description: "Logs in to Discord using the configured token",
        inputSchema: {
            type: "object",
            properties: {
                token: { type: "string" }
            },
            required: []
        }
    },
    {
        name: "discord_send",
        description: "Sends a message to a specified Discord text channel",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                message: { type: "string" }
            },
            required: ["channelId", "message"]
        }
    },
    {
        name: "discord_get_forum_channels",
        description: "Lists all forum channels in a specified Discord server (guild)",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" }
            },
            required: ["guildId"]
        }
    },
    {
        name: "discord_create_forum_post",
        description: "Creates a new post in a Discord forum channel with optional tags",
        inputSchema: {
            type: "object",
            properties: {
                forumChannelId: { type: "string" },
                title: { type: "string" },
                content: { type: "string" },
                tags: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: ["forumChannelId", "title", "content"]
        }
    },
    {
        name: "discord_get_forum_post",
        description: "Retrieves details about a forum post including its messages",
        inputSchema: {
            type: "object",
            properties: {
                threadId: { type: "string" }
            },
            required: ["threadId"]
        }
    },
    {
        name: "discord_reply_to_forum",
        description: "Adds a reply to an existing forum post or thread",
        inputSchema: {
            type: "object",
            properties: {
                threadId: { type: "string" },
                message: { type: "string" }
            },
            required: ["threadId", "message"]
        }
    },
    {
        name: "discord_create_text_channel",
        description: "Creates a new text channel in a Discord server with an optional topic",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                channelName: { type: "string" },
                topic: { type: "string" }
            },
            required: ["guildId", "channelName"]
        }
    },
    {
        name: "discord_delete_channel",
        description: "Deletes a Discord channel with an optional reason",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["channelId"]
        }
    },
    {
        name: "discord_edit_channel",
        description: "Edits an existing Discord channel (name, topic, category/parent, position, nsfw, slowmode)",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                name: { type: "string" },
                topic: { type: "string" },
                parentId: { type: "string", description: "Category ID to move channel into, or null to remove from category" },
                position: { type: "number" },
                nsfw: { type: "boolean" },
                rateLimitPerUser: { type: "number", description: "Slowmode in seconds (0-21600)" },
                reason: { type: "string" }
            },
            required: ["channelId"]
        }
    },
    {
        name: "discord_read_messages",
        description: "Retrieves messages from a Discord text channel with a configurable limit",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                limit: {
                    type: "number",
                    minimum: 1,
                    maximum: 100,
                    default: 50
                }
            },
            required: ["channelId"]
        }
    },
    {
        name: "discord_get_server_info",
        description: "Retrieves detailed information about a Discord server including channels and member count",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" }
            },
            required: ["guildId"]
        }
    },
    {
        name: "discord_add_reaction",
        description: "Adds an emoji reaction to a specific Discord message",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageId: { type: "string" },
                emoji: { type: "string" }
            },
            required: ["channelId", "messageId", "emoji"]
        }
    },
    {
        name: "discord_add_multiple_reactions",
        description: "Adds multiple emoji reactions to a Discord message at once",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageId: { type: "string" },
                emojis: {
                    type: "array",
                    items: { type: "string" }
                }
            },
            required: ["channelId", "messageId", "emojis"]
        }
    },
    {
        name: "discord_remove_reaction",
        description: "Removes a specific emoji reaction from a Discord message",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageId: { type: "string" },
                emoji: { type: "string" },
                userId: { type: "string" }
            },
            required: ["channelId", "messageId", "emoji"]
        }
    },
    {
        name: "discord_delete_forum_post",
        description: "Deletes a forum post or thread with an optional reason",
        inputSchema: {
            type: "object",
            properties: {
                threadId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["threadId"]
        }
    },
    {
        name: "discord_delete_message",
        description: "Deletes a specific message from a Discord text channel",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["channelId", "messageId"]
        }
    },
    {
        name: "discord_create_webhook",
        description: "Creates a new webhook for a Discord channel",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                name: { type: "string" },
                avatar: { type: "string" },
                reason: { type: "string" }
            },
            required: ["channelId", "name"]
        }
    },
    {
        name: "discord_send_webhook_message",
        description: "Sends a message to a Discord channel using a webhook",
        inputSchema: {
            type: "object",
            properties: {
                webhookId: { type: "string" },
                webhookToken: { type: "string" },
                content: { type: "string" },
                username: { type: "string" },
                avatarURL: { type: "string" },
                threadId: { type: "string" }
            },
            required: ["webhookId", "webhookToken", "content"]
        }
    },
    {
        name: "discord_edit_webhook",
        description: "Edits an existing webhook for a Discord channel",
        inputSchema: {
            type: "object",
            properties: {
                webhookId: { type: "string" },
                webhookToken: { type: "string" },
                name: { type: "string" },
                avatar: { type: "string" },
                channelId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["webhookId"]
        }
    },
    {
        name: "discord_delete_webhook",
        description: "Deletes an existing webhook for a Discord channel",
        inputSchema: {
            type: "object",
            properties: {
                webhookId: { type: "string" },
                webhookToken: { type: "string" },
                reason: { type: "string" }
            },
            required: ["webhookId"]
        }
    }
    ,
    {
        name: "discord_batch_operations",
        description: "Execute multiple Discord operations in a single call. Useful for bulk channel moves, renames, or other sequential operations. Returns results for each operation.",
        inputSchema: {
            type: "object",
            properties: {
                operations: {
                    type: "array",
                    description: "Array of operations to execute sequentially",
                    items: {
                        type: "object",
                        properties: {
                            tool: { type: "string", description: "Tool name (e.g., discord_edit_channel)" },
                            args: { type: "object", description: "Arguments for the tool" }
                        },
                        required: ["tool", "args"]
                    }
                },
                stopOnError: { type: "boolean", description: "Stop executing if an operation fails (default: false)" }
            },
            required: ["operations"]
        }
    },
    {
        name: "discord_bulk_delete_messages",
        description: "Deletes multiple messages at once from a channel. Can delete by message IDs or by fetching recent messages. Note: Messages older than 14 days cannot be bulk deleted.",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageIds: { type: "array", items: { type: "string" }, description: "Specific message IDs to delete" },
                limit: { type: "number", minimum: 1, maximum: 100, description: "Number of recent messages to delete (if messageIds not provided)" },
                beforeMessageId: { type: "string", description: "Delete messages before this message ID" },
                reason: { type: "string" }
            },
            required: ["channelId"]
        }
    },
    {
        name: "discord_edit_message",
        description: "Edits a message's content. Note: Bot can only edit its own messages.",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageId: { type: "string" },
                content: { type: "string" },
                reason: { type: "string" }
            },
            required: ["channelId", "messageId", "content"]
        }
    },
    {
        name: "discord_pin_message",
        description: "Pins a message in a channel",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["channelId", "messageId"]
        }
    },
    {
        name: "discord_unpin_message",
        description: "Unpins a message from a channel",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                messageId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["channelId", "messageId"]
        }
    },
    {
        name: "discord_move_messages",
        description: "Moves messages from one channel to another by copying them and optionally deleting the originals. Preserves author and timestamp info.",
        inputSchema: {
            type: "object",
            properties: {
                sourceChannelId: { type: "string" },
                targetChannelId: { type: "string" },
                messageIds: { type: "array", items: { type: "string" }, description: "Message IDs to move" },
                deleteOriginals: { type: "boolean", description: "Delete original messages after copying (default: true)" }
            },
            required: ["sourceChannelId", "targetChannelId", "messageIds"]
        }
    },
    {
        name: "discord_list_members",
        description: "Lists all members (users and bots) in a Discord server with their roles, status, and details.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                limit: { type: "number", minimum: 1, maximum: 1000, default: 100, description: "Maximum number of members to fetch" },
                botsOnly: { type: "boolean", default: false, description: "If true, only return bot accounts" }
            },
            required: ["guildId"]
        }
    },
    {
        name: "discord_get_member",
        description: "Gets detailed information about a specific member including roles, permissions, presence, and activities.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                userId: { type: "string" }
            },
            required: ["guildId", "userId"]
        }
    },
    {
        name: "discord_list_roles",
        description: "Lists all roles in a Discord server with their permissions and member counts.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" }
            },
            required: ["guildId"]
        }
    },
    {
        name: "discord_create_role",
        description: "Creates a new role in a Discord server with optional color, permissions, and settings.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                name: { type: "string" },
                color: { type: "string", description: "Hex color code (e.g., #FF0000 or FF0000)" },
                hoist: { type: "boolean", description: "Whether to display role separately in member list" },
                mentionable: { type: "boolean", description: "Whether the role can be mentioned" },
                permissions: { type: "array", items: { type: "string" }, description: "Array of permission names (e.g., SendMessages, ManageChannels)" },
                reason: { type: "string" }
            },
            required: ["guildId", "name"]
        }
    },
    {
        name: "discord_edit_role",
        description: "Edits an existing role's properties including name, color, permissions, and position.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                roleId: { type: "string" },
                name: { type: "string" },
                color: { type: "string", description: "Hex color code (e.g., #FF0000 or FF0000)" },
                hoist: { type: "boolean" },
                mentionable: { type: "boolean" },
                permissions: { type: "array", items: { type: "string" } },
                position: { type: "number" },
                reason: { type: "string" }
            },
            required: ["guildId", "roleId"]
        }
    },
    {
        name: "discord_delete_role",
        description: "Deletes a role from a Discord server.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                roleId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["guildId", "roleId"]
        }
    },
    {
        name: "discord_assign_role",
        description: "Assigns a role to a member in a Discord server.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                userId: { type: "string" },
                roleId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["guildId", "userId", "roleId"]
        }
    },
    {
        name: "discord_remove_role",
        description: "Removes a role from a member in a Discord server.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                userId: { type: "string" },
                roleId: { type: "string" },
                reason: { type: "string" }
            },
            required: ["guildId", "userId", "roleId"]
        }
    },
    {
        name: "discord_set_channel_permissions",
        description: "Sets permission overwrites for a role or member on a channel. Use to control who can see/use channels.",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                targetId: { type: "string", description: "Role ID or User ID to set permissions for" },
                targetType: { type: "string", enum: ["role", "member"], description: "Whether target is a role or member" },
                allow: { type: "array", items: { type: "string" }, description: "Permissions to allow (e.g., ViewChannel, SendMessages)" },
                deny: { type: "array", items: { type: "string" }, description: "Permissions to deny (e.g., ViewChannel, SendMessages)" },
                reason: { type: "string" }
            },
            required: ["channelId", "targetId", "targetType"]
        }
    },
    {
        name: "discord_get_channel_permissions",
        description: "Gets all permission overwrites for a channel.",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" }
            },
            required: ["channelId"]
        }
    },
    {
        name: "discord_remove_channel_permissions",
        description: "Removes permission overwrites for a role or member from a channel.",
        inputSchema: {
            type: "object",
            properties: {
                channelId: { type: "string" },
                targetId: { type: "string", description: "Role ID or User ID to remove permissions for" },
                reason: { type: "string" }
            },
            required: ["channelId", "targetId"]
        }
    },
    {
        name: "discord_create_voice_channel",
        description: "Creates a new voice channel in a Discord server.",
        inputSchema: {
            type: "object",
            properties: {
                guildId: { type: "string" },
                channelName: { type: "string" },
                bitrate: { type: "number", description: "Bitrate in bits per second (8000-96000, or 128000 for boosted servers)" },
                userLimit: { type: "number", description: "Max users (0 for unlimited, 1-99)" },
                parentId: { type: "string", description: "Category ID to place the channel in" },
                reason: { type: "string" }
            },
            required: ["guildId", "channelName"]
        }
    }
];
