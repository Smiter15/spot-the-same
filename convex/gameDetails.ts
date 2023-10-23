import { query } from './_generated/server';
import { Infer, v } from 'convex/values';

const gameDetailsScehma = v.object({
  _id: v.id('game_details'),
  gameId: v.id('games'),
  playerId: v.id('players'),
  cards: v.array(v.number()),
  score: v.number(),
});

export type GameDetails = Infer<typeof gameDetailsScehma>;

export const getGameDetails = query({
  args: { gameId: v.id('games'), playerId: v.id('players') },
  handler: async (ctx, { gameId, playerId }) => {
    return await ctx.db
      .query('game_details')
      .filter((q) =>
        q.and(
          q.eq(q.field('gameId'), gameId),
          q.eq(q.field('playerId'), playerId)
        )
      )
      .first();
  },
});

export const getPlayerCards = query({
  args: { gameId: v.id('games'), playerId: v.id('players') },
  handler: async (ctx, { gameId, playerId }) => {
    const details = await ctx.db
      .query('game_details')
      .filter((q) =>
        q.and(
          q.eq(q.field('gameId'), gameId),
          q.eq(q.field('playerId'), playerId)
        )
      )
      .first();

    return details && details.cards.length > 0 ? details.cards : [];
  },
});
