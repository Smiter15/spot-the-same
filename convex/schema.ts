import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    users: defineTable({
        email: v.string(),
        username: v.optional(v.string()),
        clerkId: v.optional(v.string()),
    }),

    games: defineTable({
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
    }),

    game_details: defineTable({
        gameId: v.id('games'),
        userId: v.union(v.id('users'), v.null()),
        cards: v.array(v.array(v.number())),
        score: v.number(),
    }),
});
