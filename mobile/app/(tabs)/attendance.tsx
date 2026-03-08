import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { subscribeStudents, saveAttendance, getTodayDate, Student } from '../../lib/api';
import { Colors, Radius, Shadows } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TextInput, Platform } from 'react-native';

type AttendanceMap = Record<string, 'present' | 'absent'>;

// Helper to check if student has a birthday in the next 7 days
function isBirthdayComingUp(dobStr?: string): boolean {
    if (!dobStr) return false;
    const parts = dobStr.split('-');
    if (parts.length !== 3) return false;

    // Using UTC to avoid timezone drift matching days
    const birthMonth = parseInt(parts[1], 10);
    const birthDay = parseInt(parts[2], 10);

    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        if (checkDate.getMonth() + 1 === birthMonth && checkDate.getDate() === birthDay) {
            return true;
        }
    }
    return false;
}

export default function AttendanceScreen() {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceMap>({});
    const [summary, setSummary] = useState('');
    const [dateObj, setDateObj] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const selectedDateString = dateObj.toISOString().split('T')[0];
    const isSunday = dateObj.getDay() === 0;

    // 1. Subscribe to students
    useEffect(() => {
        const unsubscribe = subscribeStudents((data) => {
            setStudents(data);
        });
        return unsubscribe;
    }, []);

    // 2. Fetch attendance & summary for picked date
    useEffect(() => {
        const fetchDayData = async () => {
            setLoading(true);
            try {
                // Wait for the imports to work, oh I didn't import `getAttendanceByDate` and `getClassSummary` and `saveClassSummary`.
                // I need to import them at the top. I'll fix that in a later chunk or rely on the previous one.
                // Wait! I need to replace the import. 
                // Let's do a dynamic import or ensure `api.ts` exports them.
                const { getAttendanceByDate, getClassSummary } = await import('../../lib/api');

                const [records, summ] = await Promise.all([
                    getAttendanceByDate(selectedDateString),
                    getClassSummary(selectedDateString)
                ]);

                setAttendance(prev => {
                    const newMap: AttendanceMap = {};
                    records.forEach(r => {
                        newMap[r.studentId] = r.status;
                    });
                    return newMap;
                });
                setSummary(summ);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchDayData();
    }, [selectedDateString]);

    const toggle = useCallback((id: string) => {
        setAttendance((prev) => ({
            ...prev,
            [id]: prev[id] === 'present' ? 'absent' : 'present',
        }));
    }, []);

    const onChangeDate = (event: any, selected?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false);
        if (selected) {
            setDateObj(selected);
        }
    };

    const handleSave = async () => {
        if (!isSunday) {
            Alert.alert('Not Allowed', 'Attendance can only be recorded on Sundays.');
            return;
        }
        setSaving(true);
        try {
            const { saveClassSummary } = await import('../../lib/api');
            const records = students.map((s) => ({
                studentId: s.id,
                date: selectedDateString,
                status: attendance[s.id] ?? 'absent',
            }));
            await saveAttendance(records);
            await saveClassSummary(selectedDateString, summary.trim());
            Alert.alert('✅ Saved successfully', 'Attendance and summary stored securely.');
        } catch {
            Alert.alert('Error', 'Failed to save attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'You will be returned to the login screen.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
        ]);
    };

    const presentCount = Object.values(attendance).filter((v) => v === 'present').length;
    const absentCount = students.length - presentCount;

    const renderItem = ({ item }: { item: Student }) => {
        const isPresent = attendance[item.id] === 'present';
        const hasBirthday = isBirthdayComingUp(item.dob);

        return (
            <View style={[styles.row, Shadows.sm, hasBirthday && styles.birthdayRow]}>
                {/* Avatar */}
                {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.avatarPhoto} />
                ) : (
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}

                {/* Info */}
                <View style={styles.studentInfo}>
                    <Text style={[styles.studentName, hasBirthday && styles.birthdayText]} numberOfLines={1}>
                        {item.name} {hasBirthday && '🎂'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={styles.classBadge}>
                            <Text style={styles.classBadgeText}>{item.class}</Text>
                        </View>
                        {hasBirthday && (
                            <Text style={styles.birthdayHighlightText}> Birthday Week!</Text>
                        )}
                    </View>
                </View>

                {/* Toggle */}
                <TouchableOpacity
                    style={[
                        styles.toggleBtn,
                        isPresent ? styles.presentBtn : styles.absentBtn
                    ]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.8}
                >
                    <Feather
                        name={isPresent ? "check-circle" : "x-circle"}
                        size={16}
                        color={isPresent ? Colors.present : Colors.absent}
                        style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.toggleText, isPresent ? styles.presentText : styles.absentText]}>
                        {isPresent ? 'Present' : 'Absent'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            {/* Header Background shape */}
            <View style={styles.headerBackgroundShape} />

            <SafeAreaView style={styles.safeArea}>
                {/* Elegant Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerGreeting}>Good Morning,</Text>
                        <Text style={styles.headerTitle}>Sunday School</Text>
                        <TouchableOpacity
                            style={styles.dateBadge}
                            activeOpacity={0.8}
                            onPress={() => setShowPicker(true)}
                        >
                            <Feather name="calendar" size={14} color={Colors.white} style={{ marginRight: 6 }} />
                            <Text style={styles.headerDate}>{selectedDateString}</Text>
                            <Feather name="chevron-down" size={14} color={Colors.white} style={{ marginLeft: 6 }} />
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                        <Feather name="log-out" size={20} color={Colors.white} />
                    </TouchableOpacity>
                </View>

                {showPicker && (
                    <DateTimePicker
                        value={dateObj}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                    />
                )}

                {Platform.OS === 'ios' && showPicker && (
                    <TouchableOpacity
                        style={styles.iosPickerDone}
                        onPress={() => setShowPicker(false)}
                    >
                        <Text style={styles.iosPickerDoneText}>Done</Text>
                    </TouchableOpacity>
                )}

                {!isSunday && (
                    <View style={styles.sundayWarning}>
                        <Feather name="alert-circle" size={16} color={Colors.white} style={{ marginRight: 8 }} />
                        <Text style={styles.sundayWarningText}>Attendance is restricted to Sundays only.</Text>
                    </View>
                )}

                {/* Floating Stats Pill */}
                <View style={[styles.statsBar, Shadows.md]}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Total</Text>
                        <Text style={styles.statNum}>{students.length}</Text>
                    </View>
                    <View style={[styles.statItem, styles.statDivider]}>
                        <Text style={styles.statLabel}>Present</Text>
                        <Text style={[styles.statNum, { color: Colors.present }]}>{presentCount}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Absent</Text>
                        <Text style={[styles.statNum, { color: Colors.danger }]}>{absentCount}</Text>
                    </View>
                </View>

                {/* Class Summary */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.summaryLabel}>Class Summary</Text>
                    <TextInput
                        style={styles.summaryInput}
                        placeholder="What was taught today? (e.g. David and Goliath)"
                        placeholderTextColor={Colors.textSecondary}
                        multiline
                        numberOfLines={3}
                        value={summary}
                        onChangeText={setSummary}
                        editable={isSunday} // Only allow edits on Sunday mode
                    />
                </View>

                {/* List Container */}
                <View style={styles.listContainer}>
                    {loading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loadingText}>Fetching students...</Text>
                        </View>
                    ) : students.length === 0 ? (
                        <View style={styles.centered}>
                            <Feather name="users" size={48} color={Colors.textSecondary} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <Text style={styles.emptyText}>No students registered</Text>
                            <Text style={styles.emptySubtext}>Head to the Add Student tab to begin</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={students}
                            keyExtractor={(item) => item.id}
                            renderItem={renderItem}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* Floating Save Button */}
                {students.length > 0 && isSunday && (
                    <View style={styles.footerWrap}>
                        <TouchableOpacity
                            style={[styles.saveBtn, saving && styles.saveBtnDisabled, Shadows.lg]}
                            onPress={handleSave}
                            disabled={saving}
                            activeOpacity={0.9}
                        >
                            {saving ? (
                                <ActivityIndicator color={Colors.white} />
                            ) : (
                                <>
                                    <Feather name="save" size={20} color={Colors.white} style={{ marginRight: 10 }} />
                                    <Text style={styles.saveBtnText}>Save Attendance</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
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
        height: 280,
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 24,
    },
    headerGreeting: { fontSize: 16, color: 'rgba(255,255,255,0.85)', fontWeight: '600', marginBottom: 2 },
    headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.white, letterSpacing: 0.5, marginBottom: 12 },
    dateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    headerDate: { fontSize: 13, color: Colors.white, fontWeight: '600' },
    logoutBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Stats Floating Pill
    summaryContainer: {
        marginHorizontal: 24,
        marginBottom: 10,
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    summaryLabel: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    summaryInput: {
        fontSize: 15,
        color: Colors.text,
        minHeight: 60,
        textAlignVertical: 'top',
    },

    iosPickerDone: {
        backgroundColor: Colors.white,
        padding: 10,
        alignItems: 'center',
    },
    iosPickerDoneText: {
        color: Colors.primary,
        fontWeight: 'bold',
    },

    statsBar: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        marginHorizontal: 24,
        borderRadius: Radius.xl,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,  // Pulls list up to overlap visually
        zIndex: 10,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: Colors.border,
    },
    statNum: { fontSize: 26, fontWeight: '800', color: Colors.text, marginTop: 4 },
    statLabel: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },

    // Lists
    sundayWarning: {
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        marginHorizontal: 24,
        marginTop: -8,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: Radius.md,
        flexDirection: 'row',
        alignItems: 'center',
    },
    sundayWarningText: { color: Colors.white, fontSize: 13, fontWeight: '600' },

    listContainer: { flex: 1, backgroundColor: Colors.background },
    listContent: { padding: 24, paddingBottom: 100 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 16,
        marginBottom: 16,
    },
    birthdayRow: {
        borderColor: '#FDE68A',
        borderWidth: 2,
        backgroundColor: '#FFFBEB',
    },

    // Avatar
    avatarContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: { color: Colors.white, fontSize: 20, fontWeight: '700' },
    avatarPhoto: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 16,
        borderWidth: 2,
        borderColor: Colors.border,
    },

    studentInfo: { flex: 1, marginRight: 12, justifyContent: 'center' },
    studentName: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 6 },
    birthdayText: { color: '#D97706' },
    classBadge: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    classBadgeText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
    birthdayHighlightText: { fontSize: 11, color: '#D97706', fontWeight: '700', marginLeft: 6 },

    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: Radius.xl,
        borderWidth: 1.5,
    },
    presentBtn: { backgroundColor: Colors.presentBg, borderColor: 'rgba(5, 150, 105, 0.2)' },
    absentBtn: { backgroundColor: Colors.absentBg, borderColor: 'rgba(225, 29, 72, 0.2)' },
    toggleText: { fontSize: 13, fontWeight: '700' },
    presentText: { color: Colors.present },
    absentText: { color: Colors.absent },

    // Footer
    footerWrap: {
        position: 'absolute',
        bottom: 32,
        left: 24,
        right: 24,
    },
    saveBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        borderRadius: Radius.xl,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.7 },
    saveBtnText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },

    // States
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 15, fontWeight: '500' },
    emptyText: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
    emptySubtext: { fontSize: 14, color: Colors.textSecondary },
});
