import { ListMembersSchema, GetMemberSchema, ListRolesSchema, CreateRoleSchema, EditRoleSchema, DeleteRoleSchema, AssignRoleSchema, RemoveRoleSchema, SetChannelPermissionsSchema, GetChannelPermissionsSchema, RemoveChannelPermissionsSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { PermissionFlagsBits, OverwriteType } from "discord.js";

/**
 * List all members in a guild
 */
export async function listMembersHandler(args, context) {
    const { guildId, limit, botsOnly } = ListMembersSchema.parse(args);

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

        // Fetch members
        const members = await guild.members.fetch({ limit });

        let memberList = Array.from(members.values()).map(member => ({
            id: member.user.id,
            username: member.user.username,
            displayName: member.displayName,
            discriminator: member.user.discriminator,
            bot: member.user.bot,
            roles: member.roles.cache.map(r => ({ id: r.id, name: r.name, color: r.hexColor })).filter(r => r.name !== '@everyone'),
            joinedAt: member.joinedAt?.toISOString(),
            avatar: member.user.displayAvatarURL(),
            status: member.presence?.status || 'offline'
        }));

        // Filter bots only if requested
        if (botsOnly) {
            memberList = memberList.filter(m => m.bot);
        }

        const summary = {
            guildId,
            guildName: guild.name,
            totalFetched: memberList.length,
            humans: memberList.filter(m => !m.bot).length,
            bots: memberList.filter(m => m.bot).length,
            members: memberList
        };

        return {
            content: [{
                type: "text",
                text: JSON.stringify(summary, null, 2)
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Get detailed info about a specific member
 */
export async function getMemberHandler(args, context) {
    const { guildId, userId } = GetMemberSchema.parse(args);

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

        const member = await guild.members.fetch(userId);
        if (!member) {
            return {
                content: [{ type: "text", text: `Cannot find member with ID: ${userId}` }],
                isError: true
            };
        }

        const memberInfo = {
            id: member.user.id,
            username: member.user.username,
            displayName: member.displayName,
            discriminator: member.user.discriminator,
            tag: member.user.tag,
            bot: member.user.bot,
            system: member.user.system,
            avatar: member.user.displayAvatarURL({ size: 256 }),
            banner: member.user.bannerURL?.({ size: 512 }),
            accentColor: member.user.hexAccentColor,
            createdAt: member.user.createdAt?.toISOString(),
            joinedAt: member.joinedAt?.toISOString(),
            premiumSince: member.premiumSince?.toISOString(),
            nickname: member.nickname,
            roles: member.roles.cache
                .filter(r => r.name !== '@everyone')
                .sort((a, b) => b.position - a.position)
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    color: r.hexColor,
                    position: r.position,
                    permissions: r.permissions.toArray()
                })),
            permissions: member.permissions.toArray(),
            presence: {
                status: member.presence?.status || 'offline',
                activities: member.presence?.activities?.map(a => ({
                    name: a.name,
                    type: a.type,
                    details: a.details,
                    state: a.state
                })) || []
            },
            voice: member.voice?.channel ? {
                channelId: member.voice.channel.id,
                channelName: member.voice.channel.name,
                muted: member.voice.mute,
                deafened: member.voice.deaf
            } : null
        };

        return {
            content: [{
                type: "text",
                text: JSON.stringify(memberInfo, null, 2)
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * List all roles in a guild
 */
export async function listRolesHandler(args, context) {
    const { guildId } = ListRolesSchema.parse(args);

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

        const roles = guild.roles.cache
            .sort((a, b) => b.position - a.position)
            .map(role => ({
                id: role.id,
                name: role.name,
                color: role.hexColor,
                position: role.position,
                mentionable: role.mentionable,
                managed: role.managed,
                permissions: role.permissions.toArray(),
                memberCount: role.members.size
            }));

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    guildId,
                    guildName: guild.name,
                    roleCount: roles.length,
                    roles
                }, null, 2)
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Create a new role in a guild
 */
export async function createRoleHandler(args, context) {
    const { guildId, name, color, hoist, mentionable, permissions, reason } = CreateRoleSchema.parse(args);

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

        // Parse color (handle hex strings)
        let roleColor = undefined;
        if (color) {
            roleColor = color.startsWith('#') ? parseInt(color.slice(1), 16) : parseInt(color, 16);
        }

        // Parse permissions
        let rolePermissions = undefined;
        if (permissions && permissions.length > 0) {
            rolePermissions = permissions.reduce((acc, perm) => {
                if (PermissionFlagsBits[perm]) {
                    acc |= PermissionFlagsBits[perm];
                }
                return acc;
            }, 0n);
        }

        const role = await guild.roles.create({
            name,
            color: roleColor,
            hoist,
            mentionable,
            permissions: rolePermissions,
            reason
        });

        return {
            content: [{
                type: "text",
                text: `Successfully created role "${role.name}" (ID: ${role.id}) with color ${role.hexColor}`
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Edit an existing role
 */
export async function editRoleHandler(args, context) {
    const { guildId, roleId, name, color, hoist, mentionable, permissions, position, reason } = EditRoleSchema.parse(args);

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

        const role = await guild.roles.fetch(roleId);
        if (!role) {
            return {
                content: [{ type: "text", text: `Cannot find role with ID: ${roleId}` }],
                isError: true
            };
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (color !== undefined) {
            updateData.color = color.startsWith('#') ? parseInt(color.slice(1), 16) : parseInt(color, 16);
        }
        if (hoist !== undefined) updateData.hoist = hoist;
        if (mentionable !== undefined) updateData.mentionable = mentionable;
        if (permissions !== undefined && permissions.length > 0) {
            updateData.permissions = permissions.reduce((acc, perm) => {
                if (PermissionFlagsBits[perm]) {
                    acc |= PermissionFlagsBits[perm];
                }
                return acc;
            }, 0n);
        }
        if (reason) updateData.reason = reason;

        await role.edit(updateData);

        // Handle position separately if specified
        if (position !== undefined) {
            await role.setPosition(position);
        }

        return {
            content: [{
                type: "text",
                text: `Successfully edited role "${role.name}" (ID: ${role.id})`
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Delete a role
 */
export async function deleteRoleHandler(args, context) {
    const { guildId, roleId, reason } = DeleteRoleSchema.parse(args);

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

        const role = await guild.roles.fetch(roleId);
        if (!role) {
            return {
                content: [{ type: "text", text: `Cannot find role with ID: ${roleId}` }],
                isError: true
            };
        }

        const roleName = role.name;
        await role.delete(reason);

        return {
            content: [{
                type: "text",
                text: `Successfully deleted role "${roleName}"`
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Assign a role to a member
 */
export async function assignRoleHandler(args, context) {
    const { guildId, userId, roleId, reason } = AssignRoleSchema.parse(args);

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

        const member = await guild.members.fetch(userId);
        if (!member) {
            return {
                content: [{ type: "text", text: `Cannot find member with ID: ${userId}` }],
                isError: true
            };
        }

        const role = await guild.roles.fetch(roleId);
        if (!role) {
            return {
                content: [{ type: "text", text: `Cannot find role with ID: ${roleId}` }],
                isError: true
            };
        }

        await member.roles.add(role, reason);

        return {
            content: [{
                type: "text",
                text: `Successfully assigned role "${role.name}" to ${member.user.username}`
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Remove a role from a member
 */
export async function removeRoleHandler(args, context) {
    const { guildId, userId, roleId, reason } = RemoveRoleSchema.parse(args);

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

        const member = await guild.members.fetch(userId);
        if (!member) {
            return {
                content: [{ type: "text", text: `Cannot find member with ID: ${userId}` }],
                isError: true
            };
        }

        const role = await guild.roles.fetch(roleId);
        if (!role) {
            return {
                content: [{ type: "text", text: `Cannot find role with ID: ${roleId}` }],
                isError: true
            };
        }

        await member.roles.remove(role, reason);

        return {
            content: [{
                type: "text",
                text: `Successfully removed role "${role.name}" from ${member.user.username}`
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Set permission overwrites for a channel
 */
export async function setChannelPermissionsHandler(args, context) {
    const { channelId, targetId, targetType, allow, deny, reason } = SetChannelPermissionsSchema.parse(args);

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

        // Build permissions object with individual permission flags
        const permissionOptions = {};

        if (allow && allow.length > 0) {
            for (const perm of allow) {
                if (PermissionFlagsBits[perm]) {
                    permissionOptions[perm] = true;
                }
            }
        }

        if (deny && deny.length > 0) {
            for (const perm of deny) {
                if (PermissionFlagsBits[perm]) {
                    permissionOptions[perm] = false;
                }
            }
        }

        await channel.permissionOverwrites.edit(targetId, permissionOptions, { reason });

        const targetName = targetType === 'role' ?
            (await channel.guild.roles.fetch(targetId))?.name || targetId :
            (await channel.guild.members.fetch(targetId))?.user.username || targetId;

        return {
            content: [{
                type: "text",
                text: `Successfully set permissions for ${targetType} "${targetName}" on channel "${channel.name}". Allow: [${allow?.join(', ') || 'none'}], Deny: [${deny?.join(', ') || 'none'}]`
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Get permission overwrites for a channel
 */
export async function getChannelPermissionsHandler(args, context) {
    const { channelId } = GetChannelPermissionsSchema.parse(args);

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

        const overwrites = channel.permissionOverwrites.cache.map(overwrite => {
            const allowArray = overwrite.allow.toArray();
            const denyArray = overwrite.deny.toArray();

            return {
                id: overwrite.id,
                type: overwrite.type === OverwriteType.Role ? 'role' : 'member',
                allow: allowArray,
                deny: denyArray
            };
        });

        // Try to resolve names for roles and members
        const resolvedOverwrites = await Promise.all(overwrites.map(async (ow) => {
            let name = ow.id;
            try {
                if (ow.type === 'role') {
                    const role = await channel.guild.roles.fetch(ow.id);
                    name = role?.name || ow.id;
                } else {
                    const member = await channel.guild.members.fetch(ow.id);
                    name = member?.user.username || ow.id;
                }
            } catch {}
            return { ...ow, name };
        }));

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    channelId,
                    channelName: channel.name,
                    permissionOverwrites: resolvedOverwrites
                }, null, 2)
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}

/**
 * Remove permission overwrites for a channel
 */
export async function removeChannelPermissionsHandler(args, context) {
    const { channelId, targetId, reason } = RemoveChannelPermissionsSchema.parse(args);

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

        const overwrite = channel.permissionOverwrites.cache.get(targetId);
        if (!overwrite) {
            return {
                content: [{ type: "text", text: `No permission overwrite found for target ID: ${targetId}` }],
                isError: true
            };
        }

        await channel.permissionOverwrites.delete(targetId, reason);

        return {
            content: [{
                type: "text",
                text: `Successfully removed permission overwrite for ID "${targetId}" on channel "${channel.name}"`
            }]
        };
    } catch (error) {
        return handleDiscordError(error);
    }
}
