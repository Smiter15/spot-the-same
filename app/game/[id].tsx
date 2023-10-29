import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import { Audio } from 'expo-av';
import * as Clipboard from 'expo-clipboard';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

import ActiveCard from '../../components/game/activeCard';
import PlayerCards from '../../components/game/playerCards';
import FinishedGame from '../../components/game/finishedGame';

import { Card } from '../../types';
import { Game as GameType } from '../../convex/games';

const audioPaths = {
  paths: [
    require('../../assets/audio/quack.mp3'),
    require('../../assets/audio/fart.mp3'),
    require('../../assets/audio/ting.mp3'),
  ],
};

export default function Game() {
  const [score, setScore] = useState(0); // keep client side?
  const [sound, setSound] = useState<any>();

  const { id: gameId, userId } = useLocalSearchParams();
  const game: GameType = useQuery(api.games.getGame, {
    id: gameId as Id<'games'>,
  });

  const startGameMutation = useMutation(api.games.startGame);
  const takeTurnMutation = useMutation(api.games.takeTurn);

  useEffect(() => {
    async function startGame() {
      await startGameMutation({ gameId: game?._id });
    }

    if (
      game?.started === false &&
      game?.players.length === game?.noExpectedPlayers
    ) {
      startGame();
    }
  }, [game]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playSound = async (i: number) => {
    const { sound } = await Audio.Sound.createAsync(audioPaths['paths'][i]);
    setSound(sound);

    await sound.playAsync();
  };

  const copyGameId = async () => {
    console.log('copied!');
    await Clipboard.setStringAsync(gameId as string);
  };

  const guess = async (card: Card, icon: number) => {
    const correct = game?.activeCard.includes(icon);

    if (!correct) {
      await playSound(0);
      return 'red';
    }

    const { tooSlow } = await takeTurnMutation({
      gameId: gameId as Id<'games'>,
      userId: userId as Id<'users'>,
      card,
      turn: game?.turn,
    });

    if (tooSlow) {
      await playSound(1);
      return 'yellow';
    } else {
      await playSound(2);
      setScore(score + 1);
      return 'green';
    }
  };

  const renderWaiting = () => (
    <>
      <Text>
        Waiting for players... {game?.players.length} /{' '}
        {game?.noExpectedPlayers}
      </Text>
      <Pressable style={styles.button} onPress={copyGameId}>
        <Text style={styles.text}>Copy game ID</Text>
      </Pressable>
    </>
  );

  const renderPlaying = () => (
    <>
      <Text>Score: {score}</Text>
      <ActiveCard card={game?.activeCard} />
      <PlayerCards
        gameId={gameId as string}
        userId={userId as string}
        guess={guess}
      />
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />

      {game?.players.length !== game?.noExpectedPlayers ? (
        renderWaiting()
      ) : game?.started && !game?.finished ? (
        renderPlaying()
      ) : game?.started && game?.finished ? (
        <FinishedGame game={game} userId={userId as Id<'users'>} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 100,
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
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
