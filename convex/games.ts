import { query, mutation } from './_generated/server';
import { Infer, v } from 'convex/values';
import { deal, shuffle } from '../src/utils/game';
import { getCurrentUserId } from './utils';

// ---------------- Schema ----------------
const gamesSchema = v.object({
    _id: v.id('games'),
    noExpectedPlayers: v.number(),
    activeCard: v.array(v.number()),
    players: v.array(v.id('users')),
    started: v.boolean(),
    turn: v.number(),
    finished: v.boolean(),
    winner: v.union(v.id('users'), v.null()),
    noPlayAgainPlayers: v.number(),
    nextGameId: v.union(v.id('games'), v.null()),
});

export type Game = Infer<typeof gamesSchema>;

// ---------------- Queries ----------------
export const getGame = query({
    args: { id: v.id('games') },
    handler: async (ctx, { id }) => {
        return await ctx.db.get(id);
    },
});

// ---------------- Mutations ----------------

/**
 * Create a new game for the current logged-in user.
 */
export const createGame = mutation({
    args: { noExpectedPlayers: v.number() },
    handler: async (ctx, { noExpectedPlayers }) => {
        const userId = await getCurrentUserId(ctx);

        const { activeCard, dealtCards } = deal(noExpectedPlayers);

        const gameId = await ctx.db.insert('games', {
            players: [userId],
            noExpectedPlayers,
            activeCard,
            started: false,
            turn: 0,
            finished: false,
            winner: null,
            noPlayAgainPlayers: 0,
            nextGameId: null,
        });

        for (const cards of dealtCards) {
            await ctx.db.insert('game_details', {
                gameId,
                userId: null,
                cards,
                score: 0,
            });
        }

        return { gameId, userId };
    },
});

/**
 * Join an existing game. Requires user to already exist.
 */
export const joinGame = mutation({
    args: { gameId: v.id('games') },
    handler: async (ctx, { gameId }) => {
        const userId = await getCurrentUserId(ctx);

        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        if (!game.players.includes(userId)) {
            await ctx.db.patch(gameId, {
                players: [...game.players, userId],
            });
        }

        return { userId };
    },
});

/**
 * Create a follow-up game when players vote to play again.
 */
export const playAgain = mutation({
    args: {
        gameId: v.id('games'),
        players: v.array(v.id('users')),
        noExpectedPlayers: v.number(),
    },
    handler: async (ctx, { gameId, players, noExpectedPlayers }) => {
        const { activeCard, dealtCards } = deal(noExpectedPlayers);

        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        let nextGameId = game.nextGameId;
        if (!nextGameId) {
            nextGameId = await ctx.db.insert('games', {
                players: [],
                noExpectedPlayers,
                activeCard: [],
                started: false,
                turn: 0,
                finished: false,
                winner: null,
                noPlayAgainPlayers: 0,
                nextGameId: null,
            });
        }

        // Link the games
        await ctx.db.patch(gameId, { nextGameId });

        // Initialise the new game
        await ctx.db.patch(nextGameId, {
            players,
            noExpectedPlayers,
            activeCard,
            started: true,
            turn: 1,
            finished: false,
            winner: null,
            noPlayAgainPlayers: 0,
        });

        // Assign cards for each player
        for (const [index, userId] of players.entries()) {
            await ctx.db.insert('game_details', {
                gameId: nextGameId,
                userId,
                cards: dealtCards[index],
                score: 0,
            });
        }

        return { nextGameId };
    },
});

/**
 * Increment vote count for replaying a game.
 */
export const votePlayAgain = mutation({
    args: { gameId: v.id('games'), noVotes: v.number() },
    handler: async (ctx, { gameId, noVotes }) => {
        await ctx.db.patch(gameId, { noPlayAgainPlayers: noVotes + 1 });
    },
});

/**
 * Start a game when all players are ready.
 */
export const startGame = mutation({
    args: { gameId: v.id('games') },
    handler: async (ctx, { gameId }) => {
        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        // Assign player IDs to existing game_details records
        for (const userId of game.players) {
            const gameDetails = await ctx.db
                .query('game_details')
                .filter((q) => q.and(q.eq(q.field('gameId'), gameId), q.eq(q.field('userId'), null)))
                .first();

            if (gameDetails) {
                await ctx.db.patch(gameDetails._id, { userId });
            }
        }

        await ctx.db.patch(gameId, { started: true, turn: 1 });
    },
});

/**
 * Process a player turn (atomic, OCC-safe).
 */
export const takeTurn = mutation({
    args: {
        gameId: v.id('games'),
        userId: v.id('users'),
        card: v.array(v.number()),
        turn: v.number(),
    },
    handler: async (ctx, { gameId, userId, card, turn }) => {
        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        // Too slow if someone already advanced the turn
        if (turn !== game.turn) {
            return { tooSlow: true };
        }

        const details = await ctx.db
            .query('game_details')
            .filter((q) => q.and(q.eq(q.field('gameId'), gameId), q.eq(q.field('userId'), userId)))
            .first();

        if (!details) throw new Error('Player details not found');

        const updatedCards = [...details.cards];
        updatedCards.shift();

        await ctx.db.patch(details._id, {
            cards: updatedCards,
            score: details.score + 1,
        });

        if (updatedCards.length === 0) {
            // Game finished
            await ctx.db.patch(gameId, {
                activeCard: card,
                turn: game.turn + 1,
                finished: true,
                winner: userId,
            });
        } else {
            // Next round
            await ctx.db.patch(gameId, {
                activeCard: shuffle(card),
                turn: game.turn + 1,
            });
        }

        return { tooSlow: false };
    },
});

/**
 * Delete a game and its associated data.
 */
export const deleteGame = mutation({
    args: { gameId: v.id('games') },
    handler: async (ctx, { gameId }) => {
        const game = await ctx.db.get(gameId);
        if (game) {
            await ctx.db.delete(gameId);
        }
    },
});
