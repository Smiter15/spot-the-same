// app/(authed)/lobby/join.tsx
import { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useMutation } from 'convex/react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Linking as RNLinking,
    Platform,
} from 'react-native';
import * as Linking from 'expo-linking';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

type Mode = 'scan' | 'code';
const WIDTH = 360;

export default function JoinGame() {
    const [mode, setMode] = useState<Mode>('scan');

    const [permission, requestPermission] = useCameraPermissions();
    const hasPermission = permission?.granted ?? null;

    const [scanned, setScanned] = useState(false);
    const [busy, setBusy] = useState(false);
    const cooldown = useRef(0);

    const [joinGameId, setJoinGameId] = useState('');

    const joinGameMutation = useMutation(api.games.joinGame);

    useEffect(() => {
        if (mode === 'scan' && permission?.status == null) {
            requestPermission();
        }
    }, [mode, permission?.status, requestPermission]);

    const extractGameId = (value: string): string | null => {
        try {
            if (!/^https?:|^[a-z]+:\/\//i.test(value)) return value.trim();
            const parsed = Linking.parse(value);
            const fullPath = parsed.path || '';
            const parts = fullPath.split('/').filter(Boolean);
            return parts.pop() || null;
        } catch {
            return null;
        }
    };

    const joinWithId = async (gameId: string) => {
        if (!gameId) {
            Alert.alert('Invalid code', 'Please try scanning again or enter a code.');
            return;
        }
        try {
            setBusy(true);
            const { userId } = await joinGameMutation({ gameId: gameId as Id<'games'> });
            router.replace({ pathname: `/game/${gameId}`, params: { userId: String(userId) } });
        } catch (err: any) {
            console.error(err);
            Alert.alert('Error', 'Could not join the game. Check the code and try again.');
        } finally {
            setBusy(false);
        }
    };

    const onBarcodeScanned = ({ data }: { data: string }) => {
        const now = Date.now();
        if (scanned || now - cooldown.current < 1200 || busy) return;
        cooldown.current = now;
        setScanned(true);

        const gameId = extractGameId(String(data));
        if (!gameId) {
            setTimeout(() => setScanned(false), 1000);
            Alert.alert('QR not recognized', 'This code doesn’t look like a Spot the Same game link.');
            return;
        }
        joinWithId(gameId);
    };

    const onPressJoinByCode = async () => {
        const id = joinGameId.trim();
        if (!id) {
            Alert.alert('Missing code', 'Please enter a game code.');
            return;
        }
        await joinWithId(id);
    };

    const openSettings = async () => {
        try {
            if (Platform.OS === 'ios') await RNLinking.openURL('app-settings:');
            else await RNLinking.openSettings();
        } catch {}
    };

    return (
        <KeyboardAvoidingView style={styles.screen} behavior="padding">
            <StatusBar style="dark" />
            <Text style={styles.title}>Join Game</Text>
            <Text style={styles.subtitle}>Scan a QR or enter a code</Text>

            {/* Segmented tabs */}
            <View style={styles.tabsRow}>
                <Pressable onPress={() => setMode('scan')} style={styles.tabButton}>
                    <Text style={[styles.tabText, mode === 'scan' && styles.tabTextActive]}>Scan QR</Text>
                    {mode === 'scan' && <View style={styles.tabUnderline} />}
                </Pressable>
                <Pressable onPress={() => setMode('code')} style={styles.tabButton}>
                    <Text style={[styles.tabText, mode === 'code' && styles.tabTextActive]}>Enter Code</Text>
                    {mode === 'code' && <View style={styles.tabUnderline} />}
                </Pressable>
            </View>

            {/* Content */}
            {mode === 'scan' ? (
                <View style={styles.scanWrap}>
                    {hasPermission === null ? (
                        <View style={styles.permissionCard}>
                            <Text style={styles.permissionTitle}>Requesting camera access…</Text>
                            <Pressable style={styles.permissionBtn} onPress={requestPermission}>
                                <Text style={styles.permissionBtnText}>Allow Camera</Text>
                            </Pressable>
                        </View>
                    ) : hasPermission === false ? (
                        <View style={styles.permissionCard}>
                            <Text style={styles.permissionTitle}>Camera permission needed</Text>
                            <Text style={styles.permissionText}>
                                Enable camera access to scan QR codes, or switch to “Enter Code”.
                            </Text>
                            <Pressable style={styles.permissionBtn} onPress={openSettings}>
                                <Text style={styles.permissionBtnText}>Open Settings</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <>
                            <View style={styles.scannerBox}>
                                <CameraView
                                    style={StyleSheet.absoluteFillObject}
                                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                                    onBarcodeScanned={({ data }) => onBarcodeScanned({ data })}
                                />
                                <View style={styles.frame} />
                            </View>
                            <Text style={styles.scanHint}>Point your camera at the QR code</Text>

                            {/* Back link placed here to mirror Create screen position */}
                            <Pressable style={styles.backLink} onPress={() => router.back()} disabled={busy}>
                                <Text style={styles.backText}>← Back</Text>
                            </Pressable>
                        </>
                    )}
                </View>
            ) : (
                <View style={styles.codeWrap}>
                    <TextInput
                        value={joinGameId}
                        onChangeText={setJoinGameId}
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholder="Game code"
                        placeholderTextColor="#8FA0B6"
                        style={styles.input}
                        editable={!busy}
                        returnKeyType="go"
                        onSubmitEditing={onPressJoinByCode}
                    />
                    <Pressable
                        style={[styles.primary, (busy || !joinGameId.trim()) && styles.primaryDisabled]}
                        onPress={onPressJoinByCode}
                        disabled={busy || !joinGameId.trim()}
                    >
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Join</Text>}
                    </Pressable>

                    {/* Back link directly under the CTA (same as Create) */}
                    <Pressable style={styles.backLink} onPress={() => router.back()} disabled={busy}>
                        <Text style={styles.backText}>← Back</Text>
                    </Pressable>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#F6F8FB',
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingTop: 60,
    },
    title: { fontSize: 32, fontWeight: '900', color: '#0B1220' },
    subtitle: { marginTop: 6, fontSize: 15, color: '#5D6B88' },

    tabsRow: {
        width: '100%',
        maxWidth: WIDTH,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: 8,
        marginTop: 20,
    },
    tabButton: { paddingBottom: 8, width: '50%', alignItems: 'center' },
    tabText: { fontSize: 16, fontWeight: '700', color: '#7A879C' },
    tabTextActive: { color: '#0B1220' },
    tabUnderline: {
        marginTop: 8,
        marginBottom: -8,
        height: 3,
        width: '100%',
        backgroundColor: '#2F80ED',
        borderRadius: 2,
    },

    // Scanner
    scanWrap: {
        width: '100%',
        maxWidth: WIDTH,
        alignItems: 'center',
        marginTop: 18,
        gap: 14,
        flex: 1,
    },
    scannerBox: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 18,
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    frame: {
        position: 'absolute',
        inset: 0,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.6)',
        borderRadius: 18,
    },
    scanHint: { color: '#5D6B88', fontSize: 14, marginTop: 6 },

    // Permission UI
    permissionCard: {
        width: '100%',
        maxWidth: WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    permissionTitle: { fontSize: 16, fontWeight: '800', color: '#0B1220' },
    permissionText: { marginTop: 8, fontSize: 14, color: '#5D6B88', textAlign: 'center' },
    permissionBtn: {
        marginTop: 12,
        backgroundColor: '#2F80ED',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 999,
    },
    permissionBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

    // Code fallback
    codeWrap: {
        width: '100%',
        maxWidth: WIDTH,
        alignItems: 'center',
        marginTop: 18,
        gap: 14,
        flex: 1,
    },
    input: {
        width: '100%',
        height: 56,
        paddingHorizontal: 18,
        backgroundColor: '#EEF3FA',
        borderRadius: 28,
        fontSize: 16,
        color: '#0B1220',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },

    primary: {
        marginTop: 6,
        width: '100%',
        height: 58,
        backgroundColor: '#2F80ED',
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2F80ED',
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 6 },
    },
    primaryDisabled: { opacity: 0.6 },
    primaryText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

    // Back link (same placement philosophy as Create)
    backLink: { marginTop: 18 },
    backText: { color: '#2F80ED', fontSize: 15, fontWeight: '700' },
});
