import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function Index() {
    const { loading, isAuthenticated, mustChangePassword } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (isAuthenticated) {
        if (mustChangePassword) {
            return <Redirect href="/(auth)/change-password" />;
        }
        return <Redirect href="/(tabs)/attendance" />;
    }

    return <Redirect href="/(auth)/login" />;
}
