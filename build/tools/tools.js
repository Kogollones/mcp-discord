import { loginHandler } from './login.js';
import { sendMessageHandler } from './send-message.js';
import { getForumChannelsHandler, createForumPostHandler, getForumPostHandler, replyToForumHandler, deleteForumPostHandler } from './forum.js';
import { createTextChannelHandler, deleteChannelHandler, editChannelHandler, readMessagesHandler, getServerInfoHandler, createCategoryHandler, editCategoryHandler, deleteCategoryHandler, createVoiceChannelHandler } from './channel.js';
import { addReactionHandler, addMultipleReactionsHandler, removeReactionHandler, deleteMessageHandler, bulkDeleteMessagesHandler, editMessageHandler, pinMessageHandler, unpinMessageHandler, moveMessagesHandler } from './reactions.js';
import { createWebhookHandler, sendWebhookMessageHandler, editWebhookHandler, deleteWebhookHandler } from './webhooks.js';
import { listMembersHandler, getMemberHandler, listRolesHandler, createRoleHandler, editRoleHandler, deleteRoleHandler, assignRoleHandler, removeRoleHandler, setChannelPermissionsHandler, getChannelPermissionsHandler, removeChannelPermissionsHandler } from './members.js';
// Export tool handlers
export { loginHandler, sendMessageHandler, getForumChannelsHandler, createForumPostHandler, getForumPostHandler, replyToForumHandler, deleteForumPostHandler, createTextChannelHandler, deleteChannelHandler, editChannelHandler, readMessagesHandler, getServerInfoHandler, addReactionHandler, addMultipleReactionsHandler, removeReactionHandler, deleteMessageHandler, bulkDeleteMessagesHandler, editMessageHandler, pinMessageHandler, unpinMessageHandler, moveMessagesHandler, createWebhookHandler, sendWebhookMessageHandler, editWebhookHandler, deleteWebhookHandler, createCategoryHandler, editCategoryHandler, deleteCategoryHandler, listMembersHandler, getMemberHandler, listRolesHandler, createRoleHandler, editRoleHandler, deleteRoleHandler, assignRoleHandler, removeRoleHandler, setChannelPermissionsHandler, getChannelPermissionsHandler, removeChannelPermissionsHandler, createVoiceChannelHandler };
// Create tool context
export function createToolContext(client) {
    return { client };
}
