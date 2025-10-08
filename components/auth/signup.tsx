import { useState } from 'react';
import { Text, TextInput, View, StyleSheet, Pressable } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';

type SignUpProps = {
    toggleSignIn: () => void;
};

export default function SignUp({ toggleSignIn }: SignUpProps) {
    const { isLoaded, signUp, setActive } = useSignUp();

    const [emailAddress, setEmailAddress] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [pendingVerification, setPendingVerification] = useState(false);
    const [code, setCode] = useState('');
    const [error, setError] = useState<string | null>(null);

    const onSignUpPress = async () => {
        if (!isLoaded) return;

        try {
            await signUp.create({
                emailAddress,
                password,
                username,
            });

            await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            setPendingVerification(true);
            setError(null);
        } catch (err: any) {
            console.error('Sign up error:', err);
            setError(err?.errors?.[0]?.message || 'Sign up failed. Please check your details and try again.');
        }
    };

    // Verify the code sent by email
    const onPressVerify = async () => {
        if (!isLoaded) return;

        try {
            const completeSignUp = await signUp.attemptEmailAddressVerification({
                code,
            });

            await setActive({ session: completeSignUp.createdSessionId });
            router.replace('(authed)/lobby');
        } catch (err: any) {
            console.error('Verification error:', err);
            setError('Invalid code. Please try again.');
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
                        placeholder="Email..."
                        onChangeText={setEmailAddress}
                    />

                    <TextInput
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                        value={username}
                        placeholder="Player name..."
                        onChangeText={setUsername}
                    />

                    <TextInput
                        value={password}
                        style={styles.input}
                        placeholder="Password..."
                        secureTextEntry
                        textContentType="newPassword"
                        onChangeText={setPassword}
                    />

                    {error && <Text style={styles.error}>{error}</Text>}

                    <Pressable style={styles.button} onPress={onSignUpPress}>
                        <Text style={styles.text}>Sign up</Text>
                    </Pressable>

                    <Pressable onPress={toggleSignIn}>
                        <Text style={styles.link}>Already have an account? Sign in here</Text>
                    </Pressable>
                </>
            ) : (
                <>
                    <TextInput
                        style={styles.input}
                        value={code}
                        placeholder="Verification code..."
                        keyboardType="number-pad"
                        onChangeText={setCode}
                    />

                    {error && <Text style={styles.error}>{error}</Text>}

                    <Pressable style={styles.button} onPress={onPressVerify}>
                        <Text style={styles.text}>Verify Email</Text>
                    </Pressable>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 4,
        backgroundColor: 'black',
        marginTop: 10,
    },
    input: {
        width: 250,
        height: 44,
        padding: 10,
        backgroundColor: '#e8e8e8',
        borderRadius: 4,
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
    link: {
        marginTop: 10,
        color: 'blue',
        textAlign: 'center',
    },
    error: {
        marginTop: 8,
        color: 'red',
        fontSize: 14,
    },
});
