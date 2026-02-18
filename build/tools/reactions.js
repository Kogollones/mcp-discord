import { AddReactionSchema, AddMultipleReactionsSchema, RemoveReactionSchema, DeleteMessageSchema, BulkDeleteMessagesSchema, EditMessageSchema, PinMessageSchema, MoveMessagesSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { requireClientReady } from "./middleware.js";
import { withRateLimitBatch, withRateLimitSequential, Priority } from "../rateLimiter.js";
import {
    sanitizeMessageContent,
    sanitizeReason,
    validateSnowflake,
    validateEmoji,
    validateIdArray,
    validateUserMention
} from "../sanitizer.js";
// Add reaction handler
export async function addReactionHandler(args, context) {
    const { channelId, messageId, emoji } = AddReactionSchema.parse(args);

    // Validate IDs
    const channelIdValidation = validateSnowflake(channelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    const messageIdValidation = validateSnowflake(messageId);
    if (!messageIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid message ID: ${messageIdValidation.error}` }],
            isError: true
        };
    }

    // Validate emoji
    const emojiValidation = validateEmoji(emoji);
    if (!emojiValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid emoji: ${emojiValidation.error}` }],
            isError: true
        };
    }

    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return {
                content: [{ type: "text", text: `Cannot find message with ID: ${messageId}` }],
                isError: true
            };
        }
        // Add the reaction
        await message.react(emoji);
        return {
            content: [{
                    type: "text",
                    text: `Successfully added reaction ${emoji} to message ID: ${messageId}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Add multiple reactions handler
export async function addMultipleReactionsHandler(args, context) {
    const { channelId, messageId, emojis } = AddMultipleReactionsSchema.parse(args);

    // Validate IDs
    const channelIdValidation = validateSnowflake(channelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    const messageIdValidation = validateSnowflake(messageId);
    if (!messageIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid message ID: ${messageIdValidation.error}` }],
            isError: true
        };
    }

    // Validate all emojis
    for (const emoji of emojis) {
        const emojiValidation = validateEmoji(emoji);
        if (!emojiValidation.valid) {
            return {
                content: [{ type: "text", text: `Invalid emoji: ${emojiValidation.error}` }],
                isError: true
            };
        }
    }

    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return {
                content: [{ type: "text", text: `Cannot find message with ID: ${messageId}` }],
                isError: true
            };
        }
        // Add reactions using rate-aware batch processing
        // Using sequential execution with dynamic delays for better rate limit handling
        const reactionFns = emojis.map(emoji => async () => {
            await message.react(emoji);
            return { emoji, success: true };
        });

        const results = await withRateLimitSequential(reactionFns, {
            delayMs: 250,        // Initial delay between reactions
            useBackoff: true,    // Enable exponential backoff on rate limits
            priority: Priority.NORMAL
        });

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        let responseText = `Added ${successCount} of ${emojis.length} reactions to message ID: ${messageId}`;
        if (failCount > 0) {
            responseText += ` (${failCount} failed)`;
        }

        return {
            content: [{
                    type: "text",
                    text: responseText
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Remove reaction handler
export async function removeReactionHandler(args, context) {
    const { channelId, messageId, emoji, userId } = RemoveReactionSchema.parse(args);

    // Validate IDs
    const channelIdValidation = validateSnowflake(channelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    const messageIdValidation = validateSnowflake(messageId);
    if (!messageIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid message ID: ${messageIdValidation.error}` }],
            isError: true
        };
    }

    // Validate emoji
    const emojiValidation = validateEmoji(emoji);
    if (!emojiValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid emoji: ${emojiValidation.error}` }],
            isError: true
        };
    }

    // Validate userId if provided
    if (userId) {
        const userIdValidation = validateUserMention(userId);
        if (!userIdValidation.valid) {
            return {
                content: [{ type: "text", text: `Invalid user ID: ${userIdValidation.error}` }],
                isError: true
            };
        }
    }

    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return {
                content: [{ type: "text", text: `Cannot find message with ID: ${messageId}` }],
                isError: true
            };
        }
        // Get the reactions
        const reactions = message.reactions.cache;
        // Find the specific reaction
        const reaction = reactions.find(r => r.emoji.toString() === emoji || r.emoji.name === emoji);
        if (!reaction) {
            return {
                content: [{ type: "text", text: `Reaction ${emoji} not found on message ID: ${messageId}` }],
                isError: true
            };
        }
        if (userId) {
            // Remove a specific user's reaction
            await reaction.users.remove(userId);
            return {
                content: [{
                        type: "text",
                        text: `Successfully removed reaction ${emoji} from user ID: ${userId} on message ID: ${messageId}`
                    }]
            };
        }
        else {
            // Remove bot's reaction
            await reaction.users.remove(context.client.user.id);
            return {
                content: [{
                        type: "text",
                        text: `Successfully removed bot's reaction ${emoji} from message ID: ${messageId}`
                    }]
            };
        }
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Delete message handler
export async function deleteMessageHandler(args, context) {
    const { channelId, messageId, reason } = DeleteMessageSchema.parse(args);

    // Validate IDs
    const channelIdValidation = validateSnowflake(channelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    const messageIdValidation = validateSnowflake(messageId);
    if (!messageIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid message ID: ${messageIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        // Fetch the message
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return {
                content: [{ type: "text", text: `Cannot find message with ID: ${messageId}` }],
                isError: true
            };
        }
        // Delete the message
        await message.delete();
        return {
            content: [{
                    type: "text",
                    text: `Successfully deleted message with ID: ${messageId} from channel: ${channelId}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Bulk delete messages handler
export async function bulkDeleteMessagesHandler(args, context) {
    const { channelId, messageIds, limit, beforeMessageId, reason } = BulkDeleteMessagesSchema.parse(args);

    // Validate channel ID
    const channelIdValidation = validateSnowflake(channelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    // Validate message IDs array if provided
    if (messageIds && messageIds.length > 0) {
        const idValidation = validateIdArray(messageIds, 100);
        if (!idValidation.valid) {
            return {
                content: [{ type: "text", text: idValidation.error }],
                isError: true
            };
        }
    }

    // Validate beforeMessageId if provided
    if (beforeMessageId) {
        const beforeIdValidation = validateSnowflake(beforeMessageId);
        if (!beforeIdValidation.valid) {
            return {
                content: [{ type: "text", text: `Invalid before message ID: ${beforeIdValidation.error}` }],
                isError: true
            };
        }
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel) || !('bulkDelete' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        let deletedCount = 0;
        if (messageIds && messageIds.length > 0) {
            // Delete specific messages by ID
            const deleted = await channel.bulkDelete(messageIds, true);
            deletedCount = deleted.size;
        } else if (limit) {
            // Fetch and delete recent messages
            const options = { limit };
            if (beforeMessageId) options.before = beforeMessageId;
            const messages = await channel.messages.fetch(options);
            const deleted = await channel.bulkDelete(messages, true);
            deletedCount = deleted.size;
        } else {
            return {
                content: [{ type: "text", text: "Must provide either messageIds or limit" }],
                isError: true
            };
        }
        return {
            content: [{
                type: "text",
                text: `Successfully deleted ${deletedCount} messages from channel: ${channelId}. Note: Messages older than 14 days cannot be bulk deleted.`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Edit message handler (only works for bot's own messages)
export async function editMessageHandler(args, context) {
    const { channelId, messageId, content } = EditMessageSchema.parse(args);

    // Validate IDs
    const channelIdValidation = validateSnowflake(channelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    const messageIdValidation = validateSnowflake(messageId);
    if (!messageIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid message ID: ${messageIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize content if provided
    let contentSanitized = null;
    if (content !== undefined) {
        contentSanitized = sanitizeMessageContent(content);
        if (contentSanitized.error) {
            return {
                content: [{ type: "text", text: `Invalid content: ${contentSanitized.error}` }],
                isError: true
            };
        }
    }

    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return {
                content: [{ type: "text", text: `Cannot find message with ID: ${messageId}` }],
                isError: true
            };
        }
        if (message.author.id !== context.client.user.id) {
            return {
                content: [{ type: "text", text: `Cannot edit message: Bot can only edit its own messages` }],
                isError: true
            };
        }
        await message.edit(contentSanitized ? contentSanitized.sanitized : content);
        return {
            content: [{
                type: "text",
                text: `Successfully edited message ID: ${messageId}`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Pin message handler
export async function pinMessageHandler(args, context) {
    const { channelId, messageId, reason } = PinMessageSchema.parse(args);
    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return {
                content: [{ type: "text", text: `Cannot find message with ID: ${messageId}` }],
                isError: true
            };
        }
        await message.pin(reason);
        return {
            content: [{
                type: "text",
                text: `Successfully pinned message ID: ${messageId}`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Unpin message handler
export async function unpinMessageHandler(args, context) {
    const { channelId, messageId, reason } = PinMessageSchema.parse(args);
    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased() || !('messages' in channel)) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        const message = await channel.messages.fetch(messageId);
        if (!message) {
            return {
                content: [{ type: "text", text: `Cannot find message with ID: ${messageId}` }],
                isError: true
            };
        }
        await message.unpin(reason);
        return {
            content: [{
                type: "text",
                text: `Successfully unpinned message ID: ${messageId}`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Move messages handler (copy to target channel, optionally delete originals)
export async function moveMessagesHandler(args, context) {
    const { sourceChannelId, targetChannelId, messageIds, deleteOriginals } = MoveMessagesSchema.parse(args);
    try {
        requireClientReady(context);
        const sourceChannel = await context.client.channels.fetch(sourceChannelId);
        const targetChannel = await context.client.channels.fetch(targetChannelId);
        if (!sourceChannel || !sourceChannel.isTextBased() || !('messages' in sourceChannel)) {
            return {
                content: [{ type: "text", text: `Cannot find source text channel with ID: ${sourceChannelId}` }],
                isError: true
            };
        }
        if (!targetChannel || !targetChannel.isTextBased() || !('send' in targetChannel)) {
            return {
                content: [{ type: "text", text: `Cannot find target text channel with ID: ${targetChannelId}` }],
                isError: true
            };
        }

        // Use rate-aware batch processing for moving messages
        const moveFns = messageIds.map(msgId => async () => {
            const message = await sourceChannel.messages.fetch(msgId);
            if (!message) {
                return { success: false, error: 'Message not found' };
            }
            // Build content for new message
            let newContent = `**[Moved from #${sourceChannel.name}]**\n`;
            newContent += `**${message.author.username}** (${message.createdAt.toISOString()}):\n`;
            newContent += message.content || '*(no text content)*';
            // Copy attachments info
            if (message.attachments.size > 0) {
                newContent += `\n*Attachments: ${message.attachments.map(a => a.url).join(', ')}*`;
            }
            await targetChannel.send(newContent);
            let deleted = false;
            if (deleteOriginals) {
                try {
                    await message.delete();
                    deleted = true;
                } catch (e) {
                    // May not have permission to delete
                }
            }
            return { success: true, deleted };
        });

        const results = await withRateLimitSequential(moveFns, {
            delayMs: 300,        // Delay between message moves
            useBackoff: true,    // Enable exponential backoff on rate limits
            priority: Priority.LOW,    // Bulk operation = low priority
            isBulk: true
        });

        const moved = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        const deleted = results.filter(r => r.success && r.deleted).length;

        return {
            content: [{
                type: "text",
                text: `Move complete: ${moved} messages copied to #${targetChannel.name}, ${deleted} originals deleted, ${failed} failed`
            }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
