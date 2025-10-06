import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, Alert, Share, ActivityIndicator } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { QrCodeSvg } from 'react-native-qr-svg';
import { useAudioPlayer } from 'expo-audio';
import { useUser } from '@clerk/clerk-expo';

import { Id } from '../../convex/_generated/dataModel';
import { api } from '../../convex/_generated/api';
import ActiveCard from '../../components/game/activeCard';
import PlayerCards from '../../components/game/playerCards';
import FinishedGame from '../../components/game/finishedGame';
import type { Card } from '../../types';
import type { Game as GameType } from '../../convex/games';

export default function Game() {
    const { user, isLoaded, isSignedIn } = useUser();

    const [score, setScore] = useState(0);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [convexUserId, setConvexUserId] = useState<Id<'users'> | null>(null); // 🧩 new

    const { id } = useLocalSearchParams();
    const gameId = Array.isArray(id) ? id[0] : id;

    const game: GameType | undefined = useQuery(api.games.getGame, {
        id: gameId as Id<'games'>,
    });

    const startGameMutation = useMutation(api.games.startGame);
    const joinGameMutation = useMutation(api.games.joinGame);
    const takeTurnMutation = useMutation(api.games.takeTurn);

    // --- Redirect if not signed in ---
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            Alert.alert('Sign in required', 'Please log in to join or create a game.');
            router.replace('/');
        }
    }, [isLoaded, isSignedIn]);

    // --- Auto join the game ---
    useEffect(() => {
        const autoJoin = async () => {
            if (!isSignedIn || !user?.id || !gameId) return;
            try {
                setJoining(true);
                const { userId } = await joinGameMutation({ gameId: gameId as Id<'games'> });
                setConvexUserId(userId); // 🧩 store the Convex ID
            } catch (err: any) {
                if (err?.message?.includes('User not registered')) {
                    Alert.alert('Sign up required', 'You need an account to join this game.');
                    router.replace('/');
                } else {
                    console.error('Join game failed:', err);
                    Alert.alert('Error', 'Could not join the game.');
                }
            } finally {
                setJoining(false);
            }
        };
        autoJoin();
    }, [isSignedIn, user?.id, gameId]);

    // --- Auto start when all joined ---
    useEffect(() => {
        const maybeStartGame = async () => {
            try {
                if (game?._id && !game.started && game.players.length === game.noExpectedPlayers) {
                    await startGameMutation({ gameId: game._id });
                }
            } catch (err) {
                console.error('Failed to start game:', err);
            }
        };
        maybeStartGame();
    }, [game]);

    // --- Sounds ---
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

    // --- Share / Copy ---
    const copyGameId = async () => {
        if (gameId) {
            await Clipboard.setStringAsync(gameId);
            Alert.alert('Copied!', 'Game ID copied to clipboard.');
        }
    };

    const shareGameLink = async () => {
        if (!shareLink) return;
        await Share.share({
            message: `Join my Spot the Same game! Tap here to play:\n${shareLink}`,
            url: shareLink,
        });
    };

    useEffect(() => {
        if (gameId) {
            const link = Linking.createURL(`/game/${gameId}`);
            setShareLink(link);
        }
    }, [gameId]);

    // --- Guess handler ---
    const guess = async (card: Card, icon: number): Promise<'red' | 'yellow' | 'green'> => {
        const correct = game?.activeCard.includes(icon);
        if (!correct) {
            playSound(0);
            return 'red';
        }

        try {
            const { tooSlow } = await takeTurnMutation({
                gameId: gameId as Id<'games'>,
                userId: convexUserId as Id<'users'>, // 🧩 use Convex userId here
                card,
                turn: game!.turn,
            });

            if (tooSlow) {
                playSound(1);
                return 'yellow';
            } else {
                playSound(2);
                setScore((prev) => prev + 1);
                return 'green';
            }
        } catch (err) {
            console.error('Guess mutation failed:', err);
            return 'red';
        }
    };

    // --- UI renderers ---
    const renderWaiting = () => (
        <View style={{ alignItems: 'center', gap: 12 }}>
            <Text>
                Waiting for players... {game?.players.length} / {game?.noExpectedPlayers}
            </Text>

            <Pressable style={styles.button} onPress={copyGameId}>
                <Text style={styles.text}>Copy Game ID</Text>
            </Pressable>

            {shareLink && (
                <View style={styles.qrContainer}>
                    <Text style={styles.qrText}>Share this game</Text>
                    <QrCodeSvg value={shareLink} frameSize={160} />
                    <Pressable style={[styles.button, { marginTop: 10 }]} onPress={shareGameLink}>
                        <Text style={styles.text}>Share Link</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );

    const renderPlaying = () => (
        <View style={{ alignItems: 'center', gap: 12 }}>
            <Text>Score: {score}</Text>
            {game?.activeCard && <ActiveCard card={game.activeCard} />}
            <PlayerCards gameId={gameId ?? ''} userId={convexUserId ?? ''} guess={guess} /> {/* 🧩 fixed */}
        </View>
    );

    if (!isLoaded || joining) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="black" />
                <Text style={{ marginTop: 10 }}>Joining game...</Text>
            </View>
        );
    }

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
                <FinishedGame game={game} userId={convexUserId as Id<'users'>} />
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
        backgroundColor: 'black',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    qrContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    qrText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
});
