// app/(authed)/profile/index.tsx
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation } from 'convex/react';
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

    // keep local name in sync when the Clerk user finishes loading / changes
    useEffect(() => {
        if (user?.username != null) setDisplayName(user.username);
    }, [user?.username]);

    const handleSignOut = async () => {
        await signOut();
        router.replace('/');
    };

    const onSaveName = async () => {
        if (!user || busy) return;
        const next = displayName.trim();
        if (!next) return Alert.alert('Name required', 'Please enter a display name.');

        try {
            setBusy(true);
            await user.update({ username: next });
            await syncFromClerk({ username: next, avatarUrl: user.imageUrl });
            Alert.alert('Saved', 'Your name has been updated.');
        } catch (e: any) {
            console.warn('Update username failed', e);
            Alert.alert('Error', 'Could not update your name. Please try again.');
        } finally {
            setBusy(false);
        }
    };

    const onChoosePhoto = async () => {
        try {
            setUploading(true);
            await pickFromLibrary();
        } finally {
            setUploading(false);
        }
    };

    const onTakePhoto = async () => {
        try {
            setUploading(true);
            await takePhoto();
        } finally {
            setUploading(false);
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

    const disableActions = busy || uploading;

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

                {/* Avatar actions */}
                <View style={styles.actionsRow}>
                    <Pressable
                        style={[styles.actionBtn, disableActions && styles.actionDisabled]}
                        onPress={onChoosePhoto}
                        disabled={disableActions}
                    >
                        {uploading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.actionText}>Choose Photo</Text>
                        )}
                    </Pressable>

                    <Pressable
                        style={[styles.actionBtnHollow, disableActions && styles.actionDisabled]}
                        onPress={onTakePhoto}
                        disabled={disableActions}
                    >
                        <Text style={styles.actionTextHollow}>Take Photo</Text>
                    </Pressable>
                </View>

                {/* Name */}
                <View style={{ width: '100%', marginTop: 14 }}>
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

                {/* Email (read-only, no pill) */}
                <View style={{ width: '100%', marginTop: 18 }}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.readonlyPlain}>{user?.primaryEmailAddress?.emailAddress}</Text>
                </View>
            </View>

            {/* Footer: Sign out link at bottom */}
            <Pressable style={styles.signOut} onPress={handleSignOut} disabled={disableActions}>
                <Text style={[styles.signOutText, disableActions && { opacity: 0.6 }]}>Sign Out</Text>
            </Pressable>
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

    // Read-only email (plain text, not a pill)
    readonlyPlain: { color: '#1E2A44', fontSize: 15, fontWeight: '600' },

    // Avatar actions
    actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    actionBtn: {
        backgroundColor: '#2F80ED',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        minWidth: 140,
        alignItems: 'center',
    },
    actionBtnHollow: {
        backgroundColor: '#E4F0FF',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        minWidth: 140,
        alignItems: 'center',
    },
    actionText: { color: '#fff', fontWeight: '800' },
    actionTextHollow: { color: '#2F80ED', fontWeight: '800' },
    actionDisabled: { opacity: 0.6 },

    // Footer sign out link
    signOut: { marginTop: 18, alignSelf: 'center' },
    signOutText: { color: '#2F80ED', fontSize: 15, fontWeight: '700' },
});
