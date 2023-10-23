import { Slot } from 'expo-router';
// import { ClerkProvider, useAuth } from '@clerk/clerk-react';
// import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import 'react-native-get-random-values';

import { CONVEX_URL, CLERK_KEY } from '@env';

const convex = new ConvexReactClient(CONVEX_URL, {
  unsavedChangesWarning: false,
});

export default function App() {
  return (
    // <ClerkProvider publishableKey="pk_test_dW5jb21tb24tbXVza3JhdC00LmNsZXJrLmFjY291bnRzLmRldiQ">
    //   <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
    <ConvexProvider client={convex}>
      <Slot />
    </ConvexProvider>
    //   </ConvexProviderWithClerk>
    // </ClerkProvider>
  );
}
