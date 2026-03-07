import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/theme';

// This is the root route ("/"). The _layout.tsx auth guard will immediately
// redirect to /(auth)/login or /(tabs)/attendance once auth state resolves.
// This screen just shows a spinner while that happens.
export default function Index() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
            <ActivityIndicator size="large" color={Colors.primary} />
        </View>
    );
}
