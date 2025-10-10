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

export default function Game() {
    const { user, isLoaded, isSignedIn } = useUser();

    const [score, setScore] = useState(0);
    const [shareLink, setShareLink] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);
    const [convexUserId, setConvexUserId] = useState<Id<'users'> | null>(null);
    const [roundStartedAt, setRoundStartedAt] = useState<number | null>(null);

    const { id } = useLocalSearchParams();
    const gameId = Array.isArray(id) ? id[0] : id;

    const game = useQuery(api.games.getGame, { id: gameId as Id<'games'> });
    const activeAtGuess = game?.activeCard ?? [];
    const turnAtGuess = game?.turn ?? 0;

    const startGameMutation = useMutation(api.games.startGame);
    const joinGameMutation = useMutation(api.games.joinGame);
    const takeTurnMutation = useMutation(api.games.takeTurn);
    const logMistakeMutation = useMutation(api.games.logMistake);

    useEffect(() => {
        if (game?.turn != null) setRoundStartedAt(Date.now());
    }, [game?.turn]);

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
                setConvexUserId(userId);
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
        const reactionMs = roundStartedAt ? Date.now() - roundStartedAt : 0;
        const correct = game?.activeCard.includes(icon);

        if (!correct) {
            try {
                if (gameId && convexUserId) {
                    await logMistakeMutation({
                        gameId: gameId as Id<'games'>,
                        userId: convexUserId as Id<'users'>,
                        guessedSymbol: icon,
                        playerTopCard: card,
                        reactionMs,
                        activeAtGuess,
                        turnAtGuess,
                    } as any); // keep API surface as-is; server can ignore extras
                }
            } catch (e) {
                console.warn('logMistake failed', e);
            }
            playSound(0);
            return 'red';
        }

        try {
            const { tooSlow } = await takeTurnMutation({
                gameId: gameId as Id<'games'>,
                userId: convexUserId as Id<'users'>,
                card,
                turn: game!.turn,
                guessedSymbol: icon,
                reactionMs,
                activeAtGuess,
            } as any);

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

    // --- UI renderers (new design) ---
    const renderWaiting = () => (
        <View style={styles.waitWrap}>
            <Text style={styles.waitTitle}>Waiting for players…</Text>
            <Text style={styles.waitSub}>
                {game?.players.length} / {game?.noExpectedPlayers}
            </Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Share this game</Text>
                {shareLink ? (
                    <>
                        <View style={styles.qrBox}>
                            <QrCodeSvg value={shareLink} frameSize={180} />
                        </View>

                        <Pressable style={styles.primary} onPress={shareGameLink}>
                            <Text style={styles.primaryText}>Share Link</Text>
                        </Pressable>

                        <Pressable style={styles.secondary} onPress={copyGameId}>
                            <Text style={styles.secondaryText}>Copy Code</Text>
                        </Pressable>

                        <Text style={styles.codeHint}>Code: {String(gameId)}</Text>
                    </>
                ) : (
                    <Text style={styles.cardBody}>Preparing link…</Text>
                )}
            </View>

            <Pressable style={styles.backLink} onPress={() => router.replace('/(authed)/lobby')}>
                <Text style={styles.backText}>← Back to Lobby</Text>
            </Pressable>
        </View>
    );

    const renderPlaying = () => (
        <View style={styles.playWrap}>
            {/* Top bar */}
            <View style={styles.topBar}>
                <Text style={styles.topTitle}>Spot the Same!</Text>
                <View style={styles.scorePill}>
                    <Text style={styles.scorePillText}>Score: {score}</Text>
                </View>
            </View>

            {/* Center card */}
            <View style={styles.centerCardWrap}>{game?.activeCard && <ActiveCard card={game.activeCard} />}</View>

            {/* Player hand */}
            <View style={styles.playerHand}>
                <PlayerCards gameId={gameId ?? ''} userId={convexUserId ?? ''} guess={guess} />
            </View>
        </View>
    );

    // --- Render states ---
    if (!isLoaded || joining) {
        return (
            <View style={styles.screenLoading}>
                <StatusBar style="dark" />
                <ActivityIndicator size="large" color="#2F80ED" />
                <Text style={styles.loadingText}>Joining game…</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            <StatusBar style="dark" />
            {!game ? (
                <View style={styles.screenLoading}>
                    <ActivityIndicator size="large" color="#2F80ED" />
                    <Text style={styles.loadingText}>Loading…</Text>
                </View>
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

const WIDTH = 360;

const styles = StyleSheet.create({
    // Screen shells
    screen: {
        flex: 1,
        backgroundColor: '#F6F8FB',
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    screenLoading: {
        flex: 1,
        backgroundColor: '#F6F8FB',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    loadingText: { color: '#5D6B88', fontSize: 15 },

    // Waiting UI
    waitWrap: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 30,
    },
    waitTitle: { fontSize: 26, fontWeight: '900', color: '#0B1220' },
    waitSub: { marginTop: 6, fontSize: 15, color: '#5D6B88' },

    card: {
        marginTop: 20,
        width: '100%',
        maxWidth: WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#0B1220', marginBottom: 10 },
    cardBody: { fontSize: 14, color: '#5D6B88' },

    qrBox: {
        width: 220,
        height: 220,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: '#F6F8FB',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },

    // Buttons (primary/secondary)
    primary: {
        marginTop: 6,
        width: '100%',
        height: 56,
        backgroundColor: '#2F80ED',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2F80ED',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 },
    },
    primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },

    secondary: {
        marginTop: 10,
        width: '100%',
        height: 52,
        backgroundColor: '#E4F0FF',
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: { color: '#2F80ED', fontSize: 16, fontWeight: '800' },

    codeHint: { marginTop: 10, color: '#5D6B88', fontSize: 13 },

    backLink: { marginTop: 18 },
    backText: { color: '#2F80ED', fontSize: 15, fontWeight: '700' },

    // Playing UI
    playWrap: { flex: 1 },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    topTitle: { fontSize: 20, fontWeight: '900', color: '#0B1220' },
    scorePill: {
        backgroundColor: '#EDEFF4',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
    },
    scorePillText: { fontSize: 14, fontWeight: '800', color: '#0B1220' },

    centerCardWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        marginBottom: 8,
    },
    playerHand: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
});
