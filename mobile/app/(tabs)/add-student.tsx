import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    SafeAreaView,
    Image,
    TextInputProps,
    Modal,
    FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { addStudent, Center, getCenters, uploadStudentPhoto } from '../../lib/api';
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useChurch } from '../../context/ChurchContext';
import { useChurchBranding } from '../../hooks/useChurchBranding';
import { getBrandPalette } from '../../lib/branding';

interface FieldProps extends Pick<TextInputProps, 'keyboardType' | 'value' | 'placeholder'> {
    label: string;
    icon: keyof typeof Feather.glyphMap;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', icon, onFocus }: FieldProps) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputShell}>
                <Feather name={icon} size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={keyboardType}
                    onFocus={onFocus}
                    autoCorrect={false}
                />
            </View>
        </View>
    );
}

export default function AddStudentScreen() {
    const { activeChurch, activeChurchId, multiTenantEnabled } = useChurch();
    const { branding } = useChurchBranding(activeChurchId);
    const palette = getBrandPalette(branding);
    const [name, setName] = useState('');
    const [selectedCenterId, setSelectedCenterId] = useState('');
    const [selectedCenterName, setSelectedCenterName] = useState('');
    const [grade, setGrade] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [dobDate, setDobDate] = useState<Date>(new Date(2015, 0, 1));
    const [draftDobDate, setDraftDobDate] = useState<Date>(new Date(2015, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [classPickerVisible, setClassPickerVisible] = useState(false);
    const [centers, setCenters] = useState<Center[]>([]);
    const scrollRef = useRef<ScrollView>(null);

    useEffect(() => {
        let active = true;

        getCenters(activeChurchId ?? undefined)
            .then((items) => {
                if (active) {
                    setCenters(items.filter((item) => item.active));
                }
            })
            .catch(() => {
                if (active) setCenters([]);
            });

        return () => {
            active = false;
        };
    }, [activeChurchId]);

    const scrollDown = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    };

    const openDobPicker = () => {
        setDraftDobDate(dobDate);
        setShowDatePicker(true);
    };

    const closeDobPicker = () => setShowDatePicker(false);

    const confirmDobPicker = () => {
        setDobDate(draftDobDate);
        const y = draftDobDate.getFullYear();
        const m = String(draftDobDate.getMonth() + 1).padStart(2, '0');
        const d = String(draftDobDate.getDate()).padStart(2, '0');
        setDob(`${y}-${m}-${d}`);
        setShowDatePicker(false);
    };

    const pickPhoto = async () => {
        Alert.alert('Profile Photo', 'Choose a source to upload a photo', [
            {
                text: 'Camera',
                onPress: async () => {
                    const { status } = await ImagePicker.requestCameraPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Camera permission is required to take a photo.');
                        return;
                    }
                    const result = await ImagePicker.launchCameraAsync({
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.7,
                    });
                    if (!result.canceled) setPhotoUri(result.assets[0].uri);
                },
            },
            {
                text: 'Gallery',
                onPress: async () => {
                    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (status !== 'granted') {
                        Alert.alert('Permission needed', 'Photo library permission is required.');
                        return;
                    }
                    const result = await ImagePicker.launchImageLibraryAsync({
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.7,
                    });
                    if (!result.canceled) setPhotoUri(result.assets[0].uri);
                },
            },
            { text: 'Cancel', style: 'cancel' },
        ]);
    };

    const removePhoto = () => setPhotoUri(null);

    const handleAdd = async () => {
        if (!name.trim() || !selectedCenterId.trim()) {
            Alert.alert('Missing Fields', 'Please fill in Name and Center.');
            return;
        }

        setLoading(true);
        try {
            let photoUrl: string | undefined;
            if (photoUri) {
                photoUrl = await uploadStudentPhoto(photoUri, name.trim());
            }

            await addStudent({
                name: name.trim(),
                grade: grade.trim(),
                centerId: selectedCenterId.trim(),
                centerName: selectedCenterName.trim(),
                phone: phone.trim(),
                dob: dob.trim(),
                ...(photoUrl ? { photoUrl } : {}),
            }, activeChurchId ?? undefined);

            Alert.alert('Student added', `${name.trim()} has been registered successfully.`);
            setName('');
            setSelectedCenterId('');
            setSelectedCenterName('');
            setGrade('');
            setPhone('');
            setDob('');
            setPhotoUri(null);
            setFeedback(`${name.trim()} has been added to ${selectedCenterName.trim() || 'the center'} successfully.`);
            setTimeout(() => setFeedback(null), 2600);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to add student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />
            <View style={[styles.hero, { backgroundColor: palette.primaryDark }]}>
                <View style={[styles.heroGlow, { backgroundColor: palette.accentSoft }]} />
                <View style={[styles.heroGlowSecondary, { backgroundColor: palette.primarySoft }]} />
                <SafeAreaView>
                    <Text style={styles.heroEyebrow}>Registration</Text>
                    <Text style={styles.heroTitle}>Add a student</Text>
                    <Text style={styles.heroSubtitle}>
                        {branding?.welcomeSubtitle || 'Capture the basics once so attendance stays fast every Sunday.'}
                    </Text>
                    {(multiTenantEnabled || activeChurch || branding?.churchDisplayName) && (
                        <View style={styles.churchPill}>
                            {branding?.logoUrl ? (
                                <Image source={{ uri: branding.logoUrl }} style={styles.churchLogo} />
                            ) : (
                                <Feather name="home" size={14} color={Colors.white} />
                            )}
                            <Text style={styles.churchPillText}>
                                {branding?.churchDisplayName || activeChurch?.name || 'Church Workspace'}
                            </Text>
                        </View>
                    )}
                </SafeAreaView>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {feedback ? (
                        <View style={[styles.feedbackBanner, Shadows.sm]}>
                            <Feather name="check-circle" size={16} color={palette.primary} />
                            <Text style={styles.feedbackText}>{feedback}</Text>
                        </View>
                    ) : null}

                    <View style={[styles.introPanel, Shadows.md]}>
                        <View style={styles.introCopy}>
                            <Text style={styles.introEyebrow}>Quick Setup</Text>
                            <Text style={styles.introTitle}>Build a clean center roster.</Text>
                            <Text style={styles.introText}>
                                Keep center assignment and grade information separate so the app stays clearer as your church grows.
                            </Text>
                        </View>
                        <View style={[styles.introBadge, { backgroundColor: palette.primarySoft }]}>
                            <Feather name="star" size={20} color={palette.primary} />
                        </View>
                    </View>

                    <View style={[styles.photoCard, Shadows.md]}>
                        <TouchableOpacity style={[styles.photoCircle, Shadows.sm]} onPress={pickPhoto} activeOpacity={0.85}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Feather name="camera" size={28} color={palette.primary} />
                                    <Text style={styles.photoHint}>Upload Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <Text style={styles.photoTitle}>Profile Photo</Text>
                        <Text style={styles.photoSubtitle}>Optional, but helpful for quick recognition during attendance.</Text>
                        <View style={styles.metaBadgeRow}>
                            <View style={[styles.metaBadge, { backgroundColor: palette.primarySoft }]}>
                                <Feather name="home" size={13} color={palette.primary} />
                                <Text style={[styles.metaBadgeText, { color: palette.primaryDark }]}>
                                    {selectedCenterName || 'Choose center'}
                                </Text>
                            </View>
                            {grade.trim() ? (
                                <View style={[styles.metaBadge, { backgroundColor: palette.accentSoft }]}>
                                    <Feather name="layers" size={13} color={palette.accent} />
                                    <Text style={[styles.metaBadgeText, { color: palette.accent }]}>
                                        {grade.trim()}
                                    </Text>
                                </View>
                            ) : null}
                        </View>
                        {photoUri && (
                            <TouchableOpacity onPress={removePhoto} style={styles.removePhotoBtn}>
                                <Feather name="trash-2" size={14} color={Colors.danger} />
                                <Text style={styles.removePhotoText}>Remove photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={[styles.card, Shadows.lg]}>
                        <View style={styles.sectionHeader}>
                            <View>
                                <Text style={styles.sectionEyebrow}>Student Details</Text>
                                <Text style={styles.sectionTitle}>Basic information</Text>
                            </View>
                            <View style={styles.sectionIconWrap}>
                                <Feather name="user-plus" size={18} color={palette.primary} />
                            </View>
                        </View>

                        <Field
                            label="Student Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Samuel Emmanuel"
                            icon="user"
                            onFocus={scrollDown}
                        />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Center</Text>
                            <TouchableOpacity
                                style={styles.inputShell}
                                onPress={() => setClassPickerVisible(true)}
                                activeOpacity={0.75}
                            >
                                <Feather name="book-open" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                                <Text style={[styles.input, styles.selectorText, !selectedCenterName && styles.selectorPlaceholder]}>
                                    {selectedCenterName || 'Select center...'}
                                </Text>
                                <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Field
                            label="Grade / Standard"
                            value={grade}
                            onChangeText={setGrade}
                            placeholder="Optional: 7th, 12th, LKG..."
                            icon="layers"
                            onFocus={scrollDown}
                        />

                        <Field
                            label="Parent's Phone"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="e.g. +91 98765 43210"
                            keyboardType="phone-pad"
                            icon="phone"
                            onFocus={scrollDown}
                        />

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Date of Birth</Text>
                            <TouchableOpacity
                                style={styles.inputShell}
                                onPress={openDobPicker}
                                activeOpacity={0.75}
                            >
                                <Feather name="calendar" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                                <Text style={[styles.input, styles.selectorText, !dob && styles.selectorPlaceholder]}>
                                    {dob || 'Select date of birth...'}
                                </Text>
                                <Feather name="chevron-down" size={18} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {showDatePicker && (
                            Platform.OS === 'ios' ? (
                                <Modal transparent animationType="slide" visible={showDatePicker} onRequestClose={closeDobPicker}>
                                    <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={closeDobPicker}>
                                        <View style={styles.pickerSheet}>
                                            <View style={styles.pickerHandle} />
                                            <Text style={styles.pickerTitle}>Choose Date of Birth</Text>
                                            <DateTimePicker
                                                value={draftDobDate}
                                                mode="date"
                                                display="spinner"
                                                maximumDate={new Date()}
                                                minimumDate={new Date(2000, 0, 1)}
                                                onChange={(_, selectedDate) => {
                                                    if (selectedDate) setDraftDobDate(selectedDate);
                                                }}
                                            />
                                            <View style={styles.pickerActions}>
                                                <TouchableOpacity style={styles.pickerGhostButton} onPress={closeDobPicker}>
                                                    <Text style={styles.pickerGhostButtonText}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.pickerPrimaryButton} onPress={confirmDobPicker}>
                                                    <Text style={styles.pickerPrimaryButtonText}>Done</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                </Modal>
                            ) : (
                                <DateTimePicker
                                    value={dobDate}
                                    mode="date"
                                    display="default"
                                    maximumDate={new Date()}
                                    minimumDate={new Date(2000, 0, 1)}
                                    onChange={(_, selectedDate) => {
                                        setShowDatePicker(false);
                                        if (selectedDate) {
                                            setDobDate(selectedDate);
                                            const y = selectedDate.getFullYear();
                                            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                            const d = String(selectedDate.getDate()).padStart(2, '0');
                                            setDob(`${y}-${m}-${d}`);
                                        }
                                    }}
                                />
                            )
                        )}

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled, Shadows.md]}
                            onPress={handleAdd}
                            disabled={loading}
                            activeOpacity={0.88}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Feather name={photoUri ? 'upload-cloud' : 'check-circle'} size={18} color={Colors.white} />
                                    <Text style={styles.buttonText}>{photoUri ? 'Save Student' : 'Register Student'}</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            <Modal visible={classPickerVisible} transparent animationType="slide" onRequestClose={() => setClassPickerVisible(false)}>
                <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setClassPickerVisible(false)}>
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerTitle}>Choose Center</Text>
                        <FlatList
                            data={centers}
                            keyExtractor={(item) => item.id}
                            numColumns={4}
                            contentContainerStyle={styles.pickerGrid}
                            columnWrapperStyle={styles.pickerRow}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.classChip, selectedCenterId === item.id && styles.classChipActive]}
                                    onPress={() => {
                                        setSelectedCenterId(item.id);
                                        setSelectedCenterName(item.name);
                                        setClassPickerVisible(false);
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[styles.classChipText, selectedCenterId === item.id && styles.classChipTextActive]}>{item.name}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    hero: {
        backgroundColor: Colors.primaryDark,
        paddingHorizontal: Spacing.lg,
        paddingTop: 14,
        paddingBottom: 28,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
    },
    heroGlow: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(229,154,47,0.18)',
        top: -70,
        right: -40,
    },
    heroGlowSecondary: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.08)',
        left: -90,
        bottom: -70,
    },
    heroEyebrow: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    heroTitle: {
        color: Colors.white,
        fontSize: 30,
        fontWeight: '800',
        letterSpacing: -0.6,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        maxWidth: 290,
    },
    churchPill: {
        marginTop: 14,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: Radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    churchLogo: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.white,
    },
    churchPillText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    scroll: {
        padding: Spacing.lg,
        paddingBottom: 40,
    },
    feedbackBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: -10,
        marginBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    feedbackText: {
        color: Colors.text,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '700',
        flex: 1,
    },
    introPanel: {
        marginTop: -18,
        marginBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 14,
    },
    introCopy: {
        flex: 1,
    },
    introEyebrow: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 6,
    },
    introTitle: {
        color: Colors.text,
        fontSize: 20,
        fontWeight: '800',
        lineHeight: 26,
    },
    introText: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        marginTop: 8,
    },
    introBadge: {
        width: 48,
        height: 48,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        alignItems: 'center',
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: -16,
        marginBottom: Spacing.md,
    },
    photoCircle: {
        width: 116,
        height: 116,
        borderRadius: 32,
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    photoPreview: { width: '100%', height: '100%' },
    photoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    photoHint: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    photoTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 4,
    },
    photoSubtitle: {
        textAlign: 'center',
        fontSize: 13,
        lineHeight: 19,
        color: Colors.textSecondary,
        maxWidth: 280,
    },
    metaBadgeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginTop: 14,
    },
    metaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Radius.pill,
    },
    metaBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    removePhotoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 14,
        backgroundColor: Colors.dangerSoft,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: Radius.pill,
    },
    removePhotoText: {
        color: Colors.danger,
        fontSize: 13,
        fontWeight: '700',
    },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    sectionEyebrow: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 4,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: '800',
    },
    sectionIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 14,
        backgroundColor: Colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
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
        minHeight: 56,
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
        color: Colors.text,
        fontSize: 16,
        paddingVertical: 16,
    },
    selectorText: {
        paddingVertical: 0,
    },
    selectorPlaceholder: {
        color: Colors.textMuted,
    },
    button: {
        minHeight: 58,
        borderRadius: Radius.lg,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    buttonDisabled: {
        backgroundColor: Colors.primaryLight,
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '800',
    },
    pickerOverlay: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'flex-end',
    },
    pickerSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: Spacing.lg,
        paddingTop: 18,
        paddingBottom: 40,
    },
    pickerHandle: {
        width: 42,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.borderStrong,
        alignSelf: 'center',
        marginBottom: 18,
    },
    pickerTitle: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 18,
    },
    pickerActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 18,
    },
    pickerGhostButton: {
        minHeight: 44,
        paddingHorizontal: 18,
        borderRadius: Radius.md,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surfaceAlt,
    },
    pickerGhostButtonText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
    },
    pickerPrimaryButton: {
        minHeight: 44,
        paddingHorizontal: 18,
        borderRadius: Radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
    },
    pickerPrimaryButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '800',
    },
    pickerGrid: {
        gap: 10,
        paddingBottom: 10,
    },
    pickerRow: {
        gap: 10,
    },
    classChip: {
        flex: 1,
        minHeight: 50,
        borderRadius: Radius.md,
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    classChipActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    classChipText: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '800',
    },
    classChipTextActive: {
        color: Colors.white,
    },
});
