import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Pressable, View, Dimensions, Text, Animated } from 'react-native';
import { useQuery } from 'convex/react';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

import Icons from '../../assets/icons';
import { Card } from '../../types';

type PlayerCardsProps = {
    gameId: string;
    userId: string;
    guess: (card: Card, icon: number) => Promise<'red' | 'yellow' | 'green'>;
};

const MAX_WIDTH = Math.min(Dimensions.get('window').width - 40, 360);

export default function PlayerCards({ gameId, userId, guess }: PlayerCardsProps) {
    const cards = useQuery(api.gameDetails.getPlayerCards, {
        gameId: gameId as Id<'games'>,
        userId: userId as Id<'users'>,
    });

    const liveTopCard: Card = cards?.[0] ?? [];

    // NEW: freeze support so green flash is visible
    const [frozen, setFrozen] = useState<{ card: Card; until: number } | null>(null);
    const now = Date.now();
    const showingFrozen = frozen && now < frozen.until;
    const topCard = showingFrozen ? frozen.card : liveTopCard;

    const [disabled, setDisabled] = useState(false);
    const [flashes, setFlashes] = useState<string[]>([]);
    const scales = useRef<Animated.Value[]>([]);
    const lastSig = useRef<string>('');

    const cardSig = useMemo(() => topCard.join(','), [topCard]);

    // init flashes/animations only when displayed card actually changes
    useEffect(() => {
        if (cardSig === lastSig.current) return;
        lastSig.current = cardSig;

        setFlashes(Array(topCard.length).fill('white'));
        scales.current = topCard.map(() => new Animated.Value(1));
    }, [cardSig, topCard.length]);

    // expire freeze automatically
    useEffect(() => {
        if (!frozen) return;
        const ms = Math.max(0, frozen.until - Date.now());
        if (ms <= 0) {
            setFrozen(null);
            return;
        }
        const t = setTimeout(() => setFrozen(null), ms);
        return () => clearTimeout(t);
    }, [frozen]);

    const layout = useMemo(() => {
        const count = topCard.length || 4;
        const cols = count >= 7 ? 4 : count >= 5 ? 3 : Math.max(2, count);
        const cellSize = Math.floor((MAX_WIDTH - (cols - 1) * 10) / cols);
        const iconH = Math.max(44, Math.min(72, Math.round(cellSize * 0.85)));
        return { cols, cellSize, iconH };
    }, [topCard.length]);

    if (!cards || cards.length === 0) {
        return <Text style={styles.empty}>No cards left</Text>;
    }

    const animatePress = (idx: number) => {
        const v = scales.current[idx];
        if (!v) return;
        Animated.sequence([
            Animated.timing(v, { toValue: 0.96, duration: 60, useNativeDriver: true }),
            Animated.timing(v, { toValue: 1, duration: 90, useNativeDriver: true }),
        ]).start();
    };

    const handleGuess = async (card: Card, icon: number, i: number) => {
        if (disabled) return;
        setDisabled(true);

        const result = await guess(card, icon);
        animatePress(i);

        const color = result === 'red' ? '#FFE3E8' : result === 'yellow' ? '#FFF4CC' : '#E6F7E9';

        setFlashes((prev) => {
            const next = Array(topCard.length).fill('white') as string[];
            if (i < next.length) next[i] = color;
            return next;
        });

        // NEW: if correct, freeze the currently shown card for ~180ms
        if (result === 'green') {
            setFrozen({ card: topCard, until: Date.now() + 180 });
        }

        setTimeout(() => {
            setFlashes((prev) => {
                const next = [...prev];
                if (i < next.length) next[i] = 'white';
                return next;
            });
            setDisabled(false);
        }, 120);
    };

    return (
        <View style={{ width: '100%', maxWidth: MAX_WIDTH }}>
            <View style={styles.topRow}>
                <View style={styles.pill}>
                    <Text style={styles.pillText}>Cards left {cards.length}</Text>
                </View>
            </View>

            <View style={[styles.grid, { gap: 10 }]}>
                {topCard.map((icon: number, i: number) => {
                    const Icon = (Icons as Record<string, React.ComponentType<any>>)[`Icon${icon}`];
                    const bg = flashes[i] ?? 'white';

                    return (
                        <Animated.View
                            key={`player-${icon}-${i}-${cardSig}`}
                            style={{ transform: [{ scale: scales.current[i] || new Animated.Value(1) }] }}
                        >
                            <Pressable
                                style={[
                                    styles.cell,
                                    { width: layout.cellSize, height: layout.cellSize, backgroundColor: bg },
                                ]}
                                onPress={() => handleGuess(topCard, icon, i)}
                                disabled={disabled}
                            >
                                {Icon ? (
                                    <Icon width={Math.round(layout.cellSize * 0.82)} height={layout.iconH} />
                                ) : (
                                    <Text style={styles.missing}>?</Text>
                                )}
                            </Pressable>
                        </Animated.View>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    topRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 6,
    },
    pill: {
        backgroundColor: '#EDEFF4',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
    },
    pillText: { fontSize: 13, fontWeight: '800', color: '#0B1220' },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
    cell: {
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    empty: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#888',
    },
    missing: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'red',
    },
});
