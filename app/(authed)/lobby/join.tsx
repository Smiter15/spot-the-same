import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import { Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';

import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export default function Join() {
    const [joinGameId, setJoinGameId] = useState('');
    const [loading, setLoading] = useState(false);

    const joinGameMutation = useMutation(api.games.joinGame);

    const joinGame = async () => {
        if (!joinGameId.trim()) {
            Alert.alert('Missing ID', 'Please enter a game code.');
            return;
        }

        try {
            setLoading(true);
            const { userId } = await joinGameMutation({ gameId: joinGameId as Id<'games'> });
            router.push({
                pathname: `/game/${joinGameId}`,
                params: { userId: String(userId) },
            });
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Could not join the game. Check the code and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <StatusBar style="auto" />
            <Text style={styles.title}>Join Game</Text>

            <TextInput
                value={joinGameId}
                onChangeText={setJoinGameId}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="Enter Game ID..."
                placeholderTextColor="#888"
                style={styles.input}
                editable={!loading}
            />

            <Pressable style={[styles.button, loading && styles.disabled]} onPress={joinGame} disabled={loading}>
                {loading ? <ActivityIndicator color="white" /> : <Text style={styles.text}>Join</Text>}
            </Pressable>

            <Pressable onPress={() => router.back()}>
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
    input: {
        width: '80%',
        height: 44,
        padding: 10,
        borderRadius: 6,
        backgroundColor: '#e8e8e8',
        marginBottom: 20,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
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
