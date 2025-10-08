import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import {
    StyleSheet,
    Text,
    TextInput,
    KeyboardAvoidingView,
    Pressable,
    Alert,
    ActivityIndicator,
    View,
} from 'react-native';
import { useMutation } from 'convex/react';

import { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';

export default function Lobby() {
    const { user } = useUser();

    const [joinGameId, setJoinGameId] = useState('');
    const [loading, setLoading] = useState<'create' | 'join' | null>(null);
    const [deckSize, setDeckSize] = useState(6);

    const createGameMutation = useMutation(api.games.createGame);
    const joinGameMutation = useMutation(api.games.joinGame);

    const createGame = async () => {
        try {
            setLoading('create');
            const { gameId, userId } = await createGameMutation({
                noExpectedPlayers: 2,
                deckSize,
            });

            router.push({
                pathname: `/(authed)/game/${gameId}`,
                params: { userId: String(userId) },
            });
        } catch (err) {
            Alert.alert('Error', 'Could not create game. Please try again.');
        } finally {
            setLoading(null);
        }
    };

    const joinGame = async () => {
        if (!joinGameId) {
            Alert.alert('You must input a game ID to join a game');
            return;
        }

        try {
            setLoading('join');
            const { userId } = await joinGameMutation({ gameId: joinGameId as Id<'games'> });

            router.push({
                pathname: `/(authed)/game/${joinGameId}`,
                params: { userId: String(userId) },
            });
        } catch (err) {
            Alert.alert('Error', 'Could not join game. Please check the ID and try again.');
        } finally {
            setLoading(null);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <StatusBar style="auto" />

            {user && <Text>Logged in as {user?.primaryEmailAddress?.emailAddress}</Text>}

            <TextInput
                value={joinGameId}
                onChangeText={setJoinGameId}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Game ID"
                placeholderTextColor="#888"
                style={styles.input}
                editable={!loading}
            />

            <View style={styles.deckOptions}>
                {[4, 5, 6, 7].map((size) => (
                    <Pressable
                        key={size}
                        style={[styles.deckButton, deckSize === size && styles.deckButtonActive]}
                        onPress={() => setDeckSize(size)}
                    >
                        <Text style={styles.deckText}>{size} Deck</Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                style={[styles.button, loading === 'create' && styles.disabled]}
                onPress={createGame}
                disabled={loading === 'create'}
            >
                {loading === 'create' ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={styles.text}>Create Game</Text>
                )}
            </Pressable>

            <Pressable
                style={[styles.button, (loading === 'join' || !joinGameId) && styles.disabled]}
                onPress={joinGame}
                disabled={loading === 'join' || !joinGameId}
            >
                {loading === 'join' ? <ActivityIndicator color="white" /> : <Text style={styles.text}>Join Game</Text>}
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
    input: {
        width: '80%',
        height: 44,
        padding: 10,
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 6,
        backgroundColor: '#e8e8e8',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 6,
        elevation: 3,
        backgroundColor: 'black',
    },
    disabled: {
        backgroundColor: '#666',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.25,
        color: 'white',
    },
    deckOptions: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    deckButton: { padding: 10, borderWidth: 1, borderColor: '#999', borderRadius: 6 },
    deckButtonActive: { backgroundColor: 'black' },
    deckText: { color: 'black', fontWeight: '600' },
});
