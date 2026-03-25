import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { Colors } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useChurchSelection } from '../context/ChurchSelectionContext';

export default function Index() {
    const { loading, isAuthenticated, mustChangePassword } = useAuth();
    const { loading: churchSelectionLoading, selectedChurch } = useChurchSelection();

    if (loading || churchSelectionLoading) {
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

    return <Redirect href={selectedChurch ? "/(auth)/login" : "/(auth)/church-code"} />;
}
