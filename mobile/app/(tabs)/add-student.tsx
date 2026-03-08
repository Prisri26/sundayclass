import React, { useState, useRef } from 'react';
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
import { addStudent, uploadStudentPhoto } from '../../lib/api';
import { Colors, Radius, Shadows } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';

const CLASSES = ['LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

// ✅ Field defined OUTSIDE the screen component so it never remounts on re-render
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
            <View style={styles.inputWrapper}>
                <Feather name={icon} size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType={keyboardType}
                    onFocus={onFocus}
                    autoCorrect={false}
                />
            </View>
        </View>
    );
}

export default function AddStudentScreen() {
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');           // stored as YYYY-MM-DD string
    const [dobDate, setDobDate] = useState<Date>(new Date(2015, 0, 1));
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [classPickerVisible, setClassPickerVisible] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    const scrollDown = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
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
        if (!name.trim() || !studentClass.trim()) {
            Alert.alert('Missing Fields', 'Please fill in Name and Class.');
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
                class: studentClass.trim(),
                phone: phone.trim(),
                dob: dob.trim(),
                ...(photoUrl ? { photoUrl } : {}),
            });
            Alert.alert('✅ Success!', `${name.trim()} has been registered.`);
            setName('');
            setStudentClass('');
            setPhone('');
            setDob('');
            setPhotoUri(null);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to add student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header Background shape */}
            <View style={styles.headerBackgroundShape} />

            <SafeAreaView style={styles.safeArea}>
                {/* Header Context */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Add Student</Text>
                    <Text style={styles.headerSubtitle}>Register a new Sunday School member</Text>
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
                        {/* Profile Photo Section */}
                        <View style={styles.photoSection}>
                            <TouchableOpacity style={[styles.photoCircle, Shadows.md]} onPress={pickPhoto} activeOpacity={0.8}>
                                {photoUri ? (
                                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                                ) : (
                                    <View style={styles.photoPlaceholder}>
                                        <Feather name="camera" size={32} color={Colors.primary} />
                                        <Text style={styles.photoHint}>Upload</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                            {photoUri && (
                                <TouchableOpacity onPress={removePhoto} style={styles.removePhotoBtn}>
                                    <Text style={styles.removePhotoText}>✕ Remove photo</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Input Form Card */}
                        <View style={[styles.card, Shadows.lg]}>
                            <Field
                                label="Student Name"
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Samuel Emmanuel"
                                icon="user"
                                onFocus={scrollDown}
                            />
                            {/* Class Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Class Assign</Text>
                                <TouchableOpacity
                                    style={[styles.inputWrapper, { paddingVertical: 16 }]}
                                    onPress={() => setClassPickerVisible(true)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="book-open" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                                    <Text style={[styles.input, { paddingVertical: 0, color: studentClass ? Colors.text : Colors.textSecondary }]}>
                                        {studentClass ? `Class ${studentClass}` : 'Select class...'}
                                    </Text>
                                    <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <Field
                                label="Parent's Phone (optional)"
                                value={phone}
                                onChangeText={setPhone}
                                placeholder="e.g. +91 98765 43210"
                                keyboardType="phone-pad"
                                icon="phone"
                                onFocus={scrollDown}
                            />
                            {/* DOB Date Picker */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Date of Birth</Text>
                                <TouchableOpacity
                                    style={[styles.inputWrapper, { paddingVertical: 16 }]}
                                    onPress={() => setShowDatePicker(true)}
                                    activeOpacity={0.7}
                                >
                                    <Feather name="calendar" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
                                    <Text style={[styles.input, { paddingVertical: 0, color: dob ? Colors.text : Colors.textSecondary }]}>
                                        {dob ? dob : 'Select date of birth...'}
                                    </Text>
                                    <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {showDatePicker && (
                                <DateTimePicker
                                    value={dobDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    maximumDate={new Date()}
                                    minimumDate={new Date(2000, 0, 1)}
                                    onChange={(_, selectedDate) => {
                                        setShowDatePicker(Platform.OS === 'ios');
                                        if (selectedDate) {
                                            setDobDate(selectedDate);
                                            const y = selectedDate.getFullYear();
                                            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                                            const d = String(selectedDate.getDate()).padStart(2, '0');
                                            setDob(`${y}-${m}-${d}`);
                                        }
                                    }}
                                />
                            )}

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled, Shadows.sm]}
                                onPress={handleAdd}
                                disabled={loading}
                                activeOpacity={0.85}
                            >
                                {loading ? (
                                    <ActivityIndicator color={Colors.white} />
                                ) : (
                                    <>
                                        <Feather name={photoUri ? "upload-cloud" : "user-plus"} size={20} color={Colors.white} style={{ marginRight: 8 }} />
                                        <Text style={styles.buttonText}>
                                            {photoUri ? 'Save & Upload' : 'Register Student'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            {/* Class Picker Modal */}
            <Modal visible={classPickerVisible} transparent animationType="slide" onRequestClose={() => setClassPickerVisible(false)}>
                <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setClassPickerVisible(false)}>
                    <View style={styles.pickerSheet}>
                        <View style={styles.pickerHandle} />
                        <Text style={styles.pickerTitle}>Select Class</Text>
                        <FlatList
                            data={CLASSES}
                            keyExtractor={item => item}
                            numColumns={4}
                            contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
                            columnWrapperStyle={{ gap: 10 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.classChip, studentClass === item && styles.classChipActive]}
                                    onPress={() => { setStudentClass(item); setClassPickerVisible(false); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.classChipText, studentClass === item && styles.classChipTextActive]}>{item}</Text>
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
    safeArea: { flex: 1 },
    headerBackgroundShape: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 250,
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 36,
        paddingBottom: 20,
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 6, fontWeight: '500' },
    scroll: { padding: 16, paddingBottom: 60 },

    // Photo
    photoSection: { alignItems: 'center', marginBottom: 28 },
    photoCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: Colors.surface,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    photoPreview: { width: '100%', height: '100%' },
    photoPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.surface,
    },
    photoHint: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    removePhotoBtn: { marginTop: 12, paddingVertical: 4, paddingHorizontal: 12, backgroundColor: Colors.absentBg, borderRadius: Radius.sm },
    removePhotoText: { color: Colors.absent, fontSize: 12, fontWeight: '700' },

    // Form
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: 28,
        marginHorizontal: 8,
    },
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
        flexDirection: 'row',
        backgroundColor: Colors.accent,
        borderRadius: Radius.md,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
    },
    buttonDisabled: { backgroundColor: Colors.accentLight },
    buttonText: { color: Colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

    // Class picker
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    pickerSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: 24,
        paddingBottom: 40,
    },
    pickerHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
    pickerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 18, textAlign: 'center' },
    classChip: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: Radius.md,
        backgroundColor: Colors.background,
        borderWidth: 1.5,
        borderColor: Colors.border,
        alignItems: 'center',
    },
    classChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    classChipText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
    classChipTextActive: { color: Colors.white },
});
