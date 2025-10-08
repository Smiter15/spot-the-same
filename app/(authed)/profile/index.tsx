import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';

export default function Profile() {
    const { signOut } = useAuth();
    const { user } = useUser();

    const handleSignOut = async () => {
        await signOut();
        router.replace('/');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            {user?.hasImage && (
                <View
                    style={{
                        width: 100,
                        height: 100,
                        borderRadius: 50,
                        overflow: 'hidden',
                        marginBottom: 20,
                    }}
                >
                    <Image source={{ uri: user?.imageUrl }} style={{ width: '100%', height: '100%' }} />
                </View>
            )}

            <Text>
                Username: {user?.username && user?.username?.charAt(0).toUpperCase() + user?.username?.slice(1)}
            </Text>
            <Text>Email: {user?.primaryEmailAddress?.emailAddress}</Text>

            <Pressable style={styles.button} onPress={handleSignOut}>
                <Text style={styles.buttonText}>Sign Out</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    button: {
        backgroundColor: 'black',
        padding: 12,
        borderRadius: 6,
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
});
