import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Alert,
} from 'react-native';
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
    const { gameId, userId } = await createGameMutation({
      noExpectedPlayers: 2, // update
      email: user?.primaryEmailAddress?.emailAddress as string,
    });

    router.push({ pathname: `/game/${gameId}`, params: { userId } });
  };

  const joinGame = async () => {
    if (!joinGameId) {
      Alert.alert('You must input a game ID to join a game');
      return;
    }

    const { userId } = await joinGameMutation({
      email: user?.primaryEmailAddress?.emailAddress as string,
      gameId: joinGameId as Id<'games'>,
    });

    router.push({ pathname: `/game/${joinGameId}`, params: { userId } });
  };

  const signout = async () => {
    await signOut();
    router.replace({ pathname: '/' });
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <StatusBar style="auto" />

      {user && (
        <Text>logged in as {user?.primaryEmailAddress?.emailAddress}</Text>
      )}

      <TextInput
        value={joinGameId}
        onChangeText={(gameId) => setJoinGameId(gameId)}
        autoCapitalize="none"
        placeholder={'Game ID'}
        style={styles.input}
      />

      <Pressable style={styles.button} onPress={createGame}>
        <Text style={styles.text}>Create game</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={joinGame}>
        <Text style={styles.text}>Join game</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={signout}>
        <Text style={styles.text}>Sign out</Text>
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
  },
  input: {
    width: 250,
    height: 44,
    padding: 10,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#e8e8e8',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'black',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});
