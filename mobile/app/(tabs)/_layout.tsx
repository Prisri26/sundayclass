import { useEffect, useState } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { View, Text, Platform, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius, Shadows } from '../../constants/theme';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useChurch } from '../../context/ChurchContext';
import { useChurchBranding } from '../../hooks/useChurchBranding';
import { getBrandPalette } from '../../lib/branding';

function TabIcon({
    focused,
    icon,
    label,
    activeColor,
    inactiveColor,
}: {
    focused: boolean;
    icon: keyof typeof Feather.glyphMap;
    label: string;
    activeColor: string;
    inactiveColor: string;
}) {
    return (
        <View style={styles.tabIconWrap}>
            <View style={[styles.iconShell, focused && { backgroundColor: activeColor }]}>
                <Feather
                    name={icon}
                    size={18}
                    color={focused ? Colors.white : Colors.textSecondary}
                />
            </View>
            <Text style={[styles.tabLabel, { color: focused ? activeColor : inactiveColor }]}>{label}</Text>
        </View>
    );
}

export default function TabsLayout() {
    const { activeChurchId, activeMembership, loading, multiTenantEnabled } = useChurch();
    const { branding } = useChurchBranding(activeChurchId);
    const palette = getBrandPalette(branding);
    const [initializing, setInitializing] = useState(true);
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
            setUser(nextUser);
            setInitializing(false);
        });

        return unsubscribe;
    }, []);

    if (initializing || loading) {
        return (
            <View style={styles.loadingWrap}>
                <ActivityIndicator size="large" color={palette.primary} />
            </View>
        );
    }

    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    if (multiTenantEnabled && !activeMembership) {
        return (
            <View style={styles.emptyWrap}>
                <View style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>No church access linked yet</Text>
                    <Text style={styles.emptyText}>
                        Ask your church admin to add your UID in the members list before using the app.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                sceneStyle: styles.sceneStyle,
                tabBarStyle: [styles.tabBar, { borderColor: palette.primarySoft, backgroundColor: Colors.white }],
                tabBarBackground: () => (
                    <View style={styles.tabBarBackground}>
                        <View style={[styles.tabBarGlow, { backgroundColor: palette.primarySoft }]} />
                    </View>
                ),
                tabBarItemStyle: styles.tabBarItem,
                tabBarShowLabel: false,
            }}
        >
            <Tabs.Screen
                name="attendance"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="check-square" label="Attendance" activeColor={palette.primary} inactiveColor={Colors.textSecondary} />,
                }}
            />
            <Tabs.Screen
                name="add-student"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="user-plus" label="Students" activeColor={palette.primary} inactiveColor={Colors.textSecondary} />,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    sceneStyle: {
        backgroundColor: Colors.background,
    },
    loadingWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    emptyWrap: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: Colors.background,
    },
    emptyCard: {
        width: '100%',
        maxWidth: 420,
        padding: 24,
        borderRadius: Radius.lg,
        backgroundColor: Colors.surface,
        ...Shadows.md,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    tabBar: {
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: 14,
        height: Platform.OS === 'ios' ? 84 : 72,
        paddingBottom: Platform.OS === 'ios' ? 13 : 10,
        paddingTop: 10,
        borderTopWidth: 0,
        borderWidth: 1,
        borderRadius: 30,
        overflow: 'hidden',
        ...Shadows.lg,
    },
    tabBarBackground: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.96)',
    },
    tabBarGlow: {
        position: 'absolute',
        width: 180,
        height: 80,
        borderRadius: 40,
        top: -18,
        left: 16,
        opacity: 0.7,
    },
    tabBarItem: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabIconWrap: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        minWidth: 90,
        marginTop: Platform.OS === 'ios' ? 2 : 0,
    },
    iconShell: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surfaceAlt,
    },
    tabLabel: {
        fontSize: 12,
        lineHeight: 15,
        fontWeight: '700',
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
