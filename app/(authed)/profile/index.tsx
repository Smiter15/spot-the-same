import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';

import { api } from '../../../convex/_generated/api';

import useAvatarUpload from '../../../src/hooks/useAvatarUpload';

export default function Profile() {
    const { signOut } = useAuth();
    const { user, isLoaded } = useUser();
    const syncFromClerk = useMutation(api.users.syncFromClerk);
    const { pickFromLibrary, takePhoto } = useAvatarUpload();

    const [displayName, setDisplayName] = useState<string>(user?.username || '');
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        router.replace('/');
    };

    const onSaveName = async () => {
        if (!user || busy) return;
        if (!displayName.trim()) return Alert.alert('Name required', 'Please enter a display name.');

        try {
            setBusy(true);
            // Update name in Clerk
            await user.update({ username: displayName.trim() });
            // Sync into Convex
            await syncFromClerk({ username: displayName.trim(), avatarUrl: user.imageUrl });
            Alert.alert('Saved', 'Your name has been updated.');
        } catch (e: any) {
            console.warn('Update username failed', e);
            Alert.alert('Error', 'Could not update your name. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    if (!isLoaded) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#2F80ED" />
                <Text style={{ color: '#5D6B88', marginTop: 8 }}>Loading…</Text>
            </View>
        );
    }

    return (
        <View style={styles.screen}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Your Profile</Text>
                <Text style={styles.subtitle}>Customize how you appear in games.</Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
                {/* Avatar */}
                <View style={styles.avatarWrap}>
                    <View style={styles.avatar}>
                        <Image source={{ uri: user?.imageUrl }} style={styles.avatarImg} />
                    </View>
                </View>

                <View style={styles.actionsRow}>
                    <Pressable style={styles.actionBtn} onPress={pickFromLibrary}>
                        <Text style={styles.actionText}>Choose Photo</Text>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.hollow]} onPress={takePhoto}>
                        <Text style={[styles.actionText, styles.hollowText]}>Take Photo</Text>
                    </Pressable>
                </View>

                {/* Name */}
                <View style={{ width: '100%', marginTop: 10 }}>
                    <Text style={styles.label}>Display name</Text>
                    <TextInput
                        value={displayName}
                        onChangeText={setDisplayName}
                        style={styles.input}
                        placeholder="Player name"
                        placeholderTextColor="#8FA0B6"
                        editable={!busy}
                        autoCapitalize="words"
                    />
                    <Pressable
                        style={[
                            styles.primary,
                            (busy || displayName.trim() === (user?.username || '')) && styles.primaryDisabled,
                        ]}
                        onPress={onSaveName}
                        disabled={busy || displayName.trim() === (user?.username || '')}
                    >
                        {busy ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.primaryText}>Save Changes</Text>
                        )}
                    </Pressable>
                </View>

                {/* Email (read-only) */}
                <View style={{ width: '100%', marginTop: 16 }}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.readonlyField}>
                        <Text style={styles.readonlyText}>{user?.primaryEmailAddress?.emailAddress}</Text>
                    </View>
                </View>

                {/* Sign out */}
                <Pressable
                    style={[styles.secondary, busy && styles.secondaryDisabled]}
                    onPress={handleSignOut}
                    disabled={busy}
                >
                    <Text style={styles.secondaryText}>Sign Out</Text>
                </Pressable>
            </View>
        </View>
    );
}

const WIDTH = 420;

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F8FB', paddingHorizontal: 20, paddingTop: 60 },
    loading: {
        flex: 1,
        backgroundColor: '#F6F8FB',
        alignItems: 'center',
        justifyContent: 'center',
    },

    header: { alignItems: 'center', marginBottom: 10 },
    title: { fontSize: 28, fontWeight: '900', color: '#0B1220' },
    subtitle: { marginTop: 6, fontSize: 15, color: '#5D6B88', textAlign: 'center' },

    card: {
        marginTop: 14,
        width: '100%',
        maxWidth: WIDTH,
        alignSelf: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },

    avatarWrap: { marginTop: 8, marginBottom: 12 },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#EDEFF4',
    },
    avatarImg: { width: '100%', height: '100%' },

    editBadge: {
        position: 'absolute',
        right: -6,
        bottom: -6,
        width: 42,
        height: 42,
        borderRadius: 999,
        backgroundColor: '#2F80ED',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },
    editBadgeText: { fontSize: 18, color: '#fff' },

    label: { fontSize: 13, fontWeight: '800', color: '#5D6B88', marginBottom: 6 },
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
        marginTop: 12,
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
    primaryDisabled: { opacity: 0.6 },
    primaryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },

    readonlyField: {
        height: 56,
        paddingHorizontal: 18,
        backgroundColor: '#F6F8FB',
        borderRadius: 28,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    readonlyText: { color: '#1E2A44', fontSize: 15 },

    secondary: {
        marginTop: 16,
        width: '100%',
        height: 52,
        backgroundColor: '#E4F0FF',
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryDisabled: { opacity: 0.6 },
    secondaryText: { color: '#2F80ED', fontSize: 16, fontWeight: '800' },

    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    actionBtn: {
        backgroundColor: '#2F80ED',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    hollow: {
        backgroundColor: '#E4F0FF',
    },
    hollowText: { color: '#2F80ED' },
    actionText: { color: '#fff', fontWeight: '800' },
});
