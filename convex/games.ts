// convex/games.ts
import { query, mutation } from './_generated/server';
import { Infer, v } from 'convex/values';
import { generateDobbleDeck, shuffle } from '../src/utils/game';
import { getCurrentUserId } from './utils';

// ---------------- Schema ----------------
const gamesSchema = v.object({
    _id: v.id('games'),
    noExpectedPlayers: v.number(),
    deckSize: v.number(),
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
    args: { noExpectedPlayers: v.number(), deckSize: v.number() },
    handler: async (ctx, { noExpectedPlayers, deckSize }) => {
        const userId = await getCurrentUserId(ctx);

        const n = deckSize - 1;
        const deck = generateDobbleDeck(n);

        // Deal cards
        const shuffled = shuffle(deck);
        const activeCard = shuffled.shift() ?? [];
        const noOfCardsPerPlayer = Math.floor(shuffled.length / noExpectedPlayers);
        const dealtCards = Array.from({ length: noExpectedPlayers }, () => shuffled.splice(0, noOfCardsPerPlayer));

        const gameId = await ctx.db.insert('games', {
            players: [userId],
            noExpectedPlayers,
            deckSize,
            activeCard,
            started: false,
            turn: 0,
            finished: false,
            winner: null,
            noPlayAgainPlayers: 0,
            nextGameId: null,
        });

        // Insert game_details per player
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
        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        // 🧩 Use the same deck size as the original game (default to 6 if unknown)
        const deckSize = (game as any).deckSize ?? 6;
        const n = deckSize - 1;
        const deck = generateDobbleDeck(n);

        // Deal using the same deck size
        const shuffled = shuffle(deck);
        const activeCard = shuffled.shift() ?? [];
        const noOfCardsPerPlayer = Math.floor(shuffled.length / noExpectedPlayers);
        const dealtCards = Array.from({ length: noExpectedPlayers }, () => shuffled.splice(0, noOfCardsPerPlayer));

        // If nextGame already exists, reuse it
        let nextGameId = game.nextGameId;
        if (!nextGameId) {
            nextGameId = await ctx.db.insert('games', {
                players: [],
                noExpectedPlayers,
                deckSize,
                activeCard,
                started: false,
                turn: 0,
                finished: false,
                winner: null,
                noPlayAgainPlayers: 0,
                nextGameId: null,
            });
        }

        // Link and initialise
        await ctx.db.patch(gameId, { nextGameId });
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

        // Assign cards
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
 * Uses client snapshots to ensure correct telemetry when racing.
 */
export const takeTurn = mutation({
    args: {
        gameId: v.id('games'),
        userId: v.id('users'),
        card: v.array(v.number()),
        turn: v.number(),
        guessedSymbol: v.number(),
        reactionMs: v.number(),
        activeAtGuess: v.array(v.number()),
    },
    handler: async (ctx, { gameId, userId, card, turn, guessedSymbol, reactionMs, activeAtGuess }) => {
        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        // If someone already played this turn, log as tooSlow against what the player saw
        if (turn !== game.turn) {
            await ctx.db.insert('turns', {
                gameId,
                turn,
                playerId: userId,
                guessedSymbol,
                activeCard: activeAtGuess,
                playerTopCard: card,
                reactionMs,
                outcome: 'tooSlow',
            });
            return { tooSlow: true, accepted: false };
        }

        // Proceed: pop player's top card & update score
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

        // Log the winning attempt (use the actual current center card)
        await ctx.db.insert('turns', {
            gameId,
            turn: game.turn,
            playerId: userId,
            guessedSymbol,
            activeCard: game.activeCard,
            playerTopCard: card,
            reactionMs,
            outcome: 'correct',
        });

        if (updatedCards.length === 0) {
            await ctx.db.patch(gameId, {
                activeCard: card,
                turn: game.turn + 1,
                finished: true,
                winner: userId,
            });
        } else {
            await ctx.db.patch(gameId, {
                activeCard: shuffle(card),
                turn: game.turn + 1,
            });
        }

        return { tooSlow: false, accepted: true };
    },
});

/**
 * Log a wrong tap without changing game state.
 * Uses client snapshots to keep telemetry truthful under races.
 */
export const logMistake = mutation({
    args: {
        gameId: v.id('games'),
        userId: v.id('users'),
        guessedSymbol: v.number(),
        playerTopCard: v.array(v.number()),
        reactionMs: v.number(),
        activeAtGuess: v.array(v.number()),
        turnAtGuess: v.number(),
    },
    handler: async (ctx, { gameId, userId, guessedSymbol, playerTopCard, reactionMs, activeAtGuess, turnAtGuess }) => {
        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        await ctx.db.insert('turns', {
            gameId,
            turn: turnAtGuess,
            playerId: userId,
            guessedSymbol,
            activeCard: activeAtGuess,
            playerTopCard,
            reactionMs,
            outcome: 'wrong',
        });
    },
});

export const leaveGame = mutation({
    args: { gameId: v.id('games') },
    handler: async (ctx, { gameId }) => {
        const userId = await getCurrentUserId(ctx);

        const game = await ctx.db.get(gameId);
        if (!game) throw new Error('Game not found');

        // If user isn't in the game, no-op
        if (!game.players.includes(userId)) return { ok: true, started: game.started };

        // Remove from players array
        const remaining = game.players.filter((p) => p !== userId);

        if (!game.started) {
            // Pre-start: free the seat so a future joiner can take it
            const seat = await ctx.db
                .query('game_details')
                .filter((q) => q.and(q.eq(q.field('gameId'), gameId), q.eq(q.field('userId'), userId)))
                .first();
            if (seat) {
                await ctx.db.patch(seat._id, { userId: null });
            }

            await ctx.db.patch(gameId, { players: remaining });
        } else {
            // Mid-game: just remove them; their stack becomes inactive
            await ctx.db.patch(gameId, { players: remaining });
            // Optional: you could log a "left" turn or handle end-game if only one player remains.
        }

        return { ok: true, started: game.started };
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
