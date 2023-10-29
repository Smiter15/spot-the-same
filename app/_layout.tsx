import { Slot } from 'expo-router';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';

import { CONVEX_URL, CLERK_PUBLISHABLE_KEY } from '@env';

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <Slot />
      </ClerkProvider>
    </ConvexProvider>
  );
}
