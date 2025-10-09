import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useUser } from '@clerk/clerk-expo';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Game } from '../../convex/games';

type Props = {
    game: Game;
    userId: Id<'users'>;
};

type Row = {
    playerId: Id<'users'>;
    name: string;
    email?: string;
    avatarUrl?: string;
    points: number;
    mistakes: number;
    fastestMs: number | null;
    slowestMs: number | null;
};

// ---------- helpers ----------
const ordinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const ms = (x?: number | null) => (x == null ? '—' : `${(x / 1000).toFixed(2)}s`);

const titleCase = (s?: string) =>
    (s ?? '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
        .join(' ') || 'Player';

const initials = (nameOrEmail?: string) => {
    if (!nameOrEmail) return 'P';
    const src = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
    const parts = src.replace(/\W+/g, ' ').trim().split(' ');
    const a = parts[0]?.[0] ?? 'P';
    const b = parts[1]?.[0] ?? '';
    return (a + b).toUpperCase();
};

const colorForId = (id: string) => {
    const hues = [22, 200, 140, 265, 5, 310, 180, 45];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return `hsl(${hues[hash % hues.length]} 70% 88%)`;
};

// ========================================

export default function FinishedGame({ game, userId }: Props) {
    const router = useRouter();
    const { user: clerkUser } = useUser(); // current user's Clerk record

    // live game for votes / redirect
    const latestGame = useQuery(api.games.getGame, { id: game._id });

    // turns telemetry
    const turns = useQuery(api.turns.getTurnsByGame, { gameId: game._id }) ?? [];

    // batch user lookup (names/emails/avatars) — order matches game.players
    const users = useQuery(api.users.getUsersByIds, { ids: game.players }) ?? [];

    const votePlayAgain = useMutation(api.games.votePlayAgain);
    const playAgain = useMutation(api.games.playAgain);

    const [hasVoted, setHasVoted] = useState(false);

    useEffect(() => {
        if (latestGame?.nextGameId) {
            router.replace(`/game/${latestGame.nextGameId}?userId=${userId}`);
        }
    }, [latestGame?.nextGameId, router, userId]);

    const handlePlayAgain = async () => {
        if (hasVoted) return;
        setHasVoted(true);

        await votePlayAgain({ gameId: game._id, noVotes: game.noPlayAgainPlayers });

        const votesNow = (latestGame?.noPlayAgainPlayers ?? game.noPlayAgainPlayers) + 1;
        if (votesNow === game.noExpectedPlayers) {
            await playAgain({
                gameId: game._id,
                players: game.players,
                noExpectedPlayers: game.noExpectedPlayers,
            });
        }
    };

    const handleLeave = () => {
        router.replace('/(authed)/lobby');
    };

    // Build leaderboard + stats from turns
    const rows: Row[] = useMemo(() => {
        const base: Record<string, Row> = {};
        game.players.forEach((pid, idx) => {
            const u = users[idx]; // order preserved
            const rawName = u?.username || (u?.email ? u.email.split('@')[0] : `Player ${String(pid).slice(-4)}`);
            base[pid as string] = {
                playerId: pid as Id<'users'>,
                name: titleCase(rawName),
                email: u?.email ?? undefined,
                avatarUrl: u?.avatarUrl ?? undefined,
                points: 0,
                mistakes: 0,
                fastestMs: null,
                slowestMs: null,
            };
        });

        for (const t of turns) {
            const key = t.playerId as string;
            const r = base[key];
            if (!r) continue;

            if (t.outcome === 'correct') {
                r.points += 1;
                if (typeof t.reactionMs === 'number') {
                    r.fastestMs = r.fastestMs == null ? t.reactionMs : Math.min(r.fastestMs, t.reactionMs);
                    r.slowestMs = r.slowestMs == null ? t.reactionMs : Math.max(r.slowestMs, t.reactionMs);
                }
            } else if (t.outcome === 'wrong') {
                r.mistakes += 1;
            }
        }

        return Object.values(base).sort((a, b) => b.points - a.points);
    }, [game.players, turns, users]);

    const winner = rows[0];
    const votesSoFar = latestGame?.noPlayAgainPlayers ?? game.noPlayAgainPlayers;

    const winnerIsCurrentUser = game.winner === userId;
    const winnerLabel = game.winner == null ? 'Nobody' : winnerIsCurrentUser ? 'You' : (winner?.name ?? 'Winner');

    // Convex avatar for winner (if present), else Clerk avatar for current user (fallback), else initials
    const winnerIdx = game.players.findIndex((p) => p === game.winner);
    const winnerConvexAvatarUrl = winnerIdx >= 0 ? users[winnerIdx]?.avatarUrl : undefined;
    const currentUserAvatarUrl = clerkUser?.hasImage ? clerkUser.imageUrl : undefined;
    const showWinnerClerkFallback = winnerIsCurrentUser && currentUserAvatarUrl && !winnerConvexAvatarUrl;

    return (
        <View style={styles.screen}>
            <Text style={styles.header}>Game Over</Text>

            {/* Winner badge */}
            <View style={styles.winnerWrap}>
                {winnerConvexAvatarUrl ? (
                    <View style={[styles.avatarBig, { borderColor: '#FFC64D' }]}>
                        <Image source={{ uri: winnerConvexAvatarUrl }} style={styles.avatarBigImg} />
                    </View>
                ) : showWinnerClerkFallback ? (
                    <View style={[styles.avatarBig, { borderColor: '#FFC64D' }]}>
                        <Image source={{ uri: currentUserAvatarUrl }} style={styles.avatarBigImg} />
                    </View>
                ) : (
                    <View
                        style={[
                            styles.avatarBig,
                            { backgroundColor: colorForId((game.winner ?? 'x') as string), borderColor: '#FFC64D' },
                        ]}
                    >
                        <Text style={styles.avatarBigText}>
                            {winner?.name ? initials(winner.name || winner.email) : 'WIN'}
                        </Text>
                    </View>
                )}

                <View style={styles.trophyBadge}>
                    <Text style={styles.trophyText}>🏆</Text>
                </View>
            </View>

            <Text style={styles.winnerTitle}>{winnerLabel} won!</Text>

            {/* Full-width grey leaderboard */}
            <FlatList
                style={styles.list}
                data={rows}
                keyExtractor={(r) => r.playerId}
                renderItem={({ item, index }) => {
                    const isCurrent = item.playerId === userId;
                    const showClerkFallback = isCurrent && currentUserAvatarUrl && !item.avatarUrl;

                    return (
                        <View style={styles.row}>
                            <Text style={styles.ordinal}>{ordinal(index + 1)}</Text>

                            {/* Avatar priority: Convex avatar → Clerk (current user) → initials */}
                            {item.avatarUrl ? (
                                <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                            ) : showClerkFallback ? (
                                <Image source={{ uri: currentUserAvatarUrl }} style={styles.avatarImg} />
                            ) : (
                                <View style={[styles.avatarSm, { backgroundColor: colorForId(item.playerId) }]}>
                                    <Text style={styles.avatarSmText}>{initials(item.name || item.email)}</Text>
                                </View>
                            )}

                            <View style={styles.rowMain}>
                                <Text style={styles.name}>{titleCase(item.name)}</Text>
                                <Text style={styles.points}>
                                    {item.points} {item.points === 1 ? 'point' : 'points'}
                                </Text>
                                <Text style={styles.meta}>
                                    Fastest {ms(item.fastestMs)}
                                    {'\n'}
                                    Slowest {ms(item.slowestMs)}
                                    {'\n'}
                                    {item.mistakes} mistake{item.mistakes === 1 ? '' : 's'}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                contentContainerStyle={{ paddingBottom: 16 }}
            />

            {/* CTAs */}
            {!latestGame?.nextGameId ? (
                <>
                    <Pressable
                        style={[styles.cta, hasVoted && styles.ctaDisabled]}
                        onPress={handlePlayAgain}
                        disabled={hasVoted}
                    >
                        <Text style={styles.ctaText}>
                            Play Again ({votesSoFar}/{game.noExpectedPlayers})
                        </Text>
                    </Pressable>
                    <Pressable style={styles.ctaSecondary} onPress={handleLeave}>
                        <Text style={[styles.ctaText, styles.ctaSecondaryText]}>Leave</Text>
                    </Pressable>
                </>
            ) : (
                <Text style={styles.waiting}>Starting new game…</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, paddingVertical: 60, paddingHorizontal: 20, width: '100%' },
    header: { fontSize: 24, fontWeight: '800', color: '#0B1220', textAlign: 'center' },

    winnerWrap: { alignItems: 'center', marginTop: 8, marginBottom: 8 },
    avatarBig: {
        width: 120,
        height: 120,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        overflow: 'hidden', // to clip Image nicely
    },
    avatarBigImg: { width: '100%', height: '100%' },
    avatarBigText: { fontSize: 22, fontWeight: '800', color: '#0B1220' },
    trophyBadge: {
        position: 'absolute',
        right: '35%',
        bottom: -6,
        backgroundColor: '#FFC64D',
        width: 40,
        height: 40,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    trophyText: { fontSize: 22 },
    winnerTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#0B1220',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 16,
    },

    list: { marginTop: 4 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EDEFF4', // full-width grey
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 16,
    },
    ordinal: { width: 48, fontSize: 18, fontWeight: '800', color: '#5D6B88' },

    avatarImg: { width: 44, height: 44, borderRadius: 999, marginRight: 10, borderWidth: 2, borderColor: '#FFF' },
    avatarSm: {
        width: 44,
        height: 44,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    avatarSmText: { fontSize: 16, fontWeight: '800', color: '#0B1220' },

    rowMain: { flex: 1 },
    name: { fontSize: 17, fontWeight: '800', color: '#0B1220' },
    points: { fontSize: 14, color: '#1E2A44', marginTop: 2 },
    meta: { fontSize: 12, color: '#5D6B88', marginTop: 2 },

    cta: {
        marginTop: 24,
        width: '100%',
        backgroundColor: '#2F80ED',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaDisabled: { opacity: 0.6 },
    ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
    ctaSecondary: {
        marginTop: 12,
        width: '100%',
        backgroundColor: '#E4F0FF',
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaSecondaryText: { color: '#2F80ED' },
    waiting: { marginTop: 16, fontSize: 16, color: '#5D6B88', textAlign: 'center' },
});
