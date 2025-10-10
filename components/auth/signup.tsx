import { useState } from 'react';
import { Text, TextInput, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useMutation } from 'convex/react';

import { api } from '../../convex/_generated/api';

export default function SignUp() {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [emailAddress, setEmailAddress] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);

    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const syncFromClerk = useMutation(api.users.syncFromClerk);

    const onSignUpPress = async () => {
        if (!isLoaded || loading) return;
        setLoading(true);
        setError(null);

        try {
            await signUp.create({
                emailAddress: emailAddress.trim(),
                password,
                username,
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
        } catch (err: any) {
            console.error('Sign up error:', err);
            setError(err?.errors?.[0]?.message || 'Sign up failed. Please check your details and try again.');
        } finally {
            setLoading(false);
        }
    };

    const onPressVerify = async () => {
        if (!isLoaded || loading) return;
        setLoading(true);
        setError(null);

        try {
            const { createdSessionId, username: uname } = await signUp.attemptEmailAddressVerification({ code });
            await setActive({ session: createdSessionId });

            await new Promise((r) => setTimeout(r, 400));
            await syncFromClerk({ username: uname || username });

            router.replace('(authed)/lobby');
        } catch (err: any) {
            console.error('Verification error:', err);
            setError('Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {!pendingVerification ? (
                <>
                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                        style={styles.input}
                        value={emailAddress}
                        placeholder="Email"
                        placeholderTextColor="#8FA0B6"
                        onChangeText={setEmailAddress}
                        editable={!loading}
                    />

                    <TextInput
                        autoCapitalize="words"
                        autoCorrect
                        style={styles.input}
                        value={username}
                        placeholder="Player name"
                        placeholderTextColor="#8FA0B6"
                        onChangeText={setUsername}
                        editable={!loading}
                    />

                    <View style={styles.inputWrap}>
                        <TextInput
                            value={password}
                            style={styles.inputField}
                            placeholder="Password"
                            placeholderTextColor="#8FA0B6"
                            secureTextEntry={!showPw}
                            textContentType="newPassword"
                            onChangeText={setPassword}
                            editable={!loading}
                            returnKeyType="go"
                            autoComplete="new-password"
                            onSubmitEditing={onSignUpPress}
                        />
                        <Pressable
                            onPress={() => setShowPw((s) => !s)}
                            hitSlop={10}
                            disabled={loading}
                            style={styles.eyeButton}
                        >
                            <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={22} color="#7A879C" />
                        </Pressable>
                    </View>

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <Pressable
                        style={[
                            styles.button,
                            (loading || !emailAddress || !username || !password) && styles.buttonDisabled,
                        ]}
                        onPress={onSignUpPress}
                        disabled={loading || !emailAddress || !username || !password}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
                    </Pressable>
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        value={code}
                        placeholder="Verification code"
                        placeholderTextColor="#8FA0B6"
                        keyboardType="number-pad"
                        onChangeText={setCode}
                        editable={!loading}
                        textContentType="oneTimeCode"
                        autoComplete="one-time-code"
                    />

                    {error ? <Text style={styles.error}>{error}</Text> : null}

                    <Pressable
                        style={[styles.button, (loading || !code) && styles.buttonDisabled]}
                        onPress={onPressVerify}
                        disabled={loading || !code}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Verify Email</Text>
                        )}
                    </Pressable>
                </>
            )}
        </View>
    );
}

const WIDTH = 360;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: WIDTH,
        alignItems: 'center',
        gap: 14,
    },

    // Single-field pill
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

    // Compound pill
    inputWrap: {
        width: '100%',
        height: 56,
        paddingLeft: 18,
        paddingRight: 8,
        backgroundColor: '#EEF3FA',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputField: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#0B1220',
    },
    eyeButton: {
        paddingHorizontal: 10,
        height: '100%',
        justifyContent: 'center',
    },

    button: {
        marginTop: 6,
        width: '100%',
        height: 58,
        backgroundColor: '#2F80ED',
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2F80ED',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 8 },
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    error: {
        width: '100%',
        textAlign: 'left',
        color: '#D64545',
        fontSize: 14,
        marginTop: -6,
    },
});
