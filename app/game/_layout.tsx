import { Stack, Redirect } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { ActivityIndicator, View } from 'react-native';

export default function GameLayout() {
    const { isLoaded, isSignedIn } = useUser();

    if (!isLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!isSignedIn) {
        return <Redirect href="/" />;
    }

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                presentation: 'fullScreenModal',
            }}
        />
    );
}
