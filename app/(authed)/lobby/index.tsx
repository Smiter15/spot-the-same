import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function Lobby() {
    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <Text style={styles.title}>Spot the Same</Text>

            <Pressable style={styles.button} onPress={() => router.replace('/lobby/create')}>
                <Text style={styles.text}>Create Game</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={() => router.replace('/lobby/join')}>
                <Text style={styles.text}>Join Game</Text>
            </Pressable>
        </View>
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        paddingVertical: 14,
        paddingHorizontal: 42,
        borderRadius: 6,
        backgroundColor: 'black',
    },
    text: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },
});
