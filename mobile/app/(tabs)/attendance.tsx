import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    Animated,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    SafeAreaView,
    TextInput,
    Platform,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { auth } from '../../lib/firebase';
import { subscribeStudents, saveAttendance, Student, getStudentCenterLabel } from '../../lib/api';
import { Colors, Radius, Shadows, Spacing } from '../../constants/theme';
import { useChurch } from '../../context/ChurchContext';
import { useChurchBranding } from '../../hooks/useChurchBranding';
import { getBrandPalette } from '../../lib/branding';

type AttendanceMap = Record<string, 'present' | 'absent'>;

const HERO_MAX_HEIGHT = 292;
const HERO_MIN_HEIGHT = 114;

function isBirthdayComingUp(dobStr?: string): boolean {
    if (!dobStr) return false;
    const parts = dobStr.split('-');
    if (parts.length !== 3) return false;

    const birthMonth = parseInt(parts[1], 10);
    const birthDay = parseInt(parts[2], 10);
    const today = new Date();

    for (let i = 0; i < 7; i += 1) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        if (checkDate.getMonth() + 1 === birthMonth && checkDate.getDate() === birthDay) {
            return true;
        }
    }

    return false;
}

function StatCard({
    label,
    value,
    tone = 'neutral',
}: {
    label: string;
    value: number;
    tone?: 'neutral' | 'present' | 'absent';
}) {
    const valueStyle = tone === 'present'
        ? styles.statValuePresent
        : tone === 'absent'
            ? styles.statValueAbsent
            : styles.statValue;

    return (
        <View style={[styles.statCard, Shadows.sm]}>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={valueStyle}>{value}</Text>
        </View>
    );
}

export default function AttendanceScreen() {
    const router = useRouter();
    const { activeChurch, activeChurchId, multiTenantEnabled } = useChurch();
    const { branding } = useChurchBranding(activeChurchId);
    const palette = getBrandPalette(branding);
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<AttendanceMap>({});
    const [summary, setSummary] = useState('');
    const [dateObj, setDateObj] = useState(new Date());
    const [draftDateObj, setDraftDateObj] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const scrollY = useRef(new Animated.Value(0)).current;

    const selectedDateString = dateObj.toISOString().split('T')[0];
    const isSunday = dateObj.getDay() === 0;

    const heroHeight = scrollY.interpolate({
        inputRange: [0, 220],
        outputRange: [HERO_MAX_HEIGHT, HERO_MIN_HEIGHT],
        extrapolate: 'clamp',
    });
    const expandedOpacity = scrollY.interpolate({
        inputRange: [0, 110, 190],
        outputRange: [1, 0.85, 0],
        extrapolate: 'clamp',
    });
    const expandedTranslateY = scrollY.interpolate({
        inputRange: [0, 220],
        outputRange: [0, -26],
        extrapolate: 'clamp',
    });
    const compactOpacity = scrollY.interpolate({
        inputRange: [90, 170, 220],
        outputRange: [0, 0.35, 1],
        extrapolate: 'clamp',
    });
    const floatingTranslateY = scrollY.interpolate({
        inputRange: [0, 220],
        outputRange: [0, -6],
        extrapolate: 'clamp',
    });

    useEffect(() => {
        const unsubscribe = subscribeStudents((data) => {
            setStudents(data);
        }, activeChurchId ?? undefined);

        return unsubscribe;
    }, [activeChurchId]);

    useEffect(() => {
        const fetchDayData = async () => {
            setLoading(true);

            try {
                const { getAttendanceByDate, getClassSummary } = await import('../../lib/api');
                const [records, sessionSummary] = await Promise.all([
                    getAttendanceByDate(selectedDateString, activeChurchId ?? undefined),
                    getClassSummary(selectedDateString, activeChurchId ?? undefined),
                ]);

                const nextMap: AttendanceMap = {};
                records.forEach((record) => {
                    nextMap[record.studentId] = record.status;
                });

                setAttendance(nextMap);
                setSummary(sessionSummary);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchDayData();
    }, [selectedDateString, activeChurchId]);

    const toggle = useCallback((id: string) => {
        setAttendance((prev) => ({
            ...prev,
            [id]: prev[id] === 'present' ? 'absent' : 'present',
        }));
    }, []);

    const onChangeDate = (_event: any, selected?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
            if (selected) {
                setDateObj(selected);
                setDraftDateObj(selected);
            }
            return;
        }

        if (selected) setDraftDateObj(selected);
    };

    const openDatePicker = () => {
        setDraftDateObj(dateObj);
        setShowPicker(true);
    };

    const closeDatePicker = () => setShowPicker(false);

    const confirmDatePicker = () => {
        setDateObj(draftDateObj);
        setShowPicker(false);
    };

    const handleSave = async () => {
        if (!isSunday) {
            Alert.alert('Not Allowed', 'Attendance can only be recorded on Sundays.');
            return;
        }

        setSaving(true);
        try {
            const { saveClassSummary } = await import('../../lib/api');
            const records = students.map((student) => ({
                studentId: student.id,
                date: selectedDateString,
                status: attendance[student.id] ?? 'absent',
            }));

            await saveAttendance(records, activeChurchId ?? undefined);
            await saveClassSummary(selectedDateString, summary.trim(), activeChurchId ?? undefined);
            setFeedback('Attendance and lesson summary were saved successfully.');
            setTimeout(() => setFeedback(null), 2600);
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

    const presentCount = useMemo(
        () => Object.values(attendance).filter((value) => value === 'present').length,
        [attendance]
    );
    const absentCount = students.length - presentCount;

    const renderItem = ({ item }: { item: Student }) => {
        const isPresent = attendance[item.id] === 'present';
        const hasBirthday = isBirthdayComingUp(item.dob);

        return (
            <TouchableOpacity
                onPress={() => router.push({ pathname: '/spotlight', params: { studentId: item.id, studentName: item.name, churchId: activeChurchId ?? '' } } as any)}
                activeOpacity={0.92}
            >
                <View style={[styles.studentCard, Shadows.sm, hasBirthday && styles.studentCardBirthday]}>
                    <View style={styles.studentIdentity}>
                        {item.photoUrl ? (
                            <Image source={{ uri: item.photoUrl }} style={styles.avatarPhoto} />
                        ) : (
                            <View style={styles.avatarFallback}>
                                <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}

                        <View style={styles.studentMeta}>
                            <View style={styles.nameRow}>
                                <Text style={styles.studentName} numberOfLines={1}>{item.name}</Text>
                                {hasBirthday ? (
                                    <View style={styles.birthdayPill}>
                                        <Text style={styles.birthdayPillText}>Birthday</Text>
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.metaRow}>
                                <View style={styles.centerPill}>
                                    <Text style={styles.centerPillText}>{getStudentCenterLabel(item)}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.spotlightHint}
                                    onPress={() => router.push({ pathname: '/spotlight', params: { studentId: item.id, studentName: item.name, churchId: activeChurchId ?? '' } } as any)}
                                >
                                    <Feather name="camera" size={12} color={Colors.primary} />
                                    <Text style={styles.spotlightHintText}>Spotlight</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actionsRow}>
                        <TouchableOpacity
                            style={[
                                styles.statusButton,
                                isPresent ? styles.statusButtonPresent : styles.statusButtonAbsent,
                            ]}
                            onPress={(e) => {
                                e.stopPropagation?.();
                                toggle(item.id);
                            }}
                            activeOpacity={0.88}
                        >
                            <Feather
                                name={isPresent ? 'check-circle' : 'x-circle'}
                                size={17}
                                color={isPresent ? Colors.present : Colors.absent}
                            />
                            <Text style={[styles.statusText, isPresent ? styles.statusTextPresent : styles.statusTextAbsent]}>
                                {isPresent ? 'Present' : 'Absent'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <Animated.View style={[styles.hero, { backgroundColor: palette.primaryDark, height: heroHeight }]}>
                <View style={[styles.heroGlow, { backgroundColor: palette.accentSoft }]} />
                <View style={[styles.heroGlowSecondary, { backgroundColor: palette.primarySoft }]} />

                <SafeAreaView style={styles.heroSafeArea}>
                    <Animated.View style={[styles.heroCompactBar, { opacity: compactOpacity }]}>
                        <View style={styles.heroCompactIdentity}>
                            {branding?.logoUrl ? (
                                <Image source={{ uri: branding.logoUrl }} style={styles.heroCompactLogo} />
                            ) : (
                                <View style={[styles.heroCompactLogoFallback, { backgroundColor: palette.primarySoft }]}>
                                    <Feather name="home" size={15} color={Colors.white} />
                                </View>
                            )}

                            <View>
                                <Text style={styles.heroCompactTitle}>Sunday Register</Text>
                                <Text style={styles.heroCompactSubtitle}>
                                    {branding?.churchDisplayName || activeChurch?.name || 'Church Workspace'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={[styles.heroCompactAction, { backgroundColor: palette.primarySoft }]} onPress={handleLogout} activeOpacity={0.82}>
                            <Feather name="log-out" size={17} color={Colors.white} />
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View style={[styles.heroExpanded, { opacity: expandedOpacity, transform: [{ translateY: expandedTranslateY }] }]}>
                        <View style={styles.heroTopRow}>
                            <View style={styles.heroCopy}>
                                <Text style={styles.heroEyebrow}>Attendance</Text>
                                <Text style={styles.heroTitle}>PrayLoom Register</Text>
                                <Text style={styles.heroSubtitle}>
                                    {branding?.welcomeSubtitle || 'Mark attendance, capture the lesson, and steward every center with clarity.'}
                                </Text>

                                {(multiTenantEnabled || activeChurch || branding?.churchDisplayName) ? (
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
                                ) : null}

                                <View style={styles.heroSignalRow}>
                                    <View style={styles.heroSignalCard}>
                                        <Text style={styles.heroSignalLabel}>Session</Text>
                                        <Text style={styles.heroSignalValue}>{isSunday ? 'Open' : 'Standby'}</Text>
                                    </View>
                                    <View style={[styles.heroSignalCard, styles.heroSignalCardMuted]}>
                                        <Text style={styles.heroSignalLabel}>Roster</Text>
                                        <Text style={styles.heroSignalValue}>{students.length}</Text>
                                    </View>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.heroIconButton, { backgroundColor: palette.primarySoft }]} onPress={handleLogout} activeOpacity={0.82}>
                                <Feather name="log-out" size={20} color={Colors.white} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </Animated.View>

            {showPicker ? (
                Platform.OS === 'ios' ? (
                    <Modal transparent animationType="slide" visible={showPicker} onRequestClose={closeDatePicker}>
                        <View style={styles.pickerOverlay}>
                            <View style={styles.pickerSheet}>
                                <View style={styles.pickerHandle} />
                                <Text style={styles.pickerTitle}>Choose Sunday</Text>
                                <DateTimePicker value={draftDateObj} mode="date" display="spinner" onChange={onChangeDate} />
                                <View style={styles.pickerActions}>
                                    <TouchableOpacity style={styles.pickerGhostButton} onPress={closeDatePicker}>
                                        <Text style={styles.pickerGhostButtonText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.pickerPrimaryButton} onPress={confirmDatePicker}>
                                        <Text style={styles.pickerPrimaryButtonText}>Done</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                ) : (
                    <DateTimePicker value={dateObj} mode="date" display="default" onChange={onChangeDate} />
                )
            ) : null}

            <Animated.ScrollView
                style={styles.content}
                contentContainerStyle={[styles.contentInner, { paddingTop: HERO_MAX_HEIGHT + 10 }]}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                    { useNativeDriver: false }
                )}
            >
                <Animated.View style={[styles.floatingStage, { transform: [{ translateY: floatingTranslateY }] }]}>
                    <TouchableOpacity style={[styles.dateCard, Shadows.lg]} onPress={openDatePicker} activeOpacity={0.92}>
                        <View style={styles.dateCopy}>
                            <Text style={styles.dateLabel}>Selected Sunday</Text>
                            <Text style={styles.dateValue}>{selectedDateString}</Text>
                            <Text style={styles.dateCaption}>Tap to switch the service date or revisit older attendance.</Text>
                        </View>
                        <View style={[styles.dateOrb, { backgroundColor: palette.primarySoft }]}>
                            <View style={styles.dateIconWrap}>
                                <Feather name="calendar" size={18} color={palette.primaryDark} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.ribbonRow}>
                        <View style={[styles.ribbonCard, Shadows.sm]}>
                            <Text style={styles.ribbonTitle}>Today’s pulse</Text>
                            <Text style={styles.ribbonText}>
                                {presentCount > 0
                                    ? `${presentCount} students are already marked present.`
                                    : 'Start checking students in to build today’s ministry pulse.'}
                            </Text>
                        </View>
                        <View style={[styles.ribbonStatus, { backgroundColor: isSunday ? palette.accentSoft : Colors.warningSoft }]}>
                            <View style={[styles.ribbonStatusDot, { backgroundColor: isSunday ? palette.accent : Colors.warning }]} />
                            <Text style={[styles.ribbonStatusText, { color: isSunday ? palette.accent : Colors.warning }]}>
                                {isSunday ? 'Live Sunday' : 'Locked'}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {!isSunday ? (
                    <View style={[styles.warningCard, Shadows.sm]}>
                        <Feather name="alert-triangle" size={16} color={Colors.warning} />
                        <Text style={styles.warningText}>Attendance is currently limited to Sundays.</Text>
                    </View>
                ) : null}

                {feedback ? (
                    <View style={[styles.feedbackBanner, Shadows.sm]}>
                        <Feather name="check-circle" size={16} color={palette.primary} />
                        <Text style={styles.feedbackText}>{feedback}</Text>
                    </View>
                ) : null}

                <View style={styles.statsRow}>
                    <StatCard label="Students" value={students.length} />
                    <StatCard label="Present" value={presentCount} tone="present" />
                    <StatCard label="Absent" value={absentCount} tone="absent" />
                </View>

                <View style={[styles.summaryCard, Shadows.md]}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionCopy}>
                            <Text style={styles.sectionEyebrow}>Lesson Note</Text>
                            <Text style={styles.sectionTitle}>Today’s summary</Text>
                            <Text style={styles.sectionCaption}>Capture the memory verse, lesson focus, or key moments for later reporting.</Text>
                        </View>

                        <View style={[styles.summaryIconWrap, { backgroundColor: palette.primarySoft }]}>
                            <Feather name="edit-3" size={16} color={palette.primary} />
                        </View>
                    </View>

                    <TextInput
                        style={styles.summaryInput}
                        placeholder="Write a short note about the lesson, memory verse, or activity."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        numberOfLines={4}
                        value={summary}
                        onChangeText={setSummary}
                        editable={isSunday}
                    />
                </View>

                <View style={[styles.studentsSection, Shadows.md]}>
                    <View style={styles.studentsHeader}>
                        <View style={styles.sectionCopy}>
                            <Text style={styles.sectionEyebrow}>Roster</Text>
                            <Text style={styles.sectionTitle}>Students</Text>
                            <Text style={styles.sectionCaption}>Tap a student card for spotlight, then toggle attendance in one quick move.</Text>
                        </View>

                        <View style={styles.studentsCountPill}>
                            <Text style={styles.studentsCountText}>{students.length}</Text>
                        </View>
                    </View>

                    {loading ? (
                        <View style={styles.centerState}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.stateTitle}>Loading students</Text>
                            <Text style={styles.stateSubtitle}>Pulling the latest Sunday class register.</Text>
                        </View>
                    ) : students.length === 0 ? (
                        <View style={styles.centerState}>
                            <View style={styles.emptyIconWrap}>
                                <Feather name="users" size={28} color={Colors.primary} />
                            </View>
                            <Text style={styles.stateTitle}>No students yet</Text>
                            <Text style={styles.stateSubtitle}>Open the Add Student tab to build your class roster.</Text>
                        </View>
                    ) : (
                        <View style={styles.listContent}>
                            {students.map((item) => (
                                <View key={item.id}>
                                    {renderItem({ item })}
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Animated.ScrollView>

            {students.length > 0 && isSunday ? (
                <View style={styles.footerWrap}>
                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled, Shadows.lg]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.9}
                    >
                        {saving ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                <Feather name="save" size={18} color={Colors.white} />
                                <Text style={styles.saveButtonText}>Save Attendance</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    hero: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 3,
        paddingHorizontal: Spacing.lg,
        borderBottomLeftRadius: 26,
        borderBottomRightRadius: 26,
        overflow: 'hidden',
    },
    heroSafeArea: {
        flex: 1,
    },
    heroGlow: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        top: -90,
        right: -100,
    },
    heroGlowSecondary: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        left: -100,
        bottom: -80,
    },
    heroCompactBar: {
        minHeight: 60,
        paddingTop: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    heroCompactIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    heroCompactLogo: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: Colors.white,
    },
    heroCompactLogoFallback: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCompactTitle: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '800',
    },
    heroCompactSubtitle: {
        color: 'rgba(255,255,255,0.76)',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    heroCompactAction: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroExpanded: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingTop: 6,
        paddingBottom: 18,
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    heroCopy: {
        flex: 1,
    },
    heroEyebrow: {
        color: 'rgba(255,255,255,0.76)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.1,
        marginBottom: 4,
    },
    heroTitle: {
        color: Colors.white,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -1,
        lineHeight: 33,
    },
    heroSubtitle: {
        color: 'rgba(255,255,255,0.86)',
        fontSize: 13,
        lineHeight: 19,
        marginTop: 6,
        maxWidth: 286,
    },
    churchPill: {
        marginTop: 12,
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
    heroSignalRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    heroSignalCard: {
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: Radius.md,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    heroSignalCardMuted: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    heroSignalLabel: {
        color: 'rgba(255,255,255,0.66)',
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    heroSignalValue: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '800',
        marginTop: 4,
    },
    heroIconButton: {
        width: 42,
        height: 42,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
    },
    content: {
        flex: 1,
    },
    contentInner: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 170,
    },
    floatingStage: {
        marginBottom: Spacing.md,
    },
    dateCard: {
        backgroundColor: Colors.white,
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: 2,
    },
    dateCopy: {
        flex: 1,
        paddingRight: 14,
    },
    dateLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 4,
    },
    dateValue: {
        color: Colors.text,
        fontSize: 19,
        fontWeight: '800',
    },
    dateCaption: {
        color: Colors.textMuted,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },
    dateOrb: {
        width: 68,
        height: 68,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 16,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ribbonRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 12,
    },
    ribbonCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    ribbonTitle: {
        color: Colors.text,
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 5,
    },
    ribbonText: {
        color: Colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
    },
    ribbonStatus: {
        minWidth: 112,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    ribbonStatusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    ribbonStatusText: {
        fontSize: 12,
        fontWeight: '800',
    },
    warningCard: {
        backgroundColor: Colors.warningSoft,
        borderRadius: Radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: Spacing.md,
    },
    warningText: {
        color: Colors.warning,
        fontSize: 13,
        fontWeight: '700',
        flex: 1,
    },
    feedbackBanner: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.lg,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: Spacing.md,
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
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: 24,
        paddingHorizontal: 14,
        paddingVertical: 18,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    statLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 10,
    },
    statValue: {
        color: Colors.text,
        fontSize: 28,
        fontWeight: '800',
    },
    statValuePresent: {
        color: Colors.present,
        fontSize: 28,
        fontWeight: '800',
    },
    statValueAbsent: {
        color: Colors.absent,
        fontSize: 28,
        fontWeight: '800',
    },
    summaryCard: {
        backgroundColor: Colors.surface,
        borderRadius: 28,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: Spacing.md,
    },
    sectionCopy: {
        flex: 1,
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
    sectionCaption: {
        color: Colors.textSecondary,
        fontSize: 12,
        lineHeight: 18,
        marginTop: 6,
    },
    summaryIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryInput: {
        minHeight: 120,
        borderRadius: 22,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: Colors.surfaceAlt,
        borderWidth: 1,
        borderColor: Colors.border,
        color: Colors.text,
        fontSize: 15,
        lineHeight: 22,
        textAlignVertical: 'top',
    },
    studentsSection: {
        backgroundColor: Colors.surface,
        borderRadius: 28,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    studentsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: Spacing.md,
    },
    studentsCountPill: {
        minWidth: 46,
        height: 46,
        borderRadius: 18,
        backgroundColor: Colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    studentsCountText: {
        color: Colors.primaryDark,
        fontSize: 19,
        fontWeight: '800',
    },
    centerState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
    },
    emptyIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 24,
        backgroundColor: Colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    stateTitle: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '800',
        marginTop: 12,
    },
    stateSubtitle: {
        color: Colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        maxWidth: 260,
        marginTop: 6,
    },
    listContent: {
        gap: 12,
    },
    studentCard: {
        backgroundColor: Colors.surfaceAlt,
        borderRadius: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    studentCardBirthday: {
        backgroundColor: '#FFF9EE',
        borderColor: Colors.accentLight,
    },
    studentIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    avatarPhoto: {
        width: 58,
        height: 58,
        borderRadius: 20,
    },
    avatarFallback: {
        width: 58,
        height: 58,
        borderRadius: 20,
        backgroundColor: Colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.primaryDark,
        fontSize: 20,
        fontWeight: '800',
    },
    studentMeta: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    studentName: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: '800',
        flexShrink: 1,
    },
    birthdayPill: {
        backgroundColor: Colors.accentSoft,
        borderRadius: Radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    birthdayPillText: {
        color: Colors.warning,
        fontSize: 11,
        fontWeight: '800',
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
    },
    centerPill: {
        backgroundColor: Colors.white,
        borderRadius: Radius.pill,
        paddingHorizontal: 11,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    centerPillText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
    },
    spotlightHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    spotlightHintText: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    actionsRow: {
        marginTop: 14,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    statusButton: {
        borderRadius: Radius.pill,
        paddingHorizontal: 14,
        paddingVertical: 11,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusButtonPresent: {
        backgroundColor: Colors.presentBg,
    },
    statusButtonAbsent: {
        backgroundColor: Colors.absentBg,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '800',
    },
    statusTextPresent: {
        color: Colors.present,
    },
    statusTextAbsent: {
        color: Colors.absent,
    },
    pickerOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: Colors.overlay,
    },
    pickerSheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingHorizontal: Spacing.lg,
        paddingTop: 18,
        paddingBottom: 28,
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
        marginBottom: 10,
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
    footerWrap: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: Spacing.lg,
        paddingTop: 12,
        paddingBottom: 28,
        backgroundColor: 'rgba(244,247,251,0.96)',
    },
    saveButton: {
        minHeight: 58,
        borderRadius: Radius.lg,
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '800',
    },
});
