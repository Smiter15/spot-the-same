import { query } from './_generated/server';
import { Infer, v } from 'convex/values';

// Define schema for type safety
const gameDetailsSchema = v.object({
    _id: v.id('game_details'),
    gameId: v.id('games'),
    userId: v.id('users'),
    cards: v.array(v.number()),
    score: v.number(),
});

export type GameDetails = Infer<typeof gameDetailsSchema>;

/**
 * Get full game details for a user in a game
 */
export const getGameDetails = query({
    args: { gameId: v.id('games'), userId: v.id('users') },
    handler: async (ctx, { gameId, userId }) => {
        const details = await ctx.db
            .query('game_details')
            .filter((q) => q.and(q.eq(q.field('gameId'), gameId), q.eq(q.field('userId'), userId)))
            .first();

        return details ?? null;
    },
});

/**
 * Get current player's cards
 */
export const getPlayerCards = query({
    args: { gameId: v.id('games'), userId: v.id('users') },
    handler: async (ctx, { gameId, userId }) => {
        const details = await ctx.db
            .query('game_details')
            .filter((q) => q.and(q.eq(q.field('gameId'), gameId), q.eq(q.field('userId'), userId)))
            .first();

        if (!details || !Array.isArray(details.cards)) {
            return [];
        }

        return details.cards;
    },
});
