import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';

import { useMutation } from 'convex/react';

import { api } from '../../convex/_generated/api';

export function useSyncUserToConvex() {
    const { isLoaded, isSignedIn, user } = useUser();
    const syncFromClerk = useMutation(api.users.syncFromClerk);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;
        syncFromClerk({
            username: user.username || user.fullName || user.firstName || undefined,
            avatarUrl: user.imageUrl,
        }).catch(() => {});
    }, [isLoaded, isSignedIn, user?.id]);
}
