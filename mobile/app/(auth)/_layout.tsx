import { ActivityIndicator, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { Colors } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useChurchSelection } from '../../context/ChurchSelectionContext';

export default function AuthLayout() {
    const { loading, isAuthenticated, mustChangePassword } = useAuth();
    const { loading: churchSelectionLoading, selectedChurch } = useChurchSelection();

    if (loading || churchSelectionLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (isAuthenticated && mustChangePassword) {
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="change-password" />
            </Stack>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)/attendance" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="church-code" />
            <Stack.Screen name="login" />
            <Stack.Screen name="change-password" />
        </Stack>
    );
}
