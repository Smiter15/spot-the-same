import { query } from './_generated/server';
import { v } from 'convex/values';

export const getTurnsByGame = query({
    args: { gameId: v.id('games') },
    handler: async (ctx, { gameId }) => {
        const rows = await ctx.db
            .query('turns')
            .filter((q) => q.eq(q.field('gameId'), gameId))
            .collect();

        return rows.sort((a, b) => a.turn - b.turn || a._creationTime - b._creationTime);
    },
});
