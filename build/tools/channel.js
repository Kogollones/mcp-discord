import { ChannelType } from "discord.js";
import { CreateTextChannelSchema, DeleteChannelSchema, EditChannelSchema, ReadMessagesSchema, GetServerInfoSchema, CreateCategorySchema, EditCategorySchema, DeleteCategorySchema, CreateVoiceChannelSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { requireClientReady } from "./middleware.js";
import { fetchWithCache, getCache } from "../cache.js";
import {
    sanitizeChannelName,
    sanitizeRoleName,
    sanitizeTopic,
    sanitizeReason,
    validateSnowflake
} from "../sanitizer.js";
// Category creation handler
export async function createCategoryHandler(args, context) {
    const { guildId, name, position, reason } = CreateCategorySchema.parse(args);

    // Validate inputs
    const guildValidation = validateSnowflake(guildId);
    if (!guildValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid guild ID: ${guildValidation.error}` }],
            isError: true
        };
    }

    // Sanitize category name (uses role name sanitization - same rules)
    const nameSanitized = sanitizeRoleName(name);
    if (nameSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid category name: ${nameSanitized.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        // Use cached guild when possible
        const guild = await fetchWithCache(
            'guilds',
            guildId,
            async () => {
                const g = await context.client.guilds.fetch(guildId);
                if (!g) return null;
                return g;
            }
        );
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        const options = { name: nameSanitized.sanitized, type: ChannelType.GuildCategory };
        if (typeof position === "number")
            options.position = position;
        if (reasonSanitized.sanitized)
            options.reason = reasonSanitized.sanitized;
        const category = await guild.channels.create(options);

        // Invalidate channels cache for this guild
        const cache = getCache();
        cache.delete('channels', category.id);

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
        requireClientReady(context);
        // Use cached channel when possible
        const category = await fetchWithCache(
            'channels',
            categoryId,
            async () => {
                const ch = await context.client.channels.fetch(categoryId);
                if (!ch) return null;
                return ch;
            }
        );
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

        // Invalidate channel cache
        const cache = getCache();
        cache.delete('channels', categoryId);

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
        requireClientReady(context);
        // Use cached channel when possible
        const category = await fetchWithCache(
            'channels',
            categoryId,
            async () => {
                const ch = await context.client.channels.fetch(categoryId);
                if (!ch) return null;
                return ch;
            }
        );
        if (!category || category.type !== ChannelType.GuildCategory) {
            return {
                content: [{ type: "text", text: `Cannot find category with ID: ${categoryId}` }],
                isError: true
            };
        }
        await category.delete(reason || "Category deleted via API");

        // Invalidate channel cache
        const cache = getCache();
        cache.delete('channels', categoryId);

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

    // Validate inputs
    const guildValidation = validateSnowflake(guildId);
    if (!guildValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid guild ID: ${guildValidation.error}` }],
            isError: true
        };
    }

    // Sanitize channel name
    const nameSanitized = sanitizeChannelName(channelName);
    if (nameSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid channel name: ${nameSanitized.error}` }],
            isError: true
        };
    }

    // Sanitize topic
    const topicSanitized = topic ? sanitizeTopic(topic) : { sanitized: '' };
    if (topicSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid topic: ${topicSanitized.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        // Use cached guild when possible
        const guild = await fetchWithCache(
            'guilds',
            guildId,
            async () => {
                const g = await context.client.guilds.fetch(guildId);
                if (!g) return null;
                return g;
            }
        );
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        // Create the text channel
        const channelOptions = {
            name: nameSanitized.sanitized,
            type: ChannelType.GuildText
        };
        if (topicSanitized.sanitized)
            channelOptions.topic = topicSanitized.sanitized;
        if (reasonSanitized.sanitized)
            channelOptions.reason = reasonSanitized.sanitized;
        const channel = await guild.channels.create(channelOptions);

        // Note: No need to invalidate cache for new channel since it doesn't exist yet

        return {
            content: [{
                    type: "text",
                    text: `Successfully created text channel "${nameSanitized.sanitized}" with ID: ${channel.id}`
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
        requireClientReady(context);
        // Use cached channel when possible
        const channel = await fetchWithCache(
            'channels',
            channelId,
            async () => {
                const ch = await context.client.channels.fetch(channelId);
                if (!ch) return null;
                return ch;
            }
        );
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

        // Invalidate channel cache
        const cache = getCache();
        cache.delete('channels', channelId);

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

    // Validate channel ID
    const idValidation = validateSnowflake(channelId);
    if (!idValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${idValidation.error}` }],
            isError: true
        };
    }

    // Sanitize name if provided
    let nameSanitized = null;
    if (name !== undefined) {
        nameSanitized = sanitizeChannelName(name);
        if (nameSanitized.error) {
            return {
                content: [{ type: "text", text: `Invalid channel name: ${nameSanitized.error}` }],
                isError: true
            };
        }
    }

    // Sanitize topic if provided
    let topicSanitized = null;
    if (topic !== undefined) {
        topicSanitized = sanitizeTopic(topic);
        if (topicSanitized.error) {
            return {
                content: [{ type: "text", text: `Invalid topic: ${topicSanitized.error}` }],
                isError: true
            };
        }
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        // Use cached channel when possible
        const channel = await fetchWithCache(
            'channels',
            channelId,
            async () => {
                const ch = await context.client.channels.fetch(channelId);
                if (!ch) return null;
                return ch;
            }
        );
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
        if (nameSanitized) update.name = nameSanitized.sanitized;
        if (topicSanitized) update.topic = topicSanitized.sanitized;
        if (parentId !== undefined) update.parent = parentId;
        if (typeof position === "number") update.position = position;
        if (nsfw !== undefined) update.nsfw = nsfw;
        if (typeof rateLimitPerUser === "number") update.rateLimitPerUser = rateLimitPerUser;
        if (reasonSanitized.sanitized) update.reason = reasonSanitized.sanitized;
        await channel.edit(update);

        // Invalidate channel cache
        const cache = getCache();
        cache.delete('channels', channelId);

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
// Message reading handler with pagination support
export async function readMessagesHandler(args, context) {
    const { channelId, limit, after, before, around } = ReadMessagesSchema.parse(args);
    try {
        requireClientReady(context);
        // Use cached channel when possible
        const channel = await fetchWithCache(
            'channels',
            channelId,
            async () => {
                const ch = await context.client.channels.fetch(channelId);
                if (!ch) return null;
                return ch;
            }
        );
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
        // Build fetch options for pagination
        const fetchOptions = { limit };
        if (after) fetchOptions.after = after;
        if (before) fetchOptions.before = before;
        if (around) fetchOptions.around = around;

        // Fetch messages
        const messages = await channel.messages.fetch(fetchOptions);
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

        // Determine pagination metadata
        const hasMorePages = messages.size === limit;
        const oldestMessage = formattedMessages[0];
        const newestMessage = formattedMessages[formattedMessages.length - 1];
        const nextCursor = hasMorePages && oldestMessage ? oldestMessage.id : null;
        const previousCursor = hasMorePages && newestMessage ? newestMessage.id : null;

        return {
            content: [{
                    type: "text",
                    text: JSON.stringify({
                        channelId,
                        messageCount: formattedMessages.length,
                        pagination: {
                            limit,
                            nextCursor,     // Use for fetching older messages (before=)
                            previousCursor, // Use for fetching newer messages (after=)
                            hasNextPage: hasMorePages,
                            hasPreviousPage: hasMorePages
                        },
                        messages: formattedMessages
                    }, null, 2)
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Server information handler with pagination support for channels
export async function getServerInfoHandler(args, context) {
    const { guildId, includeChannels, channelsLimit, channelsAfter } = GetServerInfoSchema.parse(args);
    try {
        requireClientReady(context);
        // Use cached guild when possible
        const guild = await fetchWithCache(
            'guilds',
            guildId,
            async () => {
                const g = await context.client.guilds.fetch(guildId);
                if (!g) return null;
                await g.fetch(); // Fetch additional server data
                return g;
            }
        );
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        // Fetch channel information
        const allChannels = await guild.channels.fetch();

        // Categorize channels by type (before pagination)
        const channelsByType = {
            text: allChannels.filter(c => c?.type === ChannelType.GuildText).size,
            voice: allChannels.filter(c => c?.type === ChannelType.GuildVoice).size,
            category: allChannels.filter(c => c?.type === ChannelType.GuildCategory).size,
            forum: allChannels.filter(c => c?.type === ChannelType.GuildForum).size,
            announcement: allChannels.filter(c => c?.type === ChannelType.GuildAnnouncement).size,
            stage: allChannels.filter(c => c?.type === ChannelType.GuildStageVoice).size,
            total: allChannels.size
        };

        // Apply pagination to channels if requested
        let paginatedChannels = allChannels;
        let channelsPagination = null;

        if (includeChannels) {
            // Convert to array and apply cursor-based pagination
            let channelsArray = Array.from(allChannels.values());

            // Apply after cursor
            if (channelsAfter) {
                const afterIndex = channelsArray.findIndex(c => c.id === channelsAfter);
                if (afterIndex !== -1) {
                    channelsArray = channelsArray.slice(afterIndex + 1);
                }
            }

            // Apply limit
            const hasMorePages = channelsArray.length > channelsLimit;
            paginatedChannels = new Map(channelsArray.slice(0, channelsLimit).map(c => [c.id, c]));

            // Build pagination metadata
            const channelsList = Array.from(paginatedChannels.values());
            const nextCursor = hasMorePages && channelsList.length > 0
                ? channelsList[channelsList.length - 1].id
                : null;

            channelsPagination = {
                limit: channelsLimit,
                nextCursor,
                hasNextPage: hasMorePages,
                hasPreviousPage: !!channelsAfter
            };
        }

        // Get detailed information for channels (paginated or all)
        const channelDetails = Array.from(paginatedChannels.values()).map(channel => {
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

        // Build guild information
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
                ...(includeChannels ? {
                    details: groupedChannels,
                    pagination: channelsPagination
                } : {})
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

    // Validate inputs
    const guildValidation = validateSnowflake(guildId);
    if (!guildValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid guild ID: ${guildValidation.error}` }],
            isError: true
        };
    }

    // Sanitize channel name
    const nameSanitized = sanitizeChannelName(channelName);
    if (nameSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid channel name: ${nameSanitized.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        // Use cached guild when possible
        const guild = await fetchWithCache(
            'guilds',
            guildId,
            async () => {
                const g = await context.client.guilds.fetch(guildId);
                if (!g) return null;
                return g;
            }
        );
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        const channelOptions = {
            name: nameSanitized.sanitized,
            type: ChannelType.GuildVoice
        };
        if (bitrate) channelOptions.bitrate = bitrate;
        if (userLimit) channelOptions.userLimit = userLimit;
        if (parentId) channelOptions.parent = parentId;
        if (reasonSanitized.sanitized) channelOptions.reason = reasonSanitized.sanitized;
        const channel = await guild.channels.create(channelOptions);
        return {
            content: [{
                type: "text",
                text: `Successfully created voice channel "${nameSanitized.sanitized}" with ID: ${channel.id}`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
