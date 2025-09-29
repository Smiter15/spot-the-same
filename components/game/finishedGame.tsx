import { useEffect, useMemo } from 'react';
import { StyleSheet, Pressable, View, Text, Alert } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Game } from '../../convex/games';

type FinishedGameProps = {
    game: Game;
    userId: Id<'users'>;
};

export default function FinishedGame({ game, userId }: FinishedGameProps) {
    const votePlayAgain = useMutation(api.games.votePlayAgain);
    const playAgainMutation = useMutation(api.games.playAgain);
    const deleteGame = useMutation(api.games.deleteGame);

    // Query all player details safely
    const playerDetails = game.players.map((playerId) => {
        const details = useQuery(api.gameDetails.getGameDetails, {
            gameId: game._id,
            userId: playerId,
        });

        const user = useQuery(api.users.getUser, { id: playerId });
        return { email: user?.email, score: details?.score };
    });

    const results = useMemo(() => {
        return playerDetails
            .filter((p) => typeof p.score === 'number')
            .map((p) => ({ email: p.email ?? 'Unknown', score: p.score as number }));
    }, [playerDetails]);

    const topScorer = useMemo(() => {
        if (results.length === 0) return null;
        return results.reduce((max, cur) => (cur.score > max.score ? cur : max)).email;
    }, [results]);

    // Auto start new game if all players voted play again
    useEffect(() => {
        async function autoStartNext() {
            try {
                if (game.noExpectedPlayers === game.noPlayAgainPlayers && game.nextGameId) {
                    await playAgainMutation({
                        gameId: game.nextGameId,
                        players: game.players,
                        noExpectedPlayers: game.noExpectedPlayers,
                    });

                    router.push({ pathname: `/game/${game.nextGameId}`, params: { userId } });
                }
            } catch (err) {
                console.error('Auto playAgain failed:', err);
            }
        }
        autoStartNext();
    }, [game, playAgainMutation, userId]);

    const handlePlayAgain = async () => {
        try {
            await votePlayAgain({
                gameId: game._id,
                noVotes: game.noPlayAgainPlayers,
            });
        } catch {
            Alert.alert('Error', 'Failed to vote for play again.');
        }
    };

    const handleLeave = async () => {
        try {
            if (game.nextGameId) {
                await deleteGame({ gameId: game.nextGameId });
            }
            router.push('/lobby');
        } catch {
            Alert.alert('Error', 'Failed to leave the game.');
        }
    };

    if (results.length === 0) {
        return <Text style={styles.noResults}>No scores yet</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.winner}>Winner: {topScorer}</Text>

            <View style={styles.results}>
                {results.map((r) => (
                    <Text key={`result-${r.email}`}>
                        {r.email} - {r.score}
                    </Text>
                ))}
            </View>

            <Pressable style={styles.button} onPress={handlePlayAgain}>
                <Text style={styles.text}>
                    Play again {game.noPlayAgainPlayers} / {game.noExpectedPlayers}
                </Text>
            </Pressable>

            <Pressable style={styles.button} onPress={handleLeave}>
                <Text style={styles.text}>Leave</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    results: {
        marginVertical: 16,
        alignItems: 'center',
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 6,
        elevation: 3,
        backgroundColor: 'black',
        marginTop: 12,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    winner: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    noResults: {
        marginTop: 20,
        fontSize: 16,
        color: '#888',
    },
});
