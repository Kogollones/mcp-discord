import { z } from "zod";
export const DiscordLoginSchema = z.object({
    token: z.string().optional()
});
export const SendMessageSchema = z.object({
    channelId: z.string(),
    message: z.string()
});
export const GetForumChannelsSchema = z.object({
    guildId: z.string()
});
export const CreateForumPostSchema = z.object({
    forumChannelId: z.string(),
    title: z.string(),
    content: z.string(),
    tags: z.array(z.string()).optional()
});
export const GetForumPostSchema = z.object({
    threadId: z.string()
});
export const ReplyToForumSchema = z.object({
    threadId: z.string(),
    message: z.string()
});
export const CreateTextChannelSchema = z.object({
    guildId: z.string(),
    channelName: z.string(),
    topic: z.string().optional(),
    reason: z.string().optional()
});
// Category schemas
export const CreateCategorySchema = z.object({
    guildId: z.string(),
    name: z.string(),
    position: z.number().optional(),
    reason: z.string().optional()
});
export const EditCategorySchema = z.object({
    categoryId: z.string(),
    name: z.string().optional(),
    position: z.number().optional(),
    reason: z.string().optional()
});
export const DeleteCategorySchema = z.object({
    categoryId: z.string(),
    reason: z.string().optional()
});
export const DeleteChannelSchema = z.object({
    channelId: z.string(),
    reason: z.string().optional()
});
export const EditChannelSchema = z.object({
    channelId: z.string(),
    name: z.string().optional(),
    topic: z.string().optional(),
    parentId: z.string().optional().nullable(),
    position: z.number().optional(),
    nsfw: z.boolean().optional(),
    rateLimitPerUser: z.number().optional(),
    reason: z.string().optional()
});
export const ReadMessagesSchema = z.object({
    channelId: z.string(),
    limit: z.number().min(1).max(100).optional().default(50)
});
export const GetServerInfoSchema = z.object({
    guildId: z.string()
});
export const AddReactionSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    emoji: z.string()
});
export const AddMultipleReactionsSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    emojis: z.array(z.string())
});
export const RemoveReactionSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    emoji: z.string(),
    userId: z.string().optional()
});
export const DeleteForumPostSchema = z.object({
    threadId: z.string(),
    reason: z.string().optional()
});
export const DeleteMessageSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    reason: z.string().optional()
});
export const CreateWebhookSchema = z.object({
    channelId: z.string(),
    name: z.string(),
    avatar: z.string().optional(),
    reason: z.string().optional()
});
export const SendWebhookMessageSchema = z.object({
    webhookId: z.string(),
    webhookToken: z.string(),
    content: z.string(),
    username: z.string().optional(),
    avatarURL: z.string().optional(),
    threadId: z.string().optional()
});
export const EditWebhookSchema = z.object({
    webhookId: z.string(),
    webhookToken: z.string().optional(),
    name: z.string().optional(),
    avatar: z.string().optional(),
    channelId: z.string().optional(),
    reason: z.string().optional()
});
export const DeleteWebhookSchema = z.object({
    webhookId: z.string(),
    webhookToken: z.string().optional(),
    reason: z.string().optional()
});
export const BatchOperationsSchema = z.object({
    operations: z.array(z.object({
        tool: z.string(),
        args: z.record(z.any())
    })),
    stopOnError: z.boolean().optional().default(false)
});
export const BulkDeleteMessagesSchema = z.object({
    channelId: z.string(),
    messageIds: z.array(z.string()).optional(),
    limit: z.number().min(1).max(100).optional(),
    beforeMessageId: z.string().optional(),
    reason: z.string().optional()
});
export const EditMessageSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    content: z.string().optional(),
    reason: z.string().optional()
});
export const PinMessageSchema = z.object({
    channelId: z.string(),
    messageId: z.string(),
    reason: z.string().optional()
});
export const MoveMessagesSchema = z.object({
    sourceChannelId: z.string(),
    targetChannelId: z.string(),
    messageIds: z.array(z.string()),
    deleteOriginals: z.boolean().optional().default(true)
});
// Member management schemas
export const ListMembersSchema = z.object({
    guildId: z.string(),
    limit: z.number().min(1).max(1000).optional().default(100),
    botsOnly: z.boolean().optional().default(false)
});
export const GetMemberSchema = z.object({
    guildId: z.string(),
    userId: z.string()
});
export const ListRolesSchema = z.object({
    guildId: z.string()
});
// Role management schemas
export const CreateRoleSchema = z.object({
    guildId: z.string(),
    name: z.string(),
    color: z.string().optional(),
    hoist: z.boolean().optional().default(false),
    mentionable: z.boolean().optional().default(false),
    permissions: z.array(z.string()).optional(),
    reason: z.string().optional()
});
export const EditRoleSchema = z.object({
    guildId: z.string(),
    roleId: z.string(),
    name: z.string().optional(),
    color: z.string().optional(),
    hoist: z.boolean().optional(),
    mentionable: z.boolean().optional(),
    permissions: z.array(z.string()).optional(),
    position: z.number().optional(),
    reason: z.string().optional()
});
export const DeleteRoleSchema = z.object({
    guildId: z.string(),
    roleId: z.string(),
    reason: z.string().optional()
});
export const AssignRoleSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    roleId: z.string(),
    reason: z.string().optional()
});
export const RemoveRoleSchema = z.object({
    guildId: z.string(),
    userId: z.string(),
    roleId: z.string(),
    reason: z.string().optional()
});
// Permission management schemas
export const SetChannelPermissionsSchema = z.object({
    channelId: z.string(),
    targetId: z.string(), // Role ID or User ID
    targetType: z.enum(['role', 'member']),
    allow: z.array(z.string()).optional(), // Permission names to allow
    deny: z.array(z.string()).optional(), // Permission names to deny
    reason: z.string().optional()
});
export const GetChannelPermissionsSchema = z.object({
    channelId: z.string()
});
export const RemoveChannelPermissionsSchema = z.object({
    channelId: z.string(),
    targetId: z.string(), // Role ID or User ID
    reason: z.string().optional()
});
// Voice channel schema
export const CreateVoiceChannelSchema = z.object({
    guildId: z.string(),
    channelName: z.string(),
    bitrate: z.number().optional(),
    userLimit: z.number().optional(),
    parentId: z.string().optional(),
    reason: z.string().optional()
});
