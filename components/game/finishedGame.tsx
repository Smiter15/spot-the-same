import { useState } from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Game } from '../../convex/games';
import { User } from '../../convex/users';

type Result = {
  email?: string;
  score: number;
};

type FinishedGameProps = {
  game: Game;
  userId: Id<'users'>;
};

const FinishedGame = ({ game, userId }: FinishedGameProps) => {
  const user: User = useQuery(api.users.getUser, {
    id: userId,
  });

  //   const playAgainMutation = useMutation(api.games.playAgain);
  const createGameMutation = useMutation(api.games.createGame);

  const findTopScorer = (results: Result[]) => {
    let score = 0;
    let winner = null;

    for (const result of results) {
      if (result.score > score) {
        winner = result.email;
      }
    }

    return winner;
  };

  const results: Result[] = [];
  game.players.forEach((gameUserId: Id<'users'>) => {
    const gameDetails = useQuery(api.gameDetails.getGameDetails, {
      gameId: game._id as Id<'games'>,
      userId: gameUserId as Id<'users'>,
    });

    const user = useQuery(api.users.getUser, {
      id: gameUserId,
    });

    // handles score of 0
    if (typeof gameDetails?.score === 'number') {
      results.push({
        email: user?.email,
        score: gameDetails?.score,
      });
    }
  });

  const playAgain = async () => {
    console.log('play again!');
    const { gameId } = await createGameMutation({
      noExpectedPlayers: game.noExpectedPlayers,
      email: user.email,
    });

    router.replace({
      pathname: `/game/${gameId}`,
      params: { email: user.email },
    });

    // receive game id, replace router with game id?
    // create a new game

    // await playAgainMutation({
    //   noExpectedPlayers: game.noExpectedPlayers,
    //   players: game.players,
    // });
  };

  const joinGame = () => {
    // add count of players who want to play again
  };

  if (!results || results.length === 0) return null;

  return (
    <>
      <Text style={styles.winner}>Winner is: {findTopScorer(results)}</Text>
      <View>
        {results?.map((result: Result) => (
          <Text key={`result-${result.email}`}>
            {result.email} - {result.score}
          </Text>
        ))}
      </View>

      <Pressable style={styles.button} onPress={playAgain}>
        <Text style={styles.text}>Play again</Text>
      </Pressable>

      <Pressable style={styles.button} onPress={joinGame}>
        <Text style={styles.text}>Join game</Text>
      </Pressable>
    </>
  );
};

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
    marginTop: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
  winner: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default FinishedGame;
