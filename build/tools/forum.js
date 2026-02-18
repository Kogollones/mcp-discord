import { ChannelType } from 'discord.js';
import { GetForumChannelsSchema, CreateForumPostSchema, GetForumPostSchema, ReplyToForumSchema, DeleteForumPostSchema } from '../schemas.js';
import { handleDiscordError } from "../errorHandler.js";
import { requireClientReady } from "./middleware.js";
import {
    sanitizeForumTitle,
    sanitizeMessageContent,
    sanitizeReason,
    validateSnowflake
} from "../sanitizer.js";

export const getForumChannelsHandler = async (args, { client }) => {
    const { guildId } = GetForumChannelsSchema.parse(args);
    try {
        requireClientReady({ client });

        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
            return {
                content: [{ type: "text", text: `Cannot find guild with ID: ${guildId}` }],
                isError: true
            };
        }
        // Fetch all channels from the guild
        const channels = await guild.channels.fetch();
        // Filter to get only forum channels
        const forumChannels = channels.filter(channel => channel?.type === ChannelType.GuildForum);
        if (forumChannels.size === 0) {
            return {
                content: [{ type: "text", text: `No forum channels found in guild: ${guild.name}` }]
            };
        }
        // Format forum channels information
        const forumInfo = forumChannels.map(channel => ({
            id: channel.id,
            name: channel.name,
            topic: channel.topic || "No topic set"
        }));
        return {
            content: [{ type: "text", text: JSON.stringify(forumInfo, null, 2) }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
};

export const createForumPostHandler = async (args, { client }) => {
    const { forumChannelId, title, content, tags } = CreateForumPostSchema.parse(args);

    // Validate forum channel ID
    const channelIdValidation = validateSnowflake(forumChannelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid forum channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize forum title
    const titleSanitized = sanitizeForumTitle(title);
    if (titleSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid forum title: ${titleSanitized.error}` }],
            isError: true
        };
    }

    // Sanitize content
    const contentSanitized = sanitizeMessageContent(content);
    if (contentSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid content: ${contentSanitized.error}` }],
            isError: true
        };
    }

    try {
        requireClientReady({ client });

        const channel = await client.channels.fetch(forumChannelId);
        if (!channel || channel.type !== ChannelType.GuildForum) {
            return {
                content: [{ type: "text", text: `Channel ID ${forumChannelId} is not a forum channel.` }],
                isError: true
            };
        }
        const forumChannel = channel;
        // Get available tags in the forum
        const availableTags = forumChannel.availableTags;
        let selectedTagIds = [];
        // If tags are provided, find their IDs
        if (tags && tags.length > 0) {
            selectedTagIds = availableTags
                .filter(tag => tags.includes(tag.name))
                .map(tag => tag.id);
        }
        // Create the forum post
        const thread = await forumChannel.threads.create({
            name: titleSanitized.sanitized,
            message: {
                content: contentSanitized.sanitized
            },
            appliedTags: selectedTagIds.length > 0 ? selectedTagIds : undefined
        });
        return {
            content: [{
                    type: "text",
                    text: `Successfully created forum post "${titleSanitized.sanitized}" with ID: ${thread.id}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
};

export const getForumPostHandler = async (args, { client }) => {
    const { threadId } = GetForumPostSchema.parse(args);
    try {
        requireClientReady({ client });

        const thread = await client.channels.fetch(threadId);
        if (!thread || !(thread.isThread())) {
            return {
                content: [{ type: "text", text: `Cannot find thread with ID: ${threadId}` }],
                isError: true
            };
        }
        // Get messages from the thread
        const messages = await thread.messages.fetch({ limit: 10 });
        const threadDetails = {
            id: thread.id,
            name: thread.name,
            parentId: thread.parentId,
            messageCount: messages.size,
            createdAt: thread.createdAt,
            messages: messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                author: msg.author.tag,
                createdAt: msg.createdAt
            }))
        };
        return {
            content: [{ type: "text", text: JSON.stringify(threadDetails, null, 2) }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
};

export const replyToForumHandler = async (args, { client }) => {
    const { threadId, message } = ReplyToForumSchema.parse(args);

    // Validate thread ID
    const threadIdValidation = validateSnowflake(threadId);
    if (!threadIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid thread ID: ${threadIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize message
    const messageSanitized = sanitizeMessageContent(message);
    if (messageSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid message: ${messageSanitized.error}` }],
            isError: true
        };
    }

    try {
        requireClientReady({ client });

        const thread = await client.channels.fetch(threadId);
        if (!thread || !(thread.isThread())) {
            return {
                content: [{ type: "text", text: `Cannot find thread with ID: ${threadId}` }],
                isError: true
            };
        }
        if (!('send' in thread)) {
            return {
                content: [{ type: "text", text: `This thread does not support sending messages` }],
                isError: true
            };
        }
        // Send the reply
        const sentMessage = await thread.send(messageSanitized.sanitized);
        return {
            content: [{
                    type: "text",
                    text: `Successfully replied to forum post. Message ID: ${sentMessage.id}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
};

export const deleteForumPostHandler = async (args, { client }) => {
    const { threadId, reason } = DeleteForumPostSchema.parse(args);

    // Validate thread ID
    const threadIdValidation = validateSnowflake(threadId);
    if (!threadIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid thread ID: ${threadIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady({ client });

        const thread = await client.channels.fetch(threadId);
        if (!thread || !thread.isThread()) {
            return {
                content: [{ type: "text", text: `Cannot find forum post/thread with ID: ${threadId}` }],
                isError: true
            };
        }
        // Delete the forum post/thread
        await thread.delete(reasonSanitized.sanitized || "Forum post deleted via API");
        return {
            content: [{
                    type: "text",
                    text: `Successfully deleted forum post/thread with ID: ${threadId}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
};
