// app/(authed)/lobby/rules.tsx
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function Rules() {
    const router = useRouter();

    const goLobby = () => router.replace('/(authed)/lobby');
    const goCreate = () => router.push('/(authed)/lobby/create');
    const goJoin = () => router.push('/(authed)/lobby/join');

    // Example data: the shared icon is "7"
    const CARD_A = [1, 4, 7, 10];
    const CARD_B = [2, 7, 9, 12];
    const MATCH = 7;

    return (
        <View style={styles.screen}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>How to Play</Text>
                <Text style={styles.subtitle}>Find the match faster than everyone else.</Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
                {/* The Game */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>The Game</Text>
                    <Text style={styles.body}>
                        Each card has a set of icons. Any two cards share exactly one matching icon. Your goal is to
                        spot your card’s matching icon with the center card and tap it first.
                    </Text>
                </View>

                {/* Example */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Example</Text>
                    <Text style={styles.body}>These two cards share exactly one icon (highlighted).</Text>

                    <View style={styles.exampleRow}>
                        <MiniCard icons={CARD_A} highlight={MATCH} />
                        <Text style={styles.vs}>vs</Text>
                        <MiniCard icons={CARD_B} highlight={MATCH} />
                    </View>

                    <Text style={styles.caption}>Both cards contain “7” — that’s the match to tap.</Text>
                </View>

                {/* Setup */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Setup</Text>
                    <View style={styles.list}>
                        <Text style={styles.bullet}>• Create a game and choose players & deck size.</Text>
                        <Text style={styles.bullet}>• Share your QR or invite link so others can join.</Text>
                        <Text style={styles.bullet}>• When everyone’s in, the game auto-starts.</Text>
                    </View>
                </View>

                {/* How a Turn Works */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>How a Turn Works</Text>
                    <View style={styles.list}>
                        <Text style={styles.bullet}>• A center card is shown to all players.</Text>
                        <Text style={styles.bullet}>• Each player sees their own top card.</Text>
                        <Text style={styles.bullet}>
                            • Find the <Text style={styles.strong}>one</Text> icon that appears on both cards and tap
                            it.
                        </Text>
                        <Text style={styles.bullet}>
                            • First correct tap wins the turn and your card moves to the center.
                        </Text>
                        <Text style={styles.bullet}>
                            • If you tap wrong, it counts as a mistake (and you’ll hear a quack 🦆).
                        </Text>
                    </View>
                </View>

                {/* Scoring & Winning */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Scoring & Winning</Text>
                    <View style={styles.list}>
                        <Text style={styles.bullet}>• Each correct tap scores a point.</Text>
                        <Text style={styles.bullet}>• The first player to play all their cards wins.</Text>
                        <Text style={styles.bullet}>
                            • Results show points, fastest/slowest reactions, and mistakes.
                        </Text>
                    </View>
                </View>

                {/* Tips */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Tips</Text>
                    <View style={styles.list}>
                        <Text style={styles.bullet}>• Scan for shape first, then color/size.</Text>
                        <Text style={styles.bullet}>• Don’t lock in—icons can rotate or scale.</Text>
                        <Text style={styles.bullet}>• Quick but accurate beats random tapping.</Text>
                    </View>
                </View>

                {/* CTAs */}
                <View style={styles.ctaWrap}>
                    <Pressable style={styles.primary} onPress={goCreate}>
                        <Text style={styles.primaryText}>Create a Game</Text>
                    </Pressable>
                    <Pressable style={styles.secondary} onPress={goJoin}>
                        <Text style={styles.secondaryText}>Scan QR / Enter Code</Text>
                    </Pressable>
                    <Pressable style={styles.backLink} onPress={goLobby}>
                        <Text style={styles.backText}>← Back to Lobby</Text>
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

function MiniCard({ icons, highlight }: { icons: number[]; highlight?: number }) {
    return (
        <View style={styles.miniCard}>
            <View style={styles.miniGrid}>
                {icons.map((n) => {
                    const isMatch = n === highlight;
                    return (
                        <View key={n} style={[styles.iconChip, isMatch && styles.iconChipMatch]}>
                            <Text style={[styles.iconText, isMatch && styles.iconTextMatch]}>{n}</Text>
                        </View>
                    );
                })}
            </View>
        </View>
    );
}

const WIDTH = 360;

const styles = StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#F6F8FB', paddingHorizontal: 20, paddingTop: 60 },
    header: { alignItems: 'center', marginBottom: 10 },
    title: { fontSize: 32, fontWeight: '900', color: '#0B1220' },
    subtitle: { marginTop: 6, fontSize: 15, color: '#5D6B88', textAlign: 'center' },

    card: {
        marginTop: 14,
        width: '100%',
        maxWidth: WIDTH,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignSelf: 'center',
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#0B1220', marginBottom: 8 },
    body: { fontSize: 14, color: '#1E2A44', lineHeight: 20 },

    exampleRow: {
        marginTop: 10,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        justifyContent: 'center',
    },
    vs: { fontSize: 16, fontWeight: '800', color: '#5D6B88' },
    caption: { textAlign: 'center', color: '#5D6B88', fontSize: 13, marginTop: 2 },

    // Mini card
    miniCard: {
        width: 150,
        height: 110,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: '#F9FBFE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    miniGrid: {
        width: '82%',
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 10,
    },
    iconChip: {
        width: 40,
        height: 40,
        borderRadius: 999,
        backgroundColor: '#EDEFF4',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    iconChipMatch: {
        backgroundColor: '#FFF6E0',
        borderColor: '#FFC64D',
    },
    iconText: { fontWeight: '800', color: '#1E2A44' },
    iconTextMatch: { color: '#A66B00' },

    // Lists
    list: { gap: 6, marginTop: 2 },
    bullet: { fontSize: 14, color: '#1E2A44', lineHeight: 20 },
    strong: { fontWeight: '800', color: '#0B1220' },

    // CTAs
    ctaWrap: { alignItems: 'center', marginTop: 18, gap: 12 },
    primary: {
        marginTop: 6,
        width: '100%',
        maxWidth: WIDTH,
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
    primaryText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },

    secondary: {
        width: '100%',
        maxWidth: WIDTH,
        height: 52,
        backgroundColor: '#E4F0FF',
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: { color: '#2F80ED', fontSize: 16, fontWeight: '800' },

    backLink: { marginTop: 6, marginBottom: 10 },
    backText: { color: '#2F80ED', fontSize: 15, fontWeight: '700' },
});
