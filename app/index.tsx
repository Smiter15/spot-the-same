import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import {
  StyleSheet,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
  Alert,
} from 'react-native';
import { useMutation } from 'convex/react';

import { Id } from '../convex/_generated/dataModel';
import { api } from '../convex/_generated/api';

export default function App() {
  const { username: usernameParam } = useLocalSearchParams();

  const [username, setUsername] = useState('');
  const [joinGameId, setJoinGameId] = useState('');

  useEffect(() => {
    if (usernameParam) {
      setUsername(usernameParam as string);
    }
  }, [usernameParam]);

  const createGameMutation = useMutation(api.games.createGame);
  const joinGameMutation = useMutation(api.games.joinGame);

  const createGame = async () => {
    if (username.length < 3) {
      Alert.alert('Username needs to be atleast 3 characters long');
      return;
    }

    const { gameId, playerId } = await createGameMutation({
      noExpectedPlayers: 2,
      username,
    });

    router.push({ pathname: `/game/${gameId}`, params: { playerId } });
  };

  const joinGame = async () => {
    if (username.length < 3) {
      Alert.alert('Username needs to be atleast 3 characters long');
      return;
    }
    if (!joinGameId) {
      Alert.alert('You must input a game ID to join a game');
      return;
    }

    const { playerId } = await joinGameMutation({
      username,
      gameId: joinGameId as Id<'games'>,
    });

    router.push({ pathname: `/game/${joinGameId}`, params: { playerId } });
  };

  return (
    <KeyboardAvoidingView style={styles.container}>
      <StatusBar style="auto" />

      <Text style={styles.title}>Welcome to Spot the Same!</Text>

      <TextInput
        value={username}
        onChangeText={(username) => setUsername(username)}
        autoCapitalize="none"
        placeholder={'Username'}
        style={styles.input}
      />

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
  link: {
    marginTop: 10,
    color: 'blue',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
