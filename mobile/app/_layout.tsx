import { useEffect, useRef } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { View, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { Colors } from '../constants/theme';
import { ChurchProvider } from '../context/ChurchContext';

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<any>(null);
    // Track whether we've done the initial redirect to avoid re-running on tab changes
    const hasRedirected = useRef(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setInitializing(false);
            hasRedirected.current = false; // reset on auth change
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (initializing || hasRedirected.current) return;

        const rootSegment = segments[0] as string | undefined;
        const inAuthGroup = rootSegment === '(auth)';
        const inTabsGroup = rootSegment === '(tabs)';

        if (!user && !inAuthGroup) {
            hasRedirected.current = true;
            router.replace('/(auth)/login');
        } else if (user && !inTabsGroup) {
            hasRedirected.current = true;
            router.replace('/(tabs)/attendance');
        }
    }, [user, initializing, segments, router]);

    if (initializing) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <ChurchProvider>
            <Slot />
        </ChurchProvider>
    );
}
