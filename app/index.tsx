import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, KeyboardAvoidingView } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';

import SignUp from '../components/auth/signup';
import SignIn from '../components/auth/signin';

export default function Index() {
    const { isLoaded, isSignedIn } = useUser();
    const [showSignIn, setShowSignIn] = useState(true);

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace('/(authed)/lobby');
        }
    }, [isLoaded, isSignedIn]);

    const toggleSignIn = () => setShowSignIn((prev) => !prev);

    if (!isLoaded) {
        return (
            <View style={styles.container}>
                <Text>Loading…</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <StatusBar style="auto" />
            <Text style={styles.title}>Welcome to Spot the Same!</Text>
            {showSignIn ? <SignIn toggleSignIn={toggleSignIn} /> : <SignUp toggleSignIn={toggleSignIn} />}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
});
