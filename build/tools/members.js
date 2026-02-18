import { ListMembersSchema, GetMemberSchema, ListRolesSchema, CreateRoleSchema, EditRoleSchema, DeleteRoleSchema, AssignRoleSchema, RemoveRoleSchema, SetChannelPermissionsSchema, GetChannelPermissionsSchema, RemoveChannelPermissionsSchema } from "../schemas.js";
import { handleDiscordError } from "../errorHandler.js";
import { PermissionFlagsBits, OverwriteType } from "discord.js";
import { requireClientReady } from "./middleware.js";
import { fetchWithCache, getCache } from "../cache.js";
import {
    sanitizeRoleName,
    sanitizeReason,
    validateSnowflake,
    validateUserMention
} from "../sanitizer.js";

/**
 * List all members in a guild with pagination support
 */
export async function listMembersHandler(args, context) {
    const { guildId, limit, after, before, botsOnly } = ListMembersSchema.parse(args);

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

        // Build fetch options for pagination
        const fetchOptions = { limit };
        if (after) fetchOptions.after = after;
        if (before) fetchOptions.before = before;

        // Fetch members (members change frequently so don't cache long)
        const members = await guild.members.fetch(fetchOptions);

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

        // Determine pagination metadata
        const totalCount = guild.memberCount;
        const hasMorePages = memberList.length === limit;
        const nextCursor = hasMorePages && memberList.length > 0 ? memberList[memberList.length - 1].id : null;
        const previousCursor = after || null;

        const summary = {
            guildId,
            guildName: guild.name,
            totalMembers: totalCount,
            totalFetched: memberList.length,
            humans: memberList.filter(m => !m.bot).length,
            bots: memberList.filter(m => m.bot).length,
            pagination: {
                limit,
                nextCursor,
                previousCursor,
                hasNextPage: hasMorePages,
                hasPreviousPage: !!before
            },
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

        // Members can change frequently, use short cache
        const cacheKey = `${guildId}:${userId}`;
        const member = await fetchWithCache(
            'members',
            cacheKey,
            async () => await guild.members.fetch(userId),
            60000 // 1 minute TTL for members
        );
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
 * List all roles in a guild with pagination support
 */
export async function listRolesHandler(args, context) {
    const { guildId, limit, after, before } = ListRolesSchema.parse(args);

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

        // Fetch all roles and sort by position (highest first)
        let allRoles = Array.from(guild.roles.cache.values()).sort((a, b) => b.position - a.position);

        // Apply pagination cursors
        if (after) {
            const afterIndex = allRoles.findIndex(r => r.id === after);
            if (afterIndex !== -1) {
                allRoles = allRoles.slice(afterIndex + 1);
            }
        }
        if (before) {
            const beforeIndex = allRoles.findIndex(r => r.id === before);
            if (beforeIndex !== -1) {
                allRoles = allRoles.slice(0, beforeIndex);
            }
        }

        // Apply limit
        const paginatedRoles = allRoles.slice(0, limit);

        // Format role data
        const roles = paginatedRoles.map(role => ({
            id: role.id,
            name: role.name,
            color: role.hexColor,
            position: role.position,
            mentionable: role.mentionable,
            managed: role.managed,
            permissions: role.permissions.toArray(),
            memberCount: role.members.size,
            guildId: guildId
        }));

        // Determine pagination metadata
        const totalRoles = guild.roles.cache.size;
        const hasMorePages = allRoles.length > limit;
        const nextCursor = hasMorePages && paginatedRoles.length > 0 ? paginatedRoles[paginatedRoles.length - 1].id : null;
        const previousCursor = after || null;

        return {
            content: [{
                type: "text",
                text: JSON.stringify({
                    guildId,
                    guildName: guild.name,
                    totalRoles,
                    roleCount: roles.length,
                    pagination: {
                        limit,
                        nextCursor,
                        previousCursor,
                        hasNextPage: hasMorePages,
                        hasPreviousPage: !!before
                    },
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

    // Validate guild ID
    const guildValidation = validateSnowflake(guildId);
    if (!guildValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid guild ID: ${guildValidation.error}` }],
            isError: true
        };
    }

    // Sanitize role name
    const nameSanitized = sanitizeRoleName(name);
    if (nameSanitized.error) {
        return {
            content: [{ type: "text", text: `Invalid role name: ${nameSanitized.error}` }],
            isError: true
        };
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);

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
            name: nameSanitized.sanitized,
            color: roleColor,
            hoist,
            mentionable,
            permissions: rolePermissions,
            reason: reasonSanitized.sanitized
        });

        // Invalidate roles cache for this guild
        const cache = getCache();
        cache.delete('roles', `${guildId}:all`);

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

    // Validate IDs
    const guildValidation = validateSnowflake(guildId);
    if (!guildValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid guild ID: ${guildValidation.error}` }],
            isError: true
        };
    }

    const roleValidation = validateSnowflake(roleId);
    if (!roleValidation.valid) {
        return {
            content: [{ type: "text", text: `Invalid role ID: ${roleValidation.error}` }],
            isError: true
        };
    }

    // Sanitize name if provided
    let nameSanitized = null;
    if (name !== undefined) {
        nameSanitized = sanitizeRoleName(name);
        if (nameSanitized.error) {
            return {
                content: [{ type: "text", text: `Invalid role name: ${nameSanitized.error}` }],
                isError: true
            };
        }
    }

    // Sanitize reason
    const reasonSanitized = sanitizeReason(reason);

    try {
        requireClientReady(context);

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
        if (nameSanitized) updateData.name = nameSanitized.sanitized;
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
        if (reasonSanitized.sanitized) updateData.reason = reasonSanitized.sanitized;

        await role.edit(updateData);

        // Handle position separately if specified
        if (position !== undefined) {
            await role.setPosition(position);
        }

        // Invalidate roles cache for this guild
        const cache = getCache();
        cache.delete('roles', `${guildId}:all`);

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
        requireClientReady(context);

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

        // Invalidate roles cache for this guild
        const cache = getCache();
        cache.delete('roles', `${guildId}:all`);

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

        // Invalidate member cache since roles changed
        const cache = getCache();
        cache.delete('members', `${guildId}:${userId}`);

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

        // Invalidate member cache since roles changed
        const cache = getCache();
        cache.delete('members', `${guildId}:${userId}`);

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

        // Invalidate channel cache since permissions changed
        const cache = getCache();
        cache.delete('channels', channelId);

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

        const overwrite = channel.permissionOverwrites.cache.get(targetId);
        if (!overwrite) {
            return {
                content: [{ type: "text", text: `No permission overwrite found for target ID: ${targetId}` }],
                isError: true
            };
        }

        await channel.permissionOverwrites.delete(targetId, reason);

        // Invalidate channel cache since permissions changed
        const cache = getCache();
        cache.delete('channels', channelId);

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
