import React, { useEffect, useState } from 'react';
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
  SafeAreaView,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { updatePassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

function validatePassword(password: string) {
  if (password.length < 10) return 'Password must be at least 10 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number.';
  return null;
}

export default function ChangePasswordScreen() {
  const { user, loading, mustChangePassword } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && user && !mustChangePassword) {
      router.replace('/(tabs)/attendance');
    }
  }, [loading, mustChangePassword, router, user]);

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleSave = async () => {
    if (!user) return;
    if (password !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }

    const error = validatePassword(password);
    if (error) {
      Alert.alert('Weak password', error);
      return;
    }

    setSaving(true);
    try {
      await updatePassword(user, password);
      await setDoc(
        doc(db, 'users', user.uid),
        {
          mustChangePassword: false,
          passwordChangedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      router.replace('/(tabs)/attendance');
    } catch (err: any) {
      Alert.alert('Unable to update password', err?.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroGlowSecondary} />
        <SafeAreaView>
          <Text style={styles.heroKicker}>First-time access</Text>
          <Text style={styles.heroTitle}>Create your private password</Text>
          <Text style={styles.heroCopy}>
            This account was provisioned with a temporary password. Set a private one now before entering PrayLoom.
          </Text>
        </SafeAreaView>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Security step</Text>
        <Text style={styles.title}>Protect this member account</Text>
        <Text style={styles.copy}>
          Strong passwords help keep church attendance, members, and student data secure.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Create a new password"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Confirm your password"
            placeholderTextColor={Colors.textMuted}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Save Password</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.lg,
    paddingTop: 18,
    paddingBottom: 38,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -70,
    right: -40,
  },
  heroGlowSecondary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(209,152,98,0.18)',
    bottom: -60,
    left: -40,
  },
  heroKicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.72)',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
    color: Colors.white,
    maxWidth: 280,
  },
  heroCopy: {
    marginTop: 10,
    maxWidth: 308,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.84)',
  },
  card: {
    marginTop: -18,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.lg,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: Colors.primary,
  },
  title: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '800',
    color: Colors.text,
  },
  copy: {
    fontSize: 15,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
  },
  button: {
    marginTop: 8,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
