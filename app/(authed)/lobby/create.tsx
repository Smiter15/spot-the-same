import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';
import { api } from '../../../convex/_generated/api';

const isPrime = (x: number) => {
    if (x < 2) return false;
    for (let i = 2; i * i <= x; i++) if (x % i === 0) return false;
    return true;
};

/** Dobble deck properties (n = deckSize - 1) */
const deckInfo = (n: number) => ({
    cards: n * n + n + 1,
    iconsPerCard: n + 1,
});

const MIN_CARDS_PER_PLAYER = 5;
const WIDTH = 360;

const computeAvailableDeckSizes = (players: number) => {
    const sizes: number[] = [];
    for (let deckSize = 4; deckSize <= 8; deckSize++) {
        const n = deckSize - 1;
        if (!isPrime(n)) continue;
        const { cards } = deckInfo(n);
        // subtract 1 for the centre card you pop before dealing
        const perPlayer = Math.floor((cards - 1) / players);
        if (perPlayer >= MIN_CARDS_PER_PLAYER) sizes.push(deckSize);
    }
    return sizes;
};

export default function Create() {
    const [busy, setBusy] = useState(false);
    const [noExpectedPlayers, setNoExpectedPlayers] = useState(2);
    const [deckSize, setDeckSize] = useState(6);

    const createGameMutation = useMutation(api.games.createGame);

    const availableDeckSizes = useMemo(() => computeAvailableDeckSizes(noExpectedPlayers), [noExpectedPlayers]);

    // keep selected deckSize valid
    useEffect(() => {
        if (!availableDeckSizes.includes(deckSize) && availableDeckSizes.length) {
            setDeckSize(availableDeckSizes[0]);
        }
    }, [availableDeckSizes, deckSize]);

    const summary = useMemo(() => {
        const n = deckSize - 1;
        const { cards, iconsPerCard } = deckInfo(n);
        const perPlayer = Math.floor((cards - 1) / noExpectedPlayers);
        return { cards, iconsPerCard, perPlayer };
    }, [deckSize, noExpectedPlayers]);

    const onCreate = async () => {
        try {
            setBusy(true);
            const { gameId, userId } = await createGameMutation({
                noExpectedPlayers,
                deckSize,
            });
            router.push({
                pathname: `/game/${gameId}`,
                params: { userId: String(userId) },
            });
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not create game. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const noDecks = availableDeckSizes.length === 0;

    return (
        <KeyboardAvoidingView style={styles.screen} behavior="padding">
            <StatusBar style="dark" />

            <Text style={styles.title}>Create Game</Text>
            <Text style={styles.subtitle}>Choose players and deck size</Text>

            {/* Players selector */}
            <View style={styles.section}>
                <Text style={styles.label}>Players</Text>
                <View style={styles.pillsWrap}>
                    {[2, 3, 4, 5, 6, 7, 8].map((p) => {
                        const active = noExpectedPlayers === p;
                        return (
                            <Pressable
                                key={p}
                                style={[styles.pill, active && styles.pillActive]}
                                onPress={() => setNoExpectedPlayers(p)}
                                disabled={busy}
                            >
                                <Text style={[styles.pillText, active && styles.pillTextActive]}>{p}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* Deck size selector */}
            <View style={styles.section}>
                <Text style={styles.label}>Deck Size</Text>

                {noDecks ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>No valid decks</Text>
                        <Text style={styles.emptyText}>
                            Try fewer players or gather more icons. Each player should get at least{' '}
                            {MIN_CARDS_PER_PLAYER} cards.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.pillsWrap}>
                        {availableDeckSizes.map((size) => {
                            const active = deckSize === size;
                            return (
                                <Pressable
                                    key={size}
                                    style={[styles.pill, active && styles.pillActive]}
                                    onPress={() => setDeckSize(size)}
                                    disabled={busy}
                                >
                                    <Text style={[styles.pillText, active && styles.pillTextActive]}>{size}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Live summary */}
            {!noDecks && (
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryLine}>
                        Icons per card: <Text style={styles.summaryStrong}>{summary.iconsPerCard}</Text>
                    </Text>
                    <Text style={styles.summaryLine}>
                        Total cards in deck: <Text style={styles.summaryStrong}>{summary.cards}</Text>
                    </Text>
                    <Text style={styles.summaryLine}>
                        ≈ Cards per player: <Text style={styles.summaryStrong}>{summary.perPlayer}</Text>
                    </Text>
                </View>
            )}

            {/* Create CTA */}
            <Pressable
                style={[styles.primary, (busy || noDecks) && styles.primaryDisabled]}
                onPress={onCreate}
                disabled={busy || noDecks}
            >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Create</Text>}
            </Pressable>

            {/* Footer */}
            <Pressable
                onPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace('/(authed)/lobby');
                }}
                disabled={busy}
                style={styles.backLink}
            >
                <Text style={styles.backText}>← Back</Text>
            </Pressable>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F6F8FB',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingTop: 60,
    },
    title: { fontSize: 32, fontWeight: '900', color: '#0B1220' },
    subtitle: { marginTop: 6, fontSize: 15, color: '#5D6B88' },

    section: { width: '100%', maxWidth: WIDTH, marginTop: 22 },
    label: { fontSize: 16, fontWeight: '800', color: '#0B1220', marginBottom: 10 },

    pillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    pill: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 999,
        backgroundColor: '#EEF3FA',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    pillActive: { backgroundColor: '#2F80ED', borderColor: '#2F80ED' },
    pillText: { fontSize: 16, fontWeight: '700', color: '#0B1220' },
    pillTextActive: { color: '#FFFFFF' },

    summaryCard: {
        width: '100%',
        maxWidth: WIDTH,
        marginTop: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 14,
    },
    summaryLine: { fontSize: 14, color: '#1E2A44', marginBottom: 4 },
    summaryStrong: { fontWeight: '800', color: '#0B1220' },

    emptyCard: {
        width: '100%',
        maxWidth: WIDTH,
        backgroundColor: '#FFF8E6',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F7D48A',
        padding: 14,
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: '#6A4A00' },
    emptyText: { marginTop: 6, fontSize: 13, color: '#6A4A00' },

    primary: {
        marginTop: 20,
        width: '100%',
        maxWidth: WIDTH,
        height: 58,
        backgroundColor: '#2F80ED',
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2F80ED',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 },
    },
    primaryDisabled: { opacity: 0.6 },
    primaryText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

    backLink: { marginTop: 32, marginBottom: 24 },
    backText: { color: '#2F80ED', fontSize: 15, fontWeight: '700' },
});
