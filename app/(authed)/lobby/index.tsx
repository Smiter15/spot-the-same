import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';

export default function Lobby() {
    const router = useRouter();
    const { user } = useUser();

    const goProfile = () => router.push('/(authed)/profile');
    const goCreate = () => router.push('/(authed)/lobby/create');
    const goScan = () => router.push('/(authed)/lobby/join'); // QR scanner
    const goRules = () => router.push('/(authed)/lobby/rules'); // optional
    const goEnterCode = () => router.push('/(authed)/lobby/join?mode=code'); // fallback

    const displayName = user?.username || user?.firstName || 'Player';

    return (
        <View style={styles.screen}>
            {/* Big title */}
            <Text style={styles.bigTitle}>Spot the Same!</Text>

            {/* Centered avatar + name */}
            <Pressable style={styles.centerHeader} onPress={goProfile}>
                <View style={styles.avatarWrap}>
                    {user?.imageUrl ? (
                        <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.avatar, { backgroundColor: '#EDEFF4' }]} />
                    )}
                </View>
                <Text style={styles.username}>{displayName}</Text>
            </Pressable>

            {/* Big CTAs */}
            <View style={styles.actions}>
                <Pressable style={styles.primary} onPress={goCreate}>
                    <Text style={styles.primaryText}>Create Game</Text>
                    <Text style={styles.primarySub}>Pick players & deck size</Text>
                </Pressable>

                <Pressable style={styles.secondary} onPress={goScan}>
                    <Text style={styles.secondaryText}>Scan QR to Join</Text>
                </Pressable>
            </View>

            {/* Footer helpers */}
            <View style={styles.footer}>
                <Pressable onPress={goRules}>
                    <Text style={styles.link}>How to play</Text>
                </Pressable>
                <Text style={styles.dot}>·</Text>
                <Pressable onPress={goEnterCode}>
                    <Text style={styles.link}>Have a code?</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F8FB', paddingHorizontal: 20, paddingTop: 60 },

    bigTitle: { fontSize: 36, lineHeight: 40, fontWeight: '900', color: '#0B1220', textAlign: 'center' },

    centerHeader: {
        alignItems: 'center',
        marginTop: 18,
        marginBottom: 10,
    },
    avatarWrap: {
        width: 110,
        height: 110,
        borderRadius: 999,
        overflow: 'hidden',
        borderWidth: 4,
        borderColor: '#EDEFF4',
    },
    avatar: { width: '100%', height: '100%', borderRadius: 999 },
    username: { marginTop: 10, fontSize: 18, fontWeight: '800', color: '#0B1220' },

    actions: { flex: 1, alignItems: 'stretch', justifyContent: 'center', gap: 16 },

    primary: {
        backgroundColor: '#2F80ED',
        borderRadius: 22,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#2F80ED',
        shadowOpacity: 0.25,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 10 },
    },
    primaryText: { color: '#fff', fontSize: 22, fontWeight: '900' },
    primarySub: { color: '#E6F0FF', marginTop: 6, fontSize: 15, fontWeight: '600' },

    secondary: {
        backgroundColor: '#E4F0FF',
        borderRadius: 22,
        paddingVertical: 22,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: { color: '#2F80ED', fontSize: 20, fontWeight: '900' },

    footer: {
        paddingVertical: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    link: { color: '#2F80ED', fontSize: 15, fontWeight: '700' },
    dot: { color: '#9AA6BF' },
});
