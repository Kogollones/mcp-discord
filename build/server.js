import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { toolList } from './toolList.js';
import { createToolContext, loginHandler, sendMessageHandler, getForumChannelsHandler, createForumPostHandler, getForumPostHandler, replyToForumHandler, deleteForumPostHandler, createTextChannelHandler, deleteChannelHandler, editChannelHandler, readMessagesHandler, getServerInfoHandler, addReactionHandler, addMultipleReactionsHandler, removeReactionHandler, deleteMessageHandler, bulkDeleteMessagesHandler, editMessageHandler, pinMessageHandler, unpinMessageHandler, moveMessagesHandler, createWebhookHandler, sendWebhookMessageHandler, editWebhookHandler, deleteWebhookHandler, createCategoryHandler, editCategoryHandler, deleteCategoryHandler, listMembersHandler, getMemberHandler, listRolesHandler, createRoleHandler, editRoleHandler, deleteRoleHandler, assignRoleHandler, removeRoleHandler, setChannelPermissionsHandler, getChannelPermissionsHandler, removeChannelPermissionsHandler, createVoiceChannelHandler } from './tools/tools.js';
import { info } from './logger.js';
export class DiscordMCPServer {
    client;
    transport;
    server;
    toolContext;
    clientStatusInterval = null;
    constructor(client, transport) {
        this.client = client;
        this.transport = transport;
        this.server = new Server({
            name: "MCP-Discord",
            version: "1.0.0"
        }, {
            capabilities: {
                tools: {}
            }
        });
        this.toolContext = createToolContext(client);
        this.setupHandlers();
    }
    setupHandlers() {
        // Set up the tool list
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: toolList
            };
        });
        // Handle tool execution requests
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            try {
                let toolResponse;
                switch (name) {
                    case "discord_create_category":
                        toolResponse = await createCategoryHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_edit_category":
                        toolResponse = await editCategoryHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_delete_category":
                        toolResponse = await deleteCategoryHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_login":
                        toolResponse = await loginHandler(args, this.toolContext);
                        this.logClientState("after discord_login handler");
                        return toolResponse;
                    case "discord_send":
                        this.logClientState("before discord_send handler");
                        toolResponse = await sendMessageHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_get_forum_channels":
                        this.logClientState("before discord_get_forum_channels handler");
                        toolResponse = await getForumChannelsHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_create_forum_post":
                        this.logClientState("before discord_create_forum_post handler");
                        toolResponse = await createForumPostHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_get_forum_post":
                        this.logClientState("before discord_get_forum_post handler");
                        toolResponse = await getForumPostHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_reply_to_forum":
                        this.logClientState("before discord_reply_to_forum handler");
                        toolResponse = await replyToForumHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_delete_forum_post":
                        this.logClientState("before discord_delete_forum_post handler");
                        toolResponse = await deleteForumPostHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_create_text_channel":
                        this.logClientState("before discord_create_text_channel handler");
                        toolResponse = await createTextChannelHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_delete_channel":
                        this.logClientState("before discord_delete_channel handler");
                        toolResponse = await deleteChannelHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_edit_channel":
                        this.logClientState("before discord_edit_channel handler");
                        toolResponse = await editChannelHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_read_messages":
                        this.logClientState("before discord_read_messages handler");
                        toolResponse = await readMessagesHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_get_server_info":
                        this.logClientState("before discord_get_server_info handler");
                        toolResponse = await getServerInfoHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_add_reaction":
                        this.logClientState("before discord_add_reaction handler");
                        toolResponse = await addReactionHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_add_multiple_reactions":
                        this.logClientState("before discord_add_multiple_reactions handler");
                        toolResponse = await addMultipleReactionsHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_remove_reaction":
                        this.logClientState("before discord_remove_reaction handler");
                        toolResponse = await removeReactionHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_delete_message":
                        this.logClientState("before discord_delete_message handler");
                        toolResponse = await deleteMessageHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_bulk_delete_messages":
                        this.logClientState("before discord_bulk_delete_messages handler");
                        toolResponse = await bulkDeleteMessagesHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_edit_message":
                        this.logClientState("before discord_edit_message handler");
                        toolResponse = await editMessageHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_pin_message":
                        this.logClientState("before discord_pin_message handler");
                        toolResponse = await pinMessageHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_unpin_message":
                        this.logClientState("before discord_unpin_message handler");
                        toolResponse = await unpinMessageHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_move_messages":
                        this.logClientState("before discord_move_messages handler");
                        toolResponse = await moveMessagesHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_create_webhook":
                        this.logClientState("before discord_create_webhook handler");
                        toolResponse = await createWebhookHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_send_webhook_message":
                        this.logClientState("before discord_send_webhook_message handler");
                        toolResponse = await sendWebhookMessageHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_edit_webhook":
                        this.logClientState("before discord_edit_webhook handler");
                        toolResponse = await editWebhookHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_delete_webhook":
                        this.logClientState("before discord_delete_webhook handler");
                        toolResponse = await deleteWebhookHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_batch_operations":
                        this.logClientState("before discord_batch_operations handler");
                        toolResponse = await this.handleBatchOperations(args);
                        return toolResponse;
                    case "discord_list_members":
                        this.logClientState("before discord_list_members handler");
                        toolResponse = await listMembersHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_get_member":
                        this.logClientState("before discord_get_member handler");
                        toolResponse = await getMemberHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_list_roles":
                        this.logClientState("before discord_list_roles handler");
                        toolResponse = await listRolesHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_create_role":
                        this.logClientState("before discord_create_role handler");
                        toolResponse = await createRoleHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_edit_role":
                        this.logClientState("before discord_edit_role handler");
                        toolResponse = await editRoleHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_delete_role":
                        this.logClientState("before discord_delete_role handler");
                        toolResponse = await deleteRoleHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_assign_role":
                        this.logClientState("before discord_assign_role handler");
                        toolResponse = await assignRoleHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_remove_role":
                        this.logClientState("before discord_remove_role handler");
                        toolResponse = await removeRoleHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_set_channel_permissions":
                        this.logClientState("before discord_set_channel_permissions handler");
                        toolResponse = await setChannelPermissionsHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_get_channel_permissions":
                        this.logClientState("before discord_get_channel_permissions handler");
                        toolResponse = await getChannelPermissionsHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_remove_channel_permissions":
                        this.logClientState("before discord_remove_channel_permissions handler");
                        toolResponse = await removeChannelPermissionsHandler(args, this.toolContext);
                        return toolResponse;
                    case "discord_create_voice_channel":
                        this.logClientState("before discord_create_voice_channel handler");
                        toolResponse = await createVoiceChannelHandler(args, this.toolContext);
                        return toolResponse;
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            }
            catch (error) {
                if (error instanceof z.ZodError) {
                    return {
                        content: [{
                                type: "text",
                                text: `Invalid arguments: ${error.errors
                                    .map((e) => `${e.path.join(".")}: ${e.message}`)
                                    .join(", ")}`
                            }],
                        isError: true
                    };
                }
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                return {
                    content: [{ type: "text", text: `Error executing tool: ${errorMessage}` }],
                    isError: true
                };
            }
        });
    }
    logClientState(context) {
        info(`Discord client state [${context}]: ${JSON.stringify({
            isReady: this.client.isReady(),
            hasToken: !!this.client.token,
            user: this.client.user ? {
                id: this.client.user.id,
                tag: this.client.user.tag,
            } : null
        })}`);
    }
    async handleBatchOperations(args) {
        const { operations, stopOnError = false } = args;
        const results = [];
        for (let i = 0; i < operations.length; i++) {
            const op = operations[i];
            try {
                let toolResponse;
                switch (op.tool) {
                    case "discord_edit_channel":
                        toolResponse = await editChannelHandler(op.args, this.toolContext);
                        break;
                    case "discord_create_text_channel":
                        toolResponse = await createTextChannelHandler(op.args, this.toolContext);
                        break;
                    case "discord_delete_channel":
                        toolResponse = await deleteChannelHandler(op.args, this.toolContext);
                        break;
                    case "discord_create_category":
                        toolResponse = await createCategoryHandler(op.args, this.toolContext);
                        break;
                    case "discord_edit_category":
                        toolResponse = await editCategoryHandler(op.args, this.toolContext);
                        break;
                    case "discord_delete_category":
                        toolResponse = await deleteCategoryHandler(op.args, this.toolContext);
                        break;
                    case "discord_send":
                        toolResponse = await sendMessageHandler(op.args, this.toolContext);
                        break;
                    case "discord_create_webhook":
                        toolResponse = await createWebhookHandler(op.args, this.toolContext);
                        break;
                    case "discord_edit_webhook":
                        toolResponse = await editWebhookHandler(op.args, this.toolContext);
                        break;
                    case "discord_delete_webhook":
                        toolResponse = await deleteWebhookHandler(op.args, this.toolContext);
                        break;
                    default:
                        toolResponse = { content: [{ type: "text", text: `Unknown tool: ${op.tool}` }], isError: true };
                }
                results.push({ index: i, tool: op.tool, success: !toolResponse.isError, result: toolResponse.content[0].text });
                if (toolResponse.isError && stopOnError) {
                    break;
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                results.push({ index: i, tool: op.tool, success: false, result: errorMessage });
                if (stopOnError) {
                    break;
                }
            }
        }
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    summary: { total: operations.length, successful, failed },
                    results
                }, null, 2)
            }],
            isError: failed > 0 && successful === 0
        };
    }
    async start() {
        // Add client to server context so transport can access it
        this.server._context = { client: this.client };
        this.server.client = this.client;
        // Setup periodic client state logging
        this.clientStatusInterval = setInterval(() => {
            this.logClientState("periodic check");
        }, 10000);
        await this.transport.start(this.server);
    }
    async stop() {
        // Clear the periodic check interval
        if (this.clientStatusInterval) {
            clearInterval(this.clientStatusInterval);
            this.clientStatusInterval = null;
        }
        await this.transport.stop();
    }
}
