import { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, KeyboardAvoidingView, Pressable } from 'react-native';
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

    if (!isLoaded) {
        return (
            <View style={styles.container}>
                <Text>Loading…</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior="padding">
            <StatusBar style="dark" />

            <Text style={styles.welcome}>Welcome!</Text>
            <Text style={styles.subtitle}>Find the match, win the round.</Text>

            <View style={{ height: 28 }} />

            <View style={styles.tabsRow}>
                <Pressable onPress={() => setShowSignIn(true)} style={styles.tabButton}>
                    <Text style={[styles.tabText, showSignIn && styles.tabTextActive]}>Sign In</Text>
                    {showSignIn && <View style={styles.tabUnderline} />}
                </Pressable>

                <Pressable onPress={() => setShowSignIn(false)} style={styles.tabButton}>
                    <Text style={[styles.tabText, !showSignIn && styles.tabTextActive]}>Sign Up</Text>
                    {!showSignIn && <View style={styles.tabUnderline} />}
                </Pressable>
            </View>

            <View style={{ height: 16 }} />

            {showSignIn ? <SignIn /> : <SignUp />}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F8FB',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22,
    },
    appTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#0B1220',
    },
    welcome: {
        fontSize: 40,
        lineHeight: 44,
        fontWeight: '900',
        color: '#0B1220',
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 8,
        fontSize: 16,
        color: '#5D6B88',
        textAlign: 'center',
    },
    tabsRow: {
        width: '100%',
        maxWidth: 420,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingHorizontal: 8,
    },
    tabButton: {
        paddingBottom: 8,
        width: '50%',
        alignItems: 'center',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#7A879C',
    },
    tabTextActive: {
        color: '#0B1220',
    },
    tabUnderline: {
        marginTop: 8,
        marginBottom: -8,
        height: 3,
        width: '100%',
        backgroundColor: '#2F80ED',
        borderRadius: 2,
    },
});
