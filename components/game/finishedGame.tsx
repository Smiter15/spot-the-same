import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import { Game } from '../../convex/games';

type Props = {
    game: Game;
    userId: Id<'users'>;
};

export default function FinishedGame({ game, userId }: Props) {
    const router = useRouter();

    // Always watch the latest state of this game
    const latestGame = useQuery(api.games.getGame, { id: game._id });

    // Lookup winner’s user record
    const winnerUser = useQuery(api.users.getUser, game.winner ? { id: game.winner } : 'skip');

    const votePlayAgain = useMutation(api.games.votePlayAgain);
    const playAgain = useMutation(api.games.playAgain);

    const [hasVoted, setHasVoted] = useState(false);

    // Redirect when the server sets nextGameId
    useEffect(() => {
        if (latestGame?.nextGameId) {
            router.replace(`/game/${latestGame.nextGameId}?userId=${userId}`);
        }
    }, [latestGame?.nextGameId, router, userId]);

    const handlePlayAgain = async () => {
        if (hasVoted) return;

        setHasVoted(true);

        await votePlayAgain({ gameId: game._id, noVotes: game.noPlayAgainPlayers });

        // Last player triggers playAgain mutation
        if (game.noPlayAgainPlayers + 1 === game.noExpectedPlayers) {
            await playAgain({
                gameId: game._id,
                players: game.players,
                noExpectedPlayers: game.noExpectedPlayers,
            });
        }
    };

    const handleLeave = async () => {
        router.replace('/lobby');
    };

    const winnerLabel = game.winner ? (game.winner === userId ? 'You 🎉' : (winnerUser?.email ?? 'Unknown')) : 'Nobody';

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Game Over!</Text>
            <Text style={styles.winner}>Winner: {winnerLabel}</Text>

            <Text style={styles.stats}>
                Players: {game.players.length} / {game.noExpectedPlayers}
            </Text>
            <Text style={styles.stats}>Turn count: {game.turn}</Text>

            {!latestGame?.nextGameId ? (
                <>
                    <Pressable
                        style={[styles.button, hasVoted && styles.disabled]}
                        onPress={handlePlayAgain}
                        disabled={hasVoted}
                    >
                        <Text style={styles.buttonText}>{hasVoted ? 'Waiting for others...' : 'Play Again'}</Text>
                    </Pressable>

                    <Text style={styles.votes}>
                        Votes so far: {latestGame?.noPlayAgainPlayers ?? 0} / {game.noExpectedPlayers}
                    </Text>

                    <Pressable style={styles.button} onPress={handleLeave}>
                        <Text style={styles.buttonText}>Leave Game</Text>
                    </Pressable>
                </>
            ) : (
                <Text style={styles.waiting}>Starting new game...</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    winner: {
        fontSize: 20,
        marginBottom: 20,
    },
    stats: {
        fontSize: 16,
        marginBottom: 8,
    },
    votes: {
        marginTop: 16,
        fontSize: 16,
        color: '#555',
    },
    waiting: {
        marginTop: 20,
        fontSize: 16,
        fontStyle: 'italic',
        color: '#333',
    },
    button: {
        backgroundColor: 'black',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 6,
        marginTop: 16,
    },
    disabled: {
        backgroundColor: '#999',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
