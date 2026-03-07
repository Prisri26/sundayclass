import { Tabs } from 'expo-router';
import { Colors } from '../../constants/theme';
import { View, Text } from 'react-native';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
    return (
        <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>{icon}</Text>
            <Text style={{ fontSize: 10, color: focused ? Colors.primary : Colors.textSecondary, marginTop: 2 }}>
                {label}
            </Text>
        </View>
    );
}

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: Colors.surface,
                    borderTopColor: Colors.border,
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textSecondary,
            }}
        >
            <Tabs.Screen
                name="attendance"
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="📋" label="Attendance" />,
                }}
            />
            <Tabs.Screen
                name="add-student"
                options={{
                    tabBarLabel: '',
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="➕" label="Add Student" />,
                }}
            />
        </Tabs>
    );
}
