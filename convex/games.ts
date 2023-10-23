import { query, mutation } from './_generated/server';
import { Infer, v } from 'convex/values';

import { deal, shuffle } from '../app/game/utils';

const gamesSchema = v.object({
  _id: v.id('games'),
  noExpectedPlayers: v.number(),
  activeCard: v.array(v.number()),
  players: v.array(v.id('players')),
  started: v.boolean(),
  turn: v.number(),
  finished: v.boolean(),
  winner: v.id('players'),
});

export type Game = Infer<typeof gamesSchema>;

export const getGame = query({
  args: { id: v.id('games') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const createGame = mutation({
  args: { noExpectedPlayers: v.number(), username: v.string() },
  handler: async (ctx, { noExpectedPlayers, username }) => {
    // the table needs to already exist for this to work
    const player = await ctx.db
      .query('players')
      .filter((q) => q.eq(q.field('username'), username))
      .first();

    const playerId = player
      ? player._id
      : await ctx.db.insert('players', { username });

    const { activeCard, dealtCards } = deal(noExpectedPlayers);

    const gameId = await ctx.db.insert('games', {
      players: [playerId],
      noExpectedPlayers,
      activeCard,
      started: false,
      turn: 0,
      finished: false,
      winner: null,
    });

    dealtCards.forEach(async (deal) => {
      await ctx.db.insert('game_details', {
        gameId,
        playerId: null,
        cards: deal,
        score: 0,
      });
    });

    return { gameId, playerId };
  },
});

// export const playAgain = mutation({
//   args: { noExpectedPlayers: v.number(), players: v.array(v.id('players')) },
//   handler: async (ctx, { noExpectedPlayers, players }) => {
//     const { activeCard, dealtCards } = deal(noExpectedPlayers);

//     const gameId = await ctx.db.insert('games', {
//       players,
//       noExpectedPlayers,
//       activeCard,
//       started: true,
//       turn: 1,
//       finished: false,
//       winner: null,
//     });

//     for (const playerId of players) {
//       const gameDetails = await ctx.db
//         .query('game_details')
//         .filter((q) =>
//           q.and(
//             q.eq(q.field('gameId'), gameId),
//             q.eq(q.field('playerId'), null)
//           )
//         )
//         .first();

//       if (gameDetails) await ctx.db.patch(gameDetails._id, { playerId });
//     }

//     return { gameId };
//   },
// });

export const joinGame = mutation({
  args: { gameId: v.id('games'), username: v.string() },
  handler: async (ctx, { gameId, username }) => {
    // the table needs to already exist for this to work
    const player = await ctx.db
      .query('players')
      .filter((q) => q.eq(q.field('username'), username))
      .first();

    // get player id, if new player save player
    const playerId = player
      ? player._id
      : await ctx.db.insert('players', { username });

    const { players } = await ctx.db.get(gameId);
    // if player not already in game, add player
    if (!players.includes(playerId)) {
      await ctx.db.patch(gameId, { players: [...players, playerId] });
    }

    return { playerId };
  },
});

export const startGame = mutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, { gameId }) => {
    const { players } = await ctx.db.get(gameId);

    for (const playerId of players) {
      const gameDetails = await ctx.db
        .query('game_details')
        .filter((q) =>
          q.and(
            q.eq(q.field('gameId'), gameId),
            q.eq(q.field('playerId'), null)
          )
        )
        .first();

      if (gameDetails) await ctx.db.patch(gameDetails._id, { playerId });
    }

    await ctx.db.patch(gameId, { started: true, turn: 1 });
  },
});

export const takeTurn = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.id('players'),
    card: v.array(v.number()),
    turn: v.number(),
  },
  handler: async (ctx, { gameId, playerId, card, turn }) => {
    const game = await ctx.db.get(gameId);

    if (turn !== game.turn) return { tooSlow: true };

    const {
      _id: gameDetailsId,
      cards,
      score,
    } = await ctx.db
      .query('game_details')
      .filter((q) =>
        q.and(
          q.eq(q.field('gameId'), gameId),
          q.eq(q.field('playerId'), playerId)
        )
      )
      .first();

    cards.shift();
    await ctx.db.patch(gameDetailsId, {
      cards,
      score: score + 1,
    });

    // finished
    if (cards.length === 0) {
      await ctx.db.patch(gameId, {
        activeCard: card,
        turn: game.turn + 1,
        finished: true,
        winner: playerId,
      });
    } else {
      // playing
      await ctx.db.patch(gameId, {
        activeCard: shuffle(card),
        turn: game.turn + 1,
      });
    }

    return { tooSlow: false };
  },
});
