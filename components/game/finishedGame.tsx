import { useEffect } from 'react';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Game } from '../../convex/games';

type Result = {
  email?: string;
  score: number;
};

type FinishedGameProps = {
  game: Game;
  userId: Id<'users'>;
};

const FinishedGame = ({ game, userId }: FinishedGameProps) => {
  const votePlayAgainMutation = useMutation(api.games.votePlayAgain);
  const playAgainMutation = useMutation(api.games.playAgain);
  const deleteGameMutation = useMutation(api.games.deleteGame);

  useEffect(() => {
    async function playAgain() {
      await playAgainMutation({
        gameId: game?.nextGameId,
        players: game?.players,
        noExpectedPlayers: game?.noExpectedPlayers,
      });

      router.push({
        pathname: `/game/${game?.nextGameId}`,
        params: { userId },
      });
    }

    if (game?.noExpectedPlayers === game?.noPlayAgainPlayers) {
      playAgain();
    }
  }, [game]);

  const findTopScorer = (results: Result[]) => {
    const winner = results.reduce((max, current) => {
      return current.score > max.score ? current : max;
    });

    return winner.email;
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
    await votePlayAgainMutation({
      gameId: game._id,
      noVotes: game?.noPlayAgainPlayers,
    });
  };

  const leaveGame = async () => {
    deleteGameMutation({ gameId: game?.nextGameId });

    router.push({ pathname: '/lobby' });
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
        <Text style={styles.text}>
          Play again {game?.noPlayAgainPlayers} / {game?.noExpectedPlayers}
        </Text>
      </Pressable>

      <Pressable style={styles.button} onPress={leaveGame}>
        <Text style={styles.text}>Leave</Text>
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
