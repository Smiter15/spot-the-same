import * as ImagePicker from 'expo-image-picker';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/clerk-expo';
import { Alert, Platform } from 'react-native';

type RNFile = { uri: string; name: string; type: string };

function toRNFile(uri: string, mime?: string): RNFile {
    const type = mime || (uri.endsWith('.png') ? 'image/png' : uri.match(/\.jpe?g$/i) ? 'image/jpeg' : 'image/*');
    return { uri, name: 'avatar.jpg', type };
}

export default function useAvatarUpload() {
    const { user } = useUser();
    const syncFromClerk = useMutation(api.users.syncFromClerk);

    const uploadToClerk = async (uri: string, mime?: string) => {
        if (!user) return;
        await user.setProfileImage({
            file: toRNFile(uri, mime) as unknown as Blob, // satisfy TS
        });
        await user.reload();
        await syncFromClerk({ avatarUrl: user.imageUrl });
    };

    const pickFromLibrary = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow photo library access to pick an avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.9,
        });
        if (result.canceled) return;

        const asset = result.assets[0];
        await uploadToClerk(asset.uri, asset.mimeType);
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow camera access to take a photo.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: Platform.select({ ios: 0.8, android: 0.7, default: 0.8 }),
        });
        if (result.canceled) return;

        const asset = result.assets[0];
        await uploadToClerk(asset.uri, asset.mimeType);
    };

    return { pickFromLibrary, takePhoto };
}
