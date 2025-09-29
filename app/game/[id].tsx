import { useState, useEffect, useMemo } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import * as Clipboard from 'expo-clipboard';
import { useAudioPlayer } from 'expo-audio';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';

import ActiveCard from '../../components/game/activeCard';
import PlayerCards from '../../components/game/playerCards';
import FinishedGame from '../../components/game/finishedGame';

import { Card } from '../../types';
import { Game as GameType } from '../../convex/games';

// Audio sources
const audioPaths = [
    require('../../assets/audio/quack.mp3'), // wrong
    require('../../assets/audio/fart.mp3'), // too slow
    require('../../assets/audio/ting.mp3'), // correct
];

export default function Game() {
    const [score, setScore] = useState(0);

    // Normalize params from router
    const { id, userId } = useLocalSearchParams();
    const gameId = Array.isArray(id) ? id[0] : id;
    const currentUserId = Array.isArray(userId) ? userId[0] : userId;

    const game: GameType | undefined = useQuery(api.games.getGame, {
        id: gameId as Id<'games'>,
    });

    const startGameMutation = useMutation(api.games.startGame);
    const takeTurnMutation = useMutation(api.games.takeTurn);

    useEffect(() => {
        const maybeStartGame = async () => {
            try {
                if (game?._id && game.started === false && game.players.length === game.noExpectedPlayers) {
                    await startGameMutation({ gameId: game._id });
                }
            } catch (err) {
                console.error('Failed to start game:', err);
            }
        };
        maybeStartGame();
    }, [game]);

    const soundWrong = useAudioPlayer(require('../../assets/audio/quack.mp3'));
    const soundTooSlow = useAudioPlayer(require('../../assets/audio/fart.mp3'));
    const soundCorrect = useAudioPlayer(require('../../assets/audio/ting.mp3'));

    const playSound = (i: number) => {
        const sounds = [soundWrong, soundTooSlow, soundCorrect];
        const player = sounds[i];
        if (player) {
            player.seekTo(0);
            player.play();
        }
    };

    const copyGameId = async () => {
        if (gameId) {
            await Clipboard.setStringAsync(gameId);
            Alert.alert('Copied!', 'Game ID has been copied to your clipboard.');
        }
    };

    const guess = async (card: Card, icon: number): Promise<'red' | 'yellow' | 'green'> => {
        const correct = game?.activeCard.includes(icon);

        // Wrong guess: handle locally
        if (!correct) {
            playSound(0); // ❌ wrong
            return 'red';
        }

        if (game?.turn == null) {
            console.error('Game turn is missing');
            return 'red';
        }

        try {
            const { tooSlow } = await takeTurnMutation({
                gameId: gameId as Id<'games'>,
                userId: currentUserId as Id<'users'>,
                card,
                turn: game.turn,
            });

            if (tooSlow) {
                playSound(1); // ⏱️ too slow
                return 'yellow';
            } else {
                playSound(2); // ✅ correct
                setScore((prev) => prev + 1);
                return 'green';
            }
        } catch (err) {
            console.error('Guess mutation failed:', err);
            return 'red';
        }
    };

    const renderWaiting = () => (
        <View style={{ alignItems: 'center', gap: 12 }}>
            <Text>
                Waiting for players... {game?.players.length} / {game?.noExpectedPlayers}
            </Text>
            <Pressable style={styles.button} onPress={copyGameId}>
                <Text style={styles.text}>Copy Game ID</Text>
            </Pressable>
        </View>
    );

    const renderPlaying = () => (
        <View style={{ alignItems: 'center', gap: 12 }}>
            <Text>Score: {score}</Text>
            {game?.activeCard && <ActiveCard card={game.activeCard} />}
            <PlayerCards gameId={gameId ?? ''} userId={currentUserId ?? ''} guess={guess} />
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            {!game ? (
                <Text>Loading...</Text>
            ) : game.players.length !== game.noExpectedPlayers ? (
                renderWaiting()
            ) : game.started && !game.finished ? (
                renderPlaying()
            ) : game.started && game.finished ? (
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
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
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
