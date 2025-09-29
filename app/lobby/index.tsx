import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { StyleSheet, Text, TextInput, KeyboardAvoidingView, Pressable, Alert } from 'react-native';
import { useMutation } from 'convex/react';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

export default function Lobby() {
    const { user } = useUser();
    const { signOut } = useAuth();

    const [joinGameId, setJoinGameId] = useState('');

    const createGameMutation = useMutation(api.games.createGame);
    const joinGameMutation = useMutation(api.games.joinGame);

    const createGame = async () => {
        try {
            const { gameId, userId } = await createGameMutation({
                noExpectedPlayers: 2,
                email: user?.primaryEmailAddress?.emailAddress ?? '',
            });

            router.push({
                pathname: `/game/${gameId}`,
                params: { userId: String(userId) },
            });
        } catch (err) {
            Alert.alert('Error', 'Could not create game. Please try again.');
        }
    };

    const joinGame = async () => {
        if (!joinGameId) {
            Alert.alert('You must input a game ID to join a game');
            return;
        }

        try {
            const { userId } = await joinGameMutation({
                email: user?.primaryEmailAddress?.emailAddress ?? '',
                gameId: joinGameId as Id<'games'>,
            });

            router.push({
                pathname: `/game/${joinGameId}`,
                params: { userId: String(userId) },
            });
        } catch (err) {
            Alert.alert('Error', 'Could not join game. Please check the ID and try again.');
        }
    };

    const signout = async () => {
        await signOut();
        router.replace('/');
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
            />

            <Pressable style={styles.button} onPress={createGame}>
                <Text style={styles.text}>Create Game</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={joinGame}>
                <Text style={styles.text}>Join Game</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={signout}>
                <Text style={styles.text}>Sign Out</Text>
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
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 0.25,
        color: 'white',
    },
});
