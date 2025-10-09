import { query, mutation } from './_generated/server';
import { Infer, v } from 'convex/values';

// ---------------- Schema mirror (for typing only) ----------------
const usersSchema = v.object({
    _id: v.id('users'),
    email: v.string(),
    username: v.optional(v.string()),
    clerkId: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
});
export type User = Infer<typeof usersSchema>;

// ---------------- Queries ----------------

/** Get a single user by ID. */
export const getUser = query({
    args: { id: v.id('users') },
    handler: async (ctx, { id }) => (await ctx.db.get(id)) ?? null,
});

/** Get many users in one call (order preserved). */
export const getUsersByIds = query({
    args: { ids: v.array(v.id('users')) },
    handler: async (ctx, { ids }) => {
        const users = await Promise.all(ids.map((id) => ctx.db.get(id)));
        return users.map((u) => u ?? null);
    },
});

/** Get a user by Clerk ID. */
export const getUserByClerkId = query({
    args: { clerkId: v.string() },
    handler: async (ctx, { clerkId }) => {
        return await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('clerkId'), clerkId))
            .first();
    },
});

// ---------------- Mutations ----------------

/** Upsert the current Clerk user into Convex (sync name + avatar). */
export const syncFromClerk = mutation({
    args: {
        username: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    handler: async (ctx, { username, avatarUrl }) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error('Not authenticated');

        const clerkId = identity.subject;
        const email = identity.email!;
        const serverName = identity.nickname || identity.name || 'Player';
        // some Clerk adapters use pictureUrl, some imageUrl; handle both cautiously
        const serverAvatar = (identity as any)?.pictureUrl || (identity as any)?.imageUrl || undefined;

        const name = username ?? serverName;
        const photo = avatarUrl ?? serverAvatar;

        const existing = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('clerkId'), clerkId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                email,
                username: name,
                ...(photo ? { avatarUrl: photo } : {}),
            });
            return existing._id;
        }

        const newId = await ctx.db.insert('users', {
            email,
            username: name,
            clerkId,
            ...(photo ? { avatarUrl: photo } : {}),
        });
        return newId;
    },
});
