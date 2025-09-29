import { query } from './_generated/server';
import { Infer, v } from 'convex/values';

const usersSchema = v.object({
    _id: v.id('users'),
    email: v.string(),
});

export type User = Infer<typeof usersSchema>;

/**
 * Get a single user by ID.
 * Returns `null` if not found.
 */
export const getUser = query({
    args: { id: v.id('users') },
    handler: async (ctx, { id }) => {
        const user = await ctx.db.get(id);
        return user ?? null;
    },
});
