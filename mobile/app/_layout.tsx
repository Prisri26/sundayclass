import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { ChurchProvider } from '../context/ChurchContext';
import { ChurchSelectionProvider } from '../context/ChurchSelectionContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <ChurchSelectionProvider>
                <ChurchProvider>
                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="spotlight" />
                    </Stack>
                </ChurchProvider>
            </ChurchSelectionProvider>
        </AuthProvider>
    );
}
