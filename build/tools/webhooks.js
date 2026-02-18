import { CreateWebhookSchema, SendWebhookMessageSchema, EditWebhookSchema, DeleteWebhookSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { requireClientReady } from "./middleware.js";
import {
    sanitizeRoleName,
    sanitizeWebhookContent,
    sanitizeReason,
    validateSnowflake
} from "../sanitizer.js";
// Create webhook handler
export async function createWebhookHandler(args, context) {
    const { channelId, name, avatar, reason } = CreateWebhookSchema.parse(args);

    // Validate channel ID
    const channelIdValidation = validateSnowflake(channelId);
    if (!channelIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid channel ID: ${channelIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize webhook name (uses role name sanitization - similar rules)
    const nameSanitized = sanitizeRoleName(name);
    if (nameSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid webhook name: ${nameSanitized.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        const channel = await context.client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
            return {
                content: [{ type: "text", text: `Cannot find text channel with ID: ${channelId}` }],
                isError: true
            };
        }
        // Check if the channel supports webhooks
        if (!('createWebhook' in channel)) {
            return {
                content: [{ type: "text", text: `Channel type does not support webhooks: ${channelId}` }],
                isError: true
            };
        }
        // Create the webhook
        const webhook = await channel.createWebhook({
            name: nameSanitized.sanitized,
            avatar: avatar,
            reason: reasonSanitized.sanitized
        });
        return {
            content: [{
                    type: "text",
                    text: `Successfully created webhook with ID: ${webhook.id} and token: [REDACTED]`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Send webhook message handler
export async function sendWebhookMessageHandler(args, context) {
    const { webhookId, webhookToken, content, username, avatarURL, threadId } = SendWebhookMessageSchema.parse(args);

    // Validate webhook ID
    const webhookIdValidation = validateSnowflake(webhookId);
    if (!webhookIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid webhook ID: ${webhookIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize webhook content
    const contentSanitized = sanitizeWebhookContent(content);
    if (contentSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid content: ${contentSanitized.error}` }],
            isError: true
        };
    }

    try {
        requireClientReady(context);
        const webhook = await context.client.fetchWebhook(webhookId, webhookToken);
        if (!webhook) {
            return {
                content: [{ type: "text", text: `Cannot find webhook with ID: ${webhookId}` }],
                isError: true
            };
        }
        // Send the message
        await webhook.send({
            content: contentSanitized.sanitized,
            username: username,
            avatarURL: avatarURL,
            threadId: threadId
        });
        return {
            content: [{
                    type: "text",
                    text: `Successfully sent webhook message to webhook ID: ${webhookId}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Edit webhook handler
export async function editWebhookHandler(args, context) {
    const { webhookId, webhookToken, name, avatar, channelId, reason } = EditWebhookSchema.parse(args);

    // Validate webhook ID
    const webhookIdValidation = validateSnowflake(webhookId);
    if (!webhookIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid webhook ID: ${webhookIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize name if provided
    let nameSanitized = null;
    if (name !== undefined) {
        nameSanitized = sanitizeRoleName(name);
        if (nameSanitized.error) {
            return {
                content: [{ type: "text", text: `Invalid webhook name: ${nameSanitized.error}` }],
                isError: true
            };
        }
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        const webhook = await context.client.fetchWebhook(webhookId, webhookToken);
        if (!webhook) {
            return {
                content: [{ type: "text", text: `Cannot find webhook with ID: ${webhookId}` }],
                isError: true
            };
        }
        // Edit the webhook
        await webhook.edit({
            name: nameSanitized ? nameSanitized.sanitized : name,
            avatar: avatar,
            channel: channelId,
            reason: reasonSanitized.sanitized
        });
        return {
            content: [{
                    type: "text",
                    text: `Successfully edited webhook with ID: ${webhook.id}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
// Delete webhook handler
export async function deleteWebhookHandler(args, context) {
    const { webhookId, webhookToken, reason } = DeleteWebhookSchema.parse(args);

    // Validate webhook ID
    const webhookIdValidation = validateSnowflake(webhookId);
    if (!webhookIdValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid webhook ID: ${webhookIdValidation.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);
        const webhook = await context.client.fetchWebhook(webhookId, webhookToken);
        if (!webhook) {
            return {
                content: [{ type: "text", text: `Cannot find webhook with ID: ${webhookId}` }],
                isError: true
            };
        }
        // Delete the webhook
        await webhook.delete(reasonSanitized.sanitized || "Webhook deleted via API");
        return {
            content: [{
                    type: "text",
                    text: `Successfully deleted webhook with ID: ${webhook.id}`
                }]
        };
    }
    catch (error) {
        return handleDiscordError(error);
    }
}
