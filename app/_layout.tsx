import { Slot } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
const clerkKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

const convex = new ConvexReactClient(convexUrl, {
    unsavedChangesWarning: false,
});

const tokenCache = {
    async getToken(key: string) {
        return SecureStore.getItemAsync(key);
    },
    async saveToken(key: string, value: string) {
        return SecureStore.setItemAsync(key, value);
    },
};

export default function RootLayout() {
    return (
        <ConvexProvider client={convex}>
            <ClerkProvider publishableKey={clerkKey} tokenCache={tokenCache}>
                <Slot />
            </ClerkProvider>
        </ConvexProvider>
    );
}
