import { Tabs } from 'expo-router';
import { Colors, Shadows } from '../../constants/theme';
import { View, Text, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: keyof typeof Feather.glyphMap; label: string }) {
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: Platform.OS === 'ios' ? 10 : 0 }}>
            <Feather
                name={icon}
                size={22}
                color={focused ? Colors.primary : Colors.textSecondary}
                style={{ marginBottom: 4 }}
            />
            <Text
                style={{
                    fontSize: 11,
                    fontWeight: focused ? '700' : '500',
                    color: focused ? Colors.primary : Colors.textSecondary
                }}
            >
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
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 88 : 68,
                    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
                    paddingTop: 10,
                    elevation: 16,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 10,
                },
                tabBarShowLabel: false, // We're using our custom label inside TabIcon
            }}
        >
            <Tabs.Screen
                name="attendance"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="list" label="Attendance" />,
                }}
            />
            <Tabs.Screen
                name="add-student"
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="user-plus" label="Add Student" />,
                }}
            />
        </Tabs>
    );
}
