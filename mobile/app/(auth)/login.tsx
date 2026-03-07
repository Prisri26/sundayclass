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
import { Colors, Radius } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';

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
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <Text style={styles.iconText}>✝️</Text>
                    </View>
                    <Text style={styles.appTitle}>Sunday School</Text>
                    <Text style={styles.appSubtitle}>Attendance Manager</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Teacher Login</Text>
                    <Text style={styles.cardSubtitle}>Sign in to mark attendance</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
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

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter your password"
                            placeholderTextColor={Colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} />
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
    container: { flex: 1, backgroundColor: Colors.primary },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
    header: { alignItems: 'center', marginBottom: 36 },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconText: { fontSize: 36 },
    appTitle: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
    appSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
    cardTitle: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 4 },
    cardSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 28 },
    inputGroup: { marginBottom: 18 },
    label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8 },
    input: {
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        padding: 14,
        fontSize: 15,
        color: Colors.text,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: { backgroundColor: Colors.primaryLight },
    buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
    footer: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 32, fontSize: 13 },
});
