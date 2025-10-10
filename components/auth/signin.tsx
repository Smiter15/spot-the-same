import { useState, useRef } from 'react';
import { Text, TextInput, Pressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

export default function SignIn() {
    const { signIn, setActive, isLoaded } = useSignIn();

    const passwordRef = useRef<TextInput>(null);

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const onSignInPress = async () => {
        if (!isLoaded || busy) return;
        setBusy(true);
        setError(null);

        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress.trim(),
                password,
            });
            await setActive({ session: completeSignIn.createdSessionId });
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError('Invalid email or password. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const onForgotPassword = () => {
        // TODO: wire up a reset flow
    };

    return (
        <View style={styles.container}>
            {/* Email */}
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
                editable={!busy}
                returnKeyType="next"
                autoComplete="email"
                onSubmitEditing={() => passwordRef.current?.focus()}
            />

            <View style={styles.inputWrap}>
                <TextInput
                    ref={passwordRef}
                    value={password}
                    style={styles.inputField}
                    placeholder="Password"
                    placeholderTextColor="#8FA0B6"
                    secureTextEntry={!showPw}
                    textContentType="password"
                    onChangeText={setPassword}
                    editable={!busy}
                    returnKeyType="go"
                    autoComplete="password"
                    onSubmitEditing={onSignInPress}
                />
                <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={10} disabled={busy} style={styles.eyeButton}>
                    <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={22} color="#7A879C" />
                </Pressable>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
                style={[styles.button, (busy || !emailAddress || !password) && styles.buttonDisabled]}
                onPress={onSignInPress}
                disabled={busy || !emailAddress || !password}
            >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
            </Pressable>

            <Pressable onPress={onForgotPassword} disabled={busy}>
                <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>
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

    forgot: {
        marginTop: 10,
        color: '#2F80ED',
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        width: '100%',
        textAlign: 'left',
        color: '#D64545',
        fontSize: 14,
        marginTop: -6,
    },
});
