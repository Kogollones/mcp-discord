import { ChannelType } from "discord.js";
import { CreateTextChannelSchema, DeleteChannelSchema, EditChannelSchema, ReadMessagesSchema, GetServerInfoSchema, CreateCategorySchema, EditCategorySchema, DeleteCategorySchema, CreateVoiceChannelSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
// Category creation handler
export async function createCategoryHandler(args, context) {
    const { guildId, name, position, reason } = CreateCategorySchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const guild = await context.client.guilds.fetch(guildId);
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        const options = { name, type: ChannelType.GuildCategory };
        if (typeof position === "number")
            options.position = position;
        if (reason)
            options.reason = reason;
        const category = await guild.channels.create(options);
        return {
            content: [{ type: "text", text: `Successfully created category "${name}" with ID: ${category.id}` }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Category edit handler
export async function editCategoryHandler(args, context) {
    const { categoryId, name, position, reason } = EditCategorySchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const category = await context.client.channels.fetch(categoryId);
        if (!category || category.type !== ChannelType.GuildCategory) {
            return {
                content: [{ type: "text", text: `Cannot find category with ID: ${categoryId}` }],
                isError: true
            };
        }
        const update = {};
        if (name)
            update.name = name;
        if (typeof position === "number")
            update.position = position;
        if (reason)
            update.reason = reason;
        await category.edit(update);
        return {
            content: [{ type: "text", text: `Successfully edited category with ID: ${categoryId}` }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Category deletion handler
export async function deleteCategoryHandler(args, context) {
    const { categoryId, reason } = DeleteCategorySchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const category = await context.client.channels.fetch(categoryId);
        if (!category || category.type !== ChannelType.GuildCategory) {
            return {
                content: [{ type: "text", text: `Cannot find category with ID: ${categoryId}` }],
                isError: true
            };
        }
        await category.delete(reason || "Category deleted via API");
        return {
            content: [{ type: "text", text: `Successfully deleted category with ID: ${categoryId}` }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Text channel creation handler
export async function createTextChannelHandler(args, context) {
    const { guildId, channelName, topic, reason } = CreateTextChannelSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const guild = await context.client.guilds.fetch(guildId);
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        // Create the text channel
        const channelOptions = {
            name: channelName,
            type: ChannelType.GuildText
        };
        if (topic)
            channelOptions.topic = topic;
        if (reason)
            channelOptions.reason = reason;
        const channel = await guild.channels.create(channelOptions);
        return {
            content: [{
                    type: "text",
                    text: `Successfully created text channel "${channelName}" with ID: ${channel.id}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Channel deletion handler
export async function deleteChannelHandler(args, context) {
    const { channelId, reason } = DeleteChannelSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const channel = await context.client.channels.fetch(channelId);
        if (!channel) {
            return {
                content: [{ type: "text", text: `Cannot find channel with ID: ${channelId}` }],
                isError: true
            };
        }
        // Check if channel can be deleted (has delete method)
        if (!('delete' in channel)) {
            return {
                content: [{ type: "text", text: `This channel type does not support deletion or the bot lacks permissions` }],
                isError: true
            };
        }
        // Delete the channel
        await channel.delete(reason || "Channel deleted via API");
        return {
            content: [{
                    type: "text",
                    text: `Successfully deleted channel with ID: ${channelId}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Channel edit handler
export async function editChannelHandler(args, context) {
    const { channelId, name, topic, parentId, position, nsfw, rateLimitPerUser, reason } = EditChannelSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const channel = await context.client.channels.fetch(channelId);
        if (!channel) {
            return {
                content: [{ type: "text", text: `Cannot find channel with ID: ${channelId}` }],
                isError: true
            };
        }
        // Check if channel can be edited (has edit method)
        if (!('edit' in channel)) {
            return {
                content: [{ type: "text", text: `This channel type does not support editing or the bot lacks permissions` }],
                isError: true
            };
        }
        // Build update object with only provided fields
        const update = {};
        if (name !== undefined) update.name = name;
        if (topic !== undefined) update.topic = topic;
        if (parentId !== undefined) update.parent = parentId;
        if (typeof position === "number") update.position = position;
        if (nsfw !== undefined) update.nsfw = nsfw;
        if (typeof rateLimitPerUser === "number") update.rateLimitPerUser = rateLimitPerUser;
        if (reason) update.reason = reason;
        await channel.edit(update);
        const changes = Object.keys(update).filter(k => k !== 'reason').join(', ') || 'no changes';
        return {
            content: [{
                type: "text",
                text: `Successfully edited channel "${channel.name}" (ID: ${channelId}). Changed: ${changes}`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Message reading handler
export async function readMessagesHandler(args, context) {
    const { channelId, limit } = ReadMessagesSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const channel = await context.client.channels.fetch(channelId);
        if (!channel) {
            return {
                content: [{ type: "text", text: `Cannot find channel with ID: ${channelId}` }],
                isError: true
            };
        }
        // Check if channel has messages (text channel, thread, etc.)
        if (!channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Channel type does not support reading messages` }],
                isError: true
            };
        }
        // Fetch messages
        const messages = await channel.messages.fetch({ limit });
        if (messages.size === 0) {
            return {
                content: [{ type: "text", text: `No messages found in channel` }]
            };
        }
        // Format messages 
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            author: {
                id: msg.author.id,
                username: msg.author.username,
                bot: msg.author.bot
            },
            timestamp: msg.createdAt,
            attachments: msg.attachments.size,
            embeds: msg.embeds.length,
            replyTo: msg.reference ? msg.reference.messageId : null
        })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        channelId,
                        messageCount: formattedMessages.length,
                        messages: formattedMessages
                    }, null, 2)
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Server information handler
export async function getServerInfoHandler(args, context) {
    const { guildId } = GetServerInfoSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const guild = await context.client.guilds.fetch(guildId);
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        // Fetch additional server data
        await guild.fetch();
        // Fetch channel information
        const channels = await guild.channels.fetch();
        // Categorize channels by type
        const channelsByType = {
            text: channels.filter(c => c?.type === ChannelType.GuildText).size,
            voice: channels.filter(c => c?.type === ChannelType.GuildVoice).size,
            category: channels.filter(c => c?.type === ChannelType.GuildCategory).size,
            forum: channels.filter(c => c?.type === ChannelType.GuildForum).size,
            announcement: channels.filter(c => c?.type === ChannelType.GuildAnnouncement).size,
            stage: channels.filter(c => c?.type === ChannelType.GuildStageVoice).size,
            total: channels.size
        };
        // Get detailed information for all channels
        const channelDetails = channels.map(channel => {
            if (!channel)
                return null;
            return {
                id: channel.id,
                name: channel.name,
                type: ChannelType[channel.type] || channel.type,
                categoryId: channel.parentId,
                position: channel.position,
                // Only add topic for text channels
                topic: 'topic' in channel ? channel.topic : null,
            };
        }).filter(c => c !== null); // Filter out null values
        // Group channels by type
        const groupedChannels = {
            text: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildText] || c.type === ChannelType.GuildText),
            voice: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildVoice] || c.type === ChannelType.GuildVoice),
            category: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildCategory] || c.type === ChannelType.GuildCategory),
            forum: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildForum] || c.type === ChannelType.GuildForum),
            announcement: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildAnnouncement] || c.type === ChannelType.GuildAnnouncement),
            stage: channelDetails.filter(c => c.type === ChannelType[ChannelType.GuildStageVoice] || c.type === ChannelType.GuildStageVoice),
            all: channelDetails
        };
        // Get member count
        const approximateMemberCount = guild.approximateMemberCount || "unknown";
        // Format guild information
        const guildInfo = {
            id: guild.id,
            name: guild.name,
            description: guild.description,
            icon: guild.iconURL(),
            owner: guild.ownerId,
            createdAt: guild.createdAt,
            memberCount: approximateMemberCount,
            channels: {
                count: channelsByType,
                details: groupedChannels
            },
            features: guild.features,
            premium: {
                tier: guild.premiumTier,
                subscriptions: guild.premiumSubscriptionCount
            }
        };
        return {
            content: [{ type: "text", text: JSON.stringify(guildInfo, null, 2) }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Voice channel creation handler
export async function createVoiceChannelHandler(args, context) {
    const { guildId, channelName, bitrate, userLimit, parentId, reason } = CreateVoiceChannelSchema.parse(args);
    try {
        if (!context.client.isReady()) {
            return {
                content: [{ type: "text", text: "Discord client not logged in." }],
                isError: true
            };
        }
        const guild = await context.client.guilds.fetch(guildId);
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        const channelOptions = {
            name: channelName,
            type: ChannelType.GuildVoice
        };
        if (bitrate) channelOptions.bitrate = bitrate;
        if (userLimit) channelOptions.userLimit = userLimit;
        if (parentId) channelOptions.parent = parentId;
        if (reason) channelOptions.reason = reason;
        const channel = await guild.channels.create(channelOptions);
        return {
            content: [{
                type: "text",
                text: `Successfully created voice channel "${channelName}" with ID: ${channel.id}`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
