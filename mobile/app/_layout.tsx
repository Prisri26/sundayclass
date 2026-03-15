import { Stack } from 'expo-router';
import { ChurchProvider } from '../context/ChurchContext';

export default function RootLayout() {
    return (
        <ChurchProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="spotlight" />
            </Stack>
        </ChurchProvider>
    );
}
