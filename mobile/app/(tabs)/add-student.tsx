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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addStudent, uploadStudentPhoto } from '../../lib/api';
import { Colors, Radius } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';

// ✅ Field defined OUTSIDE the screen component so it never remounts on re-render
interface FieldProps extends Pick<TextInputProps, 'keyboardType' | 'value' | 'placeholder'> {
    label: string;
    icon: string;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', icon, onFocus }: FieldProps) {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{icon}  {label}</Text>
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
    );
}

export default function AddStudentScreen() {
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [phone, setPhone] = useState('');
    const [age, setAge] = useState('');
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<ScrollView>(null);

    const scrollDown = () => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    };

    const pickPhoto = async () => {
        Alert.alert('Add Profile Photo', 'Choose a source', [
            {
                text: '📷 Camera',
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
                text: '🖼️ Gallery',
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
        if (!name.trim() || !studentClass.trim() || !phone.trim() || !age.trim()) {
            Alert.alert('Missing Fields', 'Please fill in all fields.');
            return;
        }
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum) || ageNum < 1 || ageNum > 25) {
            Alert.alert('Invalid Age', 'Please enter a valid age between 1 and 25.');
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
                age: ageNum,
                ...(photoUrl ? { photoUrl } : {}),
            });
            Alert.alert('✅ Student Added!', `${name.trim()} has been added successfully.`);
            setName('');
            setStudentClass('');
            setPhone('');
            setAge('');
            setPhotoUri(null);
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to add student. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>➕ Add Student</Text>
                <Text style={styles.headerSubtitle}>Register a new Sunday School student</Text>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    ref={scrollRef}
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Photo picker */}
                    <View style={styles.photoSection}>
                        <TouchableOpacity style={styles.photoCircle} onPress={pickPhoto} activeOpacity={0.8}>
                            {photoUri ? (
                                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                            ) : (
                                <View style={styles.photoPlaceholder}>
                                    <Text style={styles.photoCameraIcon}>📷</Text>
                                    <Text style={styles.photoHint}>Add Photo</Text>
                                    <Text style={styles.photoOptional}>(optional)</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {photoUri && (
                            <TouchableOpacity onPress={removePhoto} style={styles.removePhotoBtn}>
                                <Text style={styles.removePhotoText}>✕ Remove photo</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.card}>
                        <Field
                            label="Student Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Samuel Emmanuel"
                            icon="👤"
                            onFocus={scrollDown}
                        />
                        <Field
                            label="Class"
                            value={studentClass}
                            onChangeText={setStudentClass}
                            placeholder="e.g. Beginners / Primary / Teens"
                            icon="📚"
                            onFocus={scrollDown}
                        />
                        <Field
                            label="Parent Phone"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="e.g. +234 800 000 0000"
                            keyboardType="phone-pad"
                            icon="📞"
                            onFocus={scrollDown}
                        />
                        <Field
                            label="Age"
                            value={age}
                            onChangeText={setAge}
                            placeholder="e.g. 8"
                            keyboardType="number-pad"
                            icon="🎂"
                            onFocus={scrollDown}
                        />

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleAdd}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {photoUri ? '💾 Save Student & Upload Photo' : '💾 Save Student'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.primary,
        padding: 20,
        paddingTop: 16,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
    headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
    scroll: { padding: 16, paddingBottom: 40 },

    // Photo section
    photoSection: { alignItems: 'center', marginBottom: 20 },
    photoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    photoPreview: { width: '100%', height: '100%' },
    photoPlaceholder: {
        flex: 1,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoCameraIcon: { fontSize: 24 },
    photoHint: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: 4 },
    photoOptional: { fontSize: 10, color: Colors.textSecondary },
    removePhotoBtn: { marginTop: 8 },
    removePhotoText: { color: Colors.absent, fontSize: 13, fontWeight: '500' },

    // Form
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    inputGroup: { marginBottom: 20 },
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
        backgroundColor: Colors.accent,
        borderRadius: Radius.md,
        padding: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    buttonDisabled: { backgroundColor: Colors.accentLight },
    buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
});
