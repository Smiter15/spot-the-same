import { query, mutation } from './_generated/server';
import { Infer, v } from 'convex/values';

import { deal, shuffle } from '../src/utils/game';

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
export const createGame = mutation({
    args: { noExpectedPlayers: v.number(), email: v.string() },
    handler: async (ctx, { noExpectedPlayers, email }) => {
        const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), email))
            .first();

        const userId = user ? user._id : await ctx.db.insert('users', { email });

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

        // Update current game to point to nextGameId
        await ctx.db.patch(gameId, { nextGameId });

        // Initialise the next game state
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

        // Assign cards to players in next game
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

export const votePlayAgain = mutation({
    args: { gameId: v.id('games'), noVotes: v.number() },
    handler: async (ctx, { gameId, noVotes }) => {
        await ctx.db.patch(gameId, { noPlayAgainPlayers: noVotes + 1 });
    },
});

export const joinGame = mutation({
    args: { gameId: v.id('games'), email: v.string() },
    handler: async (ctx, { gameId, email }) => {
        const user = await ctx.db
            .query('users')
            .filter((q) => q.eq(q.field('email'), email))
            .first();

        const userId = user ? user._id : await ctx.db.insert('users', { email });

        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        if (!game.players.includes(userId)) {
            await ctx.db.patch(gameId, { players: [...game.players, userId] });
        }

        return { userId };
    },
});

export const startGame = mutation({
    args: { gameId: v.id('games') },
    handler: async (ctx, { gameId }) => {
        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

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

        // If someone else already advanced the turn, this guess was too slow
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
            // finished game
            await ctx.db.patch(gameId, {
                activeCard: card,
                turn: game.turn + 1,
                finished: true,
                winner: userId,
            });
        } else {
            // advance to next round
            await ctx.db.patch(gameId, {
                activeCard: shuffle(card),
                turn: game.turn + 1,
            });
        }

        return { tooSlow: false };
    },
});

export const deleteGame = mutation({
    args: { gameId: v.id('games') },
    handler: async (ctx, { gameId }) => {
        const game = await ctx.db.get(gameId);
        if (game) {
            await ctx.db.delete(gameId);
        }
    },
});
