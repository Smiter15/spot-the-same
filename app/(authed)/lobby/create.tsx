import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';

import { api } from '../../../convex/_generated/api';

/**
 * Compute Dobble deck properties
 * n = order (deckSize - 1)
 */
const deckInfo = (n: number) => ({
    cards: n * n + n + 1,
    iconsPerCard: n + 1,
});

export default function Create() {
    const [loading, setLoading] = useState(false);
    const [noExpectedPlayers, setNoExpectedPlayers] = useState(2);
    const [deckSize, setDeckSize] = useState(6);

    const createGameMutation = useMutation(api.games.createGame);

    // Derived list of valid deck sizes based on player count
    const availableDeckSizes = useMemo(() => {
        return [4, 5, 6, 7, 8].filter((size) => {
            const n = size - 1;
            const { cards } = deckInfo(n);
            const cardsPerPlayer = Math.floor(cards / noExpectedPlayers);
            return cardsPerPlayer >= 5; // ensure enough cards per player
        });
    }, [noExpectedPlayers]);

    // Ensure selected deckSize always valid
    useMemo(() => {
        if (!availableDeckSizes.includes(deckSize)) {
            setDeckSize(availableDeckSizes[0]);
        }
    }, [availableDeckSizes]);

    const createGame = async () => {
        try {
            setLoading(true);
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
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <StatusBar style="auto" />
            <Text style={styles.title}>Create Game</Text>

            <Text style={styles.label}>Players</Text>
            <View style={styles.options}>
                {[2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <Pressable
                        key={p}
                        style={[styles.optionButton, noExpectedPlayers === p && styles.active]}
                        onPress={() => setNoExpectedPlayers(p)}
                    >
                        <Text style={[styles.optionText, noExpectedPlayers === p && styles.activeText]}>{p}</Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Deck Size</Text>
            <View style={styles.options}>
                {availableDeckSizes.map((size) => (
                    <Pressable
                        key={size}
                        style={[styles.optionButton, deckSize === size && styles.active]}
                        onPress={() => setDeckSize(size)}
                    >
                        <Text style={[styles.optionText, deckSize === size && styles.activeText]}>{size}</Text>
                    </Pressable>
                ))}
            </View>

            <Pressable style={[styles.button, loading && styles.disabled]} onPress={createGame} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.text}>Create</Text>}
            </Pressable>

            <Pressable
                onPress={() => {
                    if (router.canGoBack()) router.back();
                    else router.replace('/(authed)/lobby');
                }}
            >
                <Text style={styles.link}>← Back</Text>
            </Pressable>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
    },
    optionButton: {
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
    },
    optionText: {
        fontSize: 16,
        color: '#000',
    },
    active: {
        backgroundColor: 'black',
    },
    activeText: {
        color: 'white',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        paddingVertical: 14,
        paddingHorizontal: 42,
        borderRadius: 6,
        backgroundColor: 'black',
    },
    disabled: {
        backgroundColor: '#666',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    link: {
        marginTop: 20,
        color: '#007AFF',
        textAlign: 'center',
    },
});
