import { MutationCtx, QueryCtx } from './_generated/server';

/**
 * Gets the currently authenticated user's Convex user ID.
 * Throws an error if not logged in or if the user doesn’t exist.
 */
export async function getCurrentUserId(ctx: MutationCtx | QueryCtx) {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity?.email) {
        throw new Error('Not signed in');
    }

    const user = await ctx.db
        .query('users')
        .filter((q) => q.eq(q.field('email'), identity.email))
        .first();

    // Don’t create the user — redirect or fail instead
    if (!user) {
        throw new Error('User not registered. Please sign up first.');
    }

    return user._id;
}
