import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';
import { formatChurchCode } from '../../lib/churchSelection';
import { getBrandPalette } from '../../lib/branding';
import { useChurchSelection } from '../../context/ChurchSelectionContext';

export default function ChurchCodeScreen() {
  const router = useRouter();
  const { selectChurchByCode, selecting, selectedChurch } = useChurchSelection();
  const [churchCode, setChurchCode] = useState(selectedChurch?.churchCode || '');
  const [error, setError] = useState('');

  const previewPalette = useMemo(
    () =>
      getBrandPalette(
        selectedChurch
          ? {
              primaryColor: selectedChurch.primaryColor,
              secondaryColor: selectedChurch.secondaryColor,
              accentColor: selectedChurch.accentColor,
            }
          : null,
      ),
    [selectedChurch],
  );

  const formattedCode = formatChurchCode(churchCode);

  const handleContinue = async () => {
    const preview = await selectChurchByCode(formattedCode);
    if (!preview) {
      setError('We could not find a church with that code. Please check the 6-digit code and try again.');
      return;
    }

    setError('');
    router.replace('/(auth)/login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.hero, { backgroundColor: previewPalette.primaryDark }]}>
          <View style={[styles.heroGlowLarge, { backgroundColor: previewPalette.primarySoft }]} />
          <View style={[styles.heroGlowSmall, { backgroundColor: previewPalette.accentSoft }]} />
          <SafeAreaView>
            <View style={styles.heroInner}>
              <View style={styles.kickerRow}>
                <Text style={styles.kicker}>Church access</Text>
                <View style={styles.codeHintPill}>
                  <Text style={styles.codeHintText}>6-digit code</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Find your church before you sign in.</Text>
              <Text style={styles.heroCopy}>
                Enter your church code so PrayLoom can load the right name, colors, and welcome experience for your team.
              </Text>
            </View>
          </SafeAreaView>
        </View>

        <View style={[styles.card, Shadows.lg]}>
          <Text style={styles.cardTitle}>Enter Church Code</Text>
          <Text style={styles.cardSubtitle}>
            Your church admin shares this 6-digit code with teachers and members before first login.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Church Code</Text>
            <View style={styles.inputShell}>
              <Feather name="hash" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={formattedCode}
                onChangeText={(value) => {
                  setError('');
                  setChurchCode(formatChurchCode(value));
                }}
                placeholder="482913"
                placeholderTextColor={Colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {selectedChurch ? (
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <View style={[styles.previewBadge, { backgroundColor: previewPalette.primarySoft }]}>
                  {selectedChurch.logoUrl ? (
                    <Image source={{ uri: selectedChurch.logoUrl }} style={styles.previewLogo} />
                  ) : (
                    <Text style={[styles.previewInitial, { color: previewPalette.primary }]}>
                      {(selectedChurch.shortName || selectedChurch.churchDisplayName || 'C').charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.previewHeaderText}>
                  <Text style={styles.previewName}>{selectedChurch.churchDisplayName}</Text>
                  <Text style={styles.previewMeta}>Code {selectedChurch.churchCode}</Text>
                </View>
              </View>
              <Text style={styles.previewTitle}>
                {selectedChurch.welcomeTitle || `Welcome to ${selectedChurch.churchDisplayName}`}
              </Text>
              <Text style={styles.previewSubtitle}>
                {selectedChurch.welcomeSubtitle || 'A calm ministry workspace is ready for your team.'}
              </Text>
            </View>
          ) : (
            <View style={styles.helperCard}>
              <Feather name="smartphone" size={18} color={Colors.primary} />
              <Text style={styles.helperText}>Once the code is confirmed, PrayLoom will load your church branding before login.</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: previewPalette.primary }, (formattedCode.length !== 6 || selecting) && styles.buttonDisabled, Shadows.md]}
            onPress={handleContinue}
            disabled={formattedCode.length !== 6 || selecting}
            activeOpacity={0.88}
          >
            {selecting ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue to Sign In</Text>
                <Feather name="arrow-right" size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingBottom: Spacing.xl },
  hero: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 72,
    paddingBottom: 92,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    overflow: 'hidden',
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    top: -70,
    right: -80,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -30,
    left: -30,
  },
  heroInner: { gap: 12 },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.7,
    textTransform: 'uppercase',
  },
  codeHintPill: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  codeHintText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: Colors.white,
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 39,
    letterSpacing: -1,
    maxWidth: 320,
  },
  heroCopy: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 320,
  },
  card: {
    marginTop: -40,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
    color: Colors.text,
  },
  cardSubtitle: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  inputGroup: { gap: 8 },
  label: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 22,
    letterSpacing: 4,
    fontWeight: '700',
    paddingVertical: 16,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceAlt,
    padding: 16,
    gap: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLogo: {
    width: 36,
    height: 36,
    borderRadius: 12,
  },
  previewInitial: {
    fontSize: 22,
    fontWeight: '800',
  },
  previewHeaderText: { flex: 1, gap: 2 },
  previewName: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  previewMeta: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  previewTitle: {
    color: Colors.text,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
  },
  previewSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  helperCard: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: 14,
    backgroundColor: Colors.surfaceAlt,
  },
  helperText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
