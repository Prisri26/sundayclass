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
    Image,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useChurchBranding } from '../../hooks/useChurchBranding';
import { getBrandPalette } from '../../lib/branding';
import { getBootstrapChurchId } from '../../lib/platform';

function InputField({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    keyboardType = 'default',
}: {
    label: string;
    icon: keyof typeof Feather.glyphMap;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address';
}) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputShell}>
                <Feather name={icon} size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={secureTextEntry}
                />
            </View>
        </View>
    );
}

export default function LoginScreen() {
    const { branding } = useChurchBranding(getBootstrapChurchId());
    const palette = getBrandPalette(branding);
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
            Alert.alert('Login failed', err.message);
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
                <View style={[styles.hero, { backgroundColor: palette.primaryDark }]}>
                    <View style={[styles.heroOrbLarge, { backgroundColor: palette.primarySoft }]} />
                    <View style={[styles.heroOrbSmall, { backgroundColor: palette.accentSoft }]} />
                    <View style={[styles.heroOrbBottom, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
                    <View style={styles.logoWrap}>
                        <View style={styles.brandTopRow}>
                            <View style={styles.logoBadge}>
                                {branding?.logoUrl ? (
                                    <Image source={{ uri: branding.logoUrl }} style={styles.brandLogo} />
                                ) : (
                                    <Feather name="book-open" size={32} color={Colors.white} />
                                )}
                            </View>
                            <View style={styles.brandStatusPill}>
                                <View style={[styles.brandStatusDot, { backgroundColor: palette.accent }]} />
                                <Text style={styles.brandStatusText}>White-label ready</Text>
                            </View>
                        </View>
                        <View style={styles.logoTextWrap}>
                            <Text style={styles.eyebrow}>{branding?.shortName || 'Sunday School Platform'}</Text>
                            <Text style={styles.title}>{branding?.welcomeTitle || 'Welcome back'}</Text>
                            <Text style={styles.subtitle}>Track attendance with a calm, simple teacher workflow.</Text>
                        </View>
                        <View style={styles.heroFeatureRow}>
                            <View style={styles.heroFeatureCard}>
                                <Text style={styles.heroFeatureLabel}>Church</Text>
                                <Text style={styles.heroFeatureValue}>{branding?.churchDisplayName || branding?.shortName || 'Workspace'}</Text>
                            </View>
                            <View style={styles.heroFeatureCard}>
                                <Text style={styles.heroFeatureLabel}>Experience</Text>
                                <Text style={styles.heroFeatureValue}>Branded mobile</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={[styles.card, Shadows.lg]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Teacher Sign In</Text>
                        <Text style={styles.cardSubtitle}>Use your church account to continue.</Text>
                    </View>

                    <InputField
                        label="Email Address"
                        icon="mail"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="teacher@church.com"
                        keyboardType="email-address"
                    />

                    <InputField
                        label="Password"
                        icon="lock"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                    />

                    <View style={styles.noteRow}>
                        <Feather name="shield" size={15} color={palette.primary} />
                        <Text style={styles.noteText}>Secure access for teachers and volunteers</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: palette.primary }, loading && styles.buttonDisabled, Shadows.md]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.88}
                    >
                        {loading ? (
                            <ActivityIndicator color={Colors.white} size="small" />
                        ) : (
                            <>
                                <Text style={styles.buttonText}>Sign In</Text>
                                <Feather name="arrow-right" size={18} color={Colors.white} />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Built for {branding?.churchDisplayName || 'churches'}, teachers, and Sunday class leaders.</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { flexGrow: 1, paddingBottom: Spacing.xl },
    hero: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: Spacing.lg,
        paddingTop: 80,
        paddingBottom: 78,
        borderBottomLeftRadius: 42,
        borderBottomRightRadius: 42,
        overflow: 'hidden',
    },
    heroOrbLarge: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.08)',
        top: -40,
        right: -70,
    },
    heroOrbSmall: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(229,154,47,0.22)',
        bottom: -20,
        left: -30,
    },
    heroOrbBottom: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        bottom: -90,
        right: 50,
    },
    logoWrap: { gap: 18 },
    brandTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    logoBadge: {
        width: 68,
        height: 68,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.14)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    brandStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: Radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    brandStatusDot: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },
    brandStatusText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    brandLogo: {
        width: 52,
        height: 52,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    logoTextWrap: { gap: 6 },
    eyebrow: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    title: {
        color: Colors.white,
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.8,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.86)',
        fontSize: 15,
        lineHeight: 22,
        maxWidth: 290,
    },
    heroFeatureRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    heroFeatureCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: Radius.lg,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    heroFeatureLabel: {
        color: 'rgba(255,255,255,0.68)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroFeatureValue: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '800',
        marginTop: 6,
    },
    card: {
        marginTop: -44,
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: { marginBottom: Spacing.lg, gap: 4 },
    cardTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
    },
    cardSubtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
    inputGroup: { marginBottom: Spacing.md },
    label: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 8,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    inputShell: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radius.md,
        paddingHorizontal: 14,
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        paddingVertical: 17,
        color: Colors.text,
        fontSize: 16,
    },
    noteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: Colors.primarySoft,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: Radius.md,
        marginBottom: Spacing.lg,
    },
    noteText: {
        color: Colors.primaryDark,
        fontSize: 13,
        fontWeight: '600',
    },
    button: {
        minHeight: 58,
        borderRadius: Radius.md,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
    },
    buttonDisabled: {
        backgroundColor: Colors.primaryLight,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingTop: 22,
        alignItems: 'center',
    },
    footerText: {
        textAlign: 'center',
        color: Colors.textMuted,
        fontSize: 13,
        lineHeight: 18,
    },
});
