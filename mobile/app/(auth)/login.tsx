import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Colors, Radius, Shadows } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Missing fields', 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
        } catch (err: any) {
            Alert.alert('Login Failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                {/* Header Background shape */}
                <View style={styles.headerBackgroundShape} />

                {/* Header Context */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Feather name="book-open" size={40} color={Colors.white} />
                    </View>
                    <Text style={styles.appTitle}>Sunday School</Text>
                    <Text style={styles.appSubtitle}>Attendance Manager</Text>
                </View>

                {/* Login Card */}
                <View style={[styles.card, Shadows.lg]}>
                    <Text style={styles.cardTitle}>God Bless You!</Text>
                    <Text style={styles.cardSubtitle}>Sign in to your teacher portal.</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Feather name="mail" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="teacher@church.com"
                                placeholderTextColor={Colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Feather name="lock" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={Colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled, Shadows.sm]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <Text style={styles.buttonText}>Sign In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.footer}>🙏 Serving with faith & love</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    headerBackgroundShape: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 380,
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: { alignItems: 'center', marginBottom: 40, marginTop: 40 },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    appTitle: { fontSize: 32, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
    appSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontWeight: '500' },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: 32,
        marginHorizontal: 8,
    },
    cardTitle: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    cardSubtitle: { fontSize: 15, color: Colors.textSecondary, marginBottom: 32 },
    inputGroup: { marginBottom: 20 },
    label: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: Colors.text,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        paddingVertical: 18,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonDisabled: { backgroundColor: Colors.primaryLight },
    buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    footer: { textAlign: 'center', color: Colors.textSecondary, marginTop: 40, fontSize: 13, fontWeight: '500' },
});

