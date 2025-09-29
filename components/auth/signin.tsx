import { useState } from 'react';
import { Text, TextInput, Pressable, View, StyleSheet, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';

type SignInProps = {
    toggleSignIn: () => void;
};

export default function SignIn({ toggleSignIn }: SignInProps) {
    const { signIn, setActive, isLoaded } = useSignIn();

    const [emailAddress, setEmailAddress] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const onSignInPress = async () => {
        if (!isLoaded) return;

        try {
            const completeSignIn = await signIn.create({
                identifier: emailAddress,
                password,
            });

            await setActive({ session: completeSignIn.createdSessionId });
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError('Invalid email or password. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
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
                value={password}
                style={styles.input}
                placeholder="Password..."
                secureTextEntry
                textContentType="password"
                onChangeText={setPassword}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <Pressable style={styles.button} onPress={onSignInPress}>
                <Text style={styles.text}>Sign in</Text>
            </Pressable>

            <Pressable onPress={toggleSignIn}>
                <Text style={styles.link}>Don't have an account? Sign up here</Text>
            </Pressable>
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
        elevation: 3,
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
        letterSpacing: 0.25,
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
