import { query } from './_generated/server';
import { Infer, v } from 'convex/values';

const usersSchema = v.object({
  _id: v.id('users'),
  email: v.string(),
});

export type User = Infer<typeof usersSchema>;

export const getUser = query({
  args: { id: v.id('users') },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});
