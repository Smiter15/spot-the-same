import { query } from './_generated/server';
import { Infer, v } from 'convex/values';

const playersSchema = v.object({
  _id: v.id('players'),
  username: v.string(),
});

export type Player = Infer<typeof playersSchema>;

export const getPlayer = query({
  args: { id: v.id('players') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
