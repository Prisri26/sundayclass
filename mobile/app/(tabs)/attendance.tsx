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
import { Colors, Radius } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';

type AttendanceMap = Record<string, 'present' | 'absent'>;

export default function AttendanceScreen() {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceMap>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const today = getTodayDate();

    // Realtime listener — updates automatically when students are added/changed
    useEffect(() => {
        const unsubscribe = subscribeStudents((data) => {
            setStudents(data);
            setAttendance((prev) => {
                const merged: AttendanceMap = {};
                data.forEach((s) => {
                    merged[s.id] = prev[s.id] ?? 'absent';
                });
                return merged;
            });
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const toggle = useCallback((id: string) => {
        setAttendance((prev) => ({
            ...prev,
            [id]: prev[id] === 'present' ? 'absent' : 'present',
        }));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = students.map((s) => ({
                studentId: s.id,
                date: today,
                status: attendance[s.id] ?? 'absent',
            }));
            await saveAttendance(records);
            Alert.alert('✅ Saved!', 'Attendance has been recorded successfully.');
        } catch {
            Alert.alert('Error', 'Failed to save attendance. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Out', style: 'destructive', onPress: () => signOut(auth) },
        ]);
    };

    const presentCount = Object.values(attendance).filter((v) => v === 'present').length;
    const absentCount = students.length - presentCount;

    const renderItem = ({ item }: { item: Student }) => {
        const isPresent = attendance[item.id] === 'present';
        return (
            <View style={styles.row}>
                {/* Avatar: photo if available, else initial letter */}
                {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.avatarPhoto} />
                ) : (
                    <View style={styles.avatarContainer}>
                        <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                    </View>
                )}
                <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.name}</Text>
                    <Text style={styles.studentClass}>{item.class}</Text>
                </View>
                <TouchableOpacity
                    style={[styles.toggleBtn, isPresent ? styles.presentBtn : styles.absentBtn]}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.toggleText, isPresent ? styles.presentText : styles.absentText]}>
                        {isPresent ? '✓ Present' : '✗ Absent'}
                    </Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>📋 Attendance</Text>
                    <Text style={styles.headerDate}>{today}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statNum}>{students.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={[styles.statItem, styles.statDivider]}>
                    <Text style={[styles.statNum, { color: Colors.present }]}>{presentCount}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statNum, { color: Colors.absent }]}>{absentCount}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
            </View>

            {/* Student List */}
            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Loading students...</Text>
                </View>
            ) : students.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>👥</Text>
                    <Text style={styles.emptyText}>No students yet.</Text>
                    <Text style={styles.emptySubtext}>Add students from the ➕ tab.</Text>
                </View>
            ) : (
                <FlatList
                    data={students}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Save Button */}
            {students.length > 0 && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Text style={styles.saveBtnIcon}>💾</Text>
                                <Text style={styles.saveBtnText}>Save Attendance</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        backgroundColor: Colors.primary,
        padding: 20,
        paddingTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },
    headerDate: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
    logoutBtn: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: Radius.md,
    },
    logoutText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
    statsBar: {
        backgroundColor: Colors.surface,
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: Radius.lg,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: Colors.border,
    },
    statNum: { fontSize: 24, fontWeight: '800', color: Colors.text },
    statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    list: { padding: 16, gap: 10 },
    row: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    avatarPhoto: {
        width: 42,
        height: 42,
        borderRadius: 21,
        marginRight: 12,
    },
    avatarContainer: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: { fontSize: 16, fontWeight: '700', color: Colors.white },
    studentInfo: { flex: 1 },
    studentName: { fontSize: 15, fontWeight: '600', color: Colors.text },
    studentClass: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    toggleBtn: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: Radius.xl,
        minWidth: 96,
        alignItems: 'center',
    },
    presentBtn: { backgroundColor: Colors.presentBg },
    absentBtn: { backgroundColor: Colors.absentBg },
    toggleText: { fontSize: 12, fontWeight: '700' },
    presentText: { color: Colors.present },
    absentText: { color: Colors.absent },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    loadingText: { marginTop: 12, color: Colors.textSecondary, fontSize: 15 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 18, fontWeight: '600', color: Colors.text },
    emptySubtext: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
    footer: {
        padding: 16,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        borderRadius: Radius.md,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveBtnDisabled: { backgroundColor: Colors.primaryLight },
    saveBtnIcon: { fontSize: 18 },
    saveBtnText: { color: Colors.white, fontSize: 17, fontWeight: '700' },
});
