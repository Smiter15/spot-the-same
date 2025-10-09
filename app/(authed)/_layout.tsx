import { Redirect, Tabs } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

import { useSyncUserToConvex } from '../../src/hooks/useSyncUserToConvex';

export default function AuthedLayout() {
    const { isLoaded, isSignedIn } = useUser();

    if (!isLoaded) return null;
    if (!isSignedIn) return <Redirect href="/" />;

    // Sync Clerk → Convex (name + avatar) once per session for the signed-in user
    useSyncUserToConvex();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: 'black',
                tabBarInactiveTintColor: '#999',
            }}
        >
            <Tabs.Screen
                name="lobby/index"
                options={{
                    title: 'Lobby',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="game-controller-outline" color={color} size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
                }}
            />
            {/* Hide extra routes from the tab bar */}
            <Tabs.Screen name="lobby/create" options={{ href: null }} />
            <Tabs.Screen name="lobby/join" options={{ href: null }} />
        </Tabs>
    );
}
