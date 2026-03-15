import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    StatusBar,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { setSpotlight, uploadStudentPhoto, clearSpotlight } from '../lib/api';
import { Colors, Radius, Shadows } from '../constants/theme';
import { useChurch } from '../context/ChurchContext';
import { useChurchBranding } from '../hooks/useChurchBranding';
import { getBrandPalette } from '../lib/branding';

export default function SpotlightScreen() {
    const { studentId, studentName, churchId } = useLocalSearchParams<{ studentId: string; studentName: string; churchId?: string }>();
    const router = useRouter();
    const { activeChurchId } = useChurch();
    const scopedChurchId = churchId ?? activeChurchId ?? undefined;
    const { branding } = useChurchBranding(scopedChurchId);
    const palette = getBrandPalette(branding);

    const [permission, requestPermission] = useCameraPermissions();
    const [capturing, setCapturing] = useState(false);
    const [done, setDone] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [started, setStarted] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    useEffect(() => {
        if (permission?.granted && !started && !done) {
            setStarted(true);
            let count = 3;
            setCountdown(3);

            countdownRef.current = setInterval(() => {
                count -= 1;
                setCountdown(count);
                if (count <= 0) {
                    clearInterval(countdownRef.current!);
                    capturePhoto();
                }
            }, 1000);
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [permission?.granted]);

    const capturePhoto = async () => {
        if (!cameraRef.current || capturing || done) return;
        setCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.75, base64: false });
            if (!photo?.uri) throw new Error('No photo');
            const url = await uploadStudentPhoto(photo.uri, studentName ?? 'Student');
            await setSpotlight(studentId ?? '', studentName ?? '', url, scopedChurchId);
            setDone(true);
        } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Failed. Try again.', [
                { text: 'Retry', onPress: retake },
                { text: 'Back', onPress: () => router.back() },
            ]);
        } finally {
            setCapturing(false);
        }
    };

    const retake = () => {
        setDone(false);
        setStarted(false);
        setCountdown(3);
    };

    const handleClear = async () => {
        await clearSpotlight(scopedChurchId);
        router.back();
    };

    if (!permission) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionScreen}>
                    <View style={[styles.permissionCard, Shadows.lg]}>
                    <View style={[styles.permissionIconWrap, { backgroundColor: palette.primarySoft }]}>
                        <Feather name="camera-off" size={28} color={palette.primary} />
                    </View>
                    <Text style={styles.permissionTitle}>Camera permission needed</Text>
                    <Text style={styles.permissionText}>Allow camera access so we can capture the student spotlight photo.</Text>
                    <TouchableOpacity style={[styles.permissionButton, { backgroundColor: palette.primary }]} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Grant Permission</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="black" />

            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="front"
            />

            <View style={styles.overlayTop}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.85}>
                    <Feather name="arrow-left" size={20} color={Colors.white} />
                </TouchableOpacity>

                <View style={[styles.headerCard, Shadows.md, { borderColor: palette.primarySoft }]}>
                    <View style={styles.headerTopRow}>
                        <View>
                            <Text style={styles.headerEyebrow}>Spotlight Capture</Text>
                            <Text style={styles.headerTitle}>{studentName}</Text>
                        </View>
                        <View style={[styles.headerStatusPill, { backgroundColor: palette.primarySoft }]}>
                            <View style={[styles.headerStatusDot, { backgroundColor: palette.accent }]} />
                            <Text style={[styles.headerStatusText, { color: Colors.white }]}>Camera live</Text>
                        </View>
                    </View>
                    <Text style={styles.headerSubtitle}>{branding?.welcomeSubtitle || 'Take a clean portrait and send it to the live spotlight screen.'}</Text>
                </View>
            </View>

            <View style={styles.focusFrameWrap}>
                <View style={styles.focusFrame}>
                    <View style={styles.focusCornerTopLeft} />
                    <View style={styles.focusCornerTopRight} />
                    <View style={styles.focusCornerBottomLeft} />
                    <View style={styles.focusCornerBottomRight} />
                    <Text style={styles.focusText}>Center face here</Text>
                </View>
            </View>

            <View style={styles.overlayBottom}>
                {done ? (
                    <View style={[styles.bottomCard, Shadows.lg]}>
                        <View style={[styles.doneBadge, { backgroundColor: palette.primary }]}>
                            <Feather name="check" size={24} color={Colors.white} />
                        </View>
                        <Text style={styles.doneTitle}>Spotlight updated</Text>
                        <Text style={styles.doneText}>The student is now ready for the screen display.</Text>
                        <View style={styles.doneActions}>
                            <TouchableOpacity style={[styles.secondaryButton, { borderColor: palette.primarySoft }]} onPress={retake} activeOpacity={0.85}>
                                <Feather name="refresh-cw" size={16} color={palette.primary} />
                                <Text style={styles.secondaryButtonText}>Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dangerButton} onPress={handleClear} activeOpacity={0.85}>
                                <Feather name="x-circle" size={16} color={Colors.white} />
                                <Text style={styles.dangerButtonText}>Clear</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : capturing ? (
                    <View style={[styles.bottomCard, Shadows.lg]}>
                        <ActivityIndicator size="large" color={Colors.white} />
                        <Text style={styles.captureTitle}>Uploading spotlight photo</Text>
                        <Text style={styles.captureText}>Please hold steady while we send the image.</Text>
                    </View>
                ) : (
                    <View style={[styles.bottomCard, Shadows.lg]}>
                        <Text style={styles.countdownLabel}>Auto capture begins in</Text>
                        <View style={[styles.countdownCircle, { borderColor: palette.primarySoft }]}>
                            <Text style={styles.countdownNumber}>{countdown > 0 ? countdown : '...'}</Text>
                        </View>
                        <View style={styles.captureHintRow}>
                            <View style={[styles.captureHintChip, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                                <Feather name="user" size={13} color={Colors.white} />
                                <Text style={styles.captureHintText}>Single portrait</Text>
                            </View>
                            <View style={[styles.captureHintChip, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
                                <Feather name="sun" size={13} color={Colors.white} />
                                <Text style={styles.captureHintText}>Good light</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: palette.primary }]}
                            onPress={() => {
                                if (countdownRef.current) clearInterval(countdownRef.current);
                                capturePhoto();
                            }}
                            activeOpacity={0.88}
                        >
                            <Feather name="camera" size={16} color={Colors.white} />
                            <Text style={styles.primaryButtonText}>Capture Now</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    centerScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    permissionScreen: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        padding: 24,
    },
    permissionCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radius.xl,
        padding: 28,
        alignItems: 'center',
    },
    permissionIconWrap: {
        width: 66,
        height: 66,
        borderRadius: 22,
        backgroundColor: Colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    permissionTitle: {
        color: Colors.text,
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    permissionText: {
        color: Colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 20,
    },
    permissionButton: {
        backgroundColor: Colors.primary,
        minHeight: 52,
        paddingHorizontal: 22,
        borderRadius: Radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    permissionButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '800',
    },
    overlayTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: 58,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.38)',
        marginBottom: 16,
    },
    headerCard: {
        backgroundColor: 'rgba(10,20,36,0.62)',
        borderRadius: Radius.xl,
        padding: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10,
    },
    headerEyebrow: {
        color: 'rgba(255,255,255,0.72)',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
    },
    headerTitle: {
        color: Colors.white,
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 6,
    },
    headerSubtitle: {
        color: 'rgba(255,255,255,0.82)',
        fontSize: 14,
        lineHeight: 20,
        marginTop: 8,
    },
    headerStatusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: Radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    headerStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    headerStatusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    focusFrameWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    focusFrame: {
        width: 230,
        height: 310,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.9)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingBottom: 16,
    },
    focusCornerTopLeft: {
        position: 'absolute',
        top: 18,
        left: 18,
        width: 34,
        height: 34,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: Colors.white,
        borderTopLeftRadius: 18,
    },
    focusCornerTopRight: {
        position: 'absolute',
        top: 18,
        right: 18,
        width: 34,
        height: 34,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: Colors.white,
        borderTopRightRadius: 18,
    },
    focusCornerBottomLeft: {
        position: 'absolute',
        bottom: 18,
        left: 18,
        width: 34,
        height: 34,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: Colors.white,
        borderBottomLeftRadius: 18,
    },
    focusCornerBottomRight: {
        position: 'absolute',
        bottom: 18,
        right: 18,
        width: 34,
        height: 34,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: Colors.white,
        borderBottomRightRadius: 18,
    },
    focusText: {
        color: Colors.white,
        fontSize: 13,
        fontWeight: '700',
        backgroundColor: 'rgba(10,20,36,0.45)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: Radius.pill,
    },
    overlayBottom: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingBottom: 34,
    },
    bottomCard: {
        backgroundColor: 'rgba(10,20,36,0.78)',
        borderRadius: Radius.xl,
        padding: 22,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    countdownLabel: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.9,
        marginBottom: 16,
    },
    countdownCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    countdownNumber: {
        color: Colors.white,
        fontSize: 38,
        fontWeight: '900',
    },
    captureHintRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 18,
    },
    captureHintChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: Radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    captureHintText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    primaryButton: {
        minHeight: 52,
        borderRadius: Radius.pill,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: 15,
        fontWeight: '800',
    },
    captureTitle: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '800',
        marginTop: 16,
        marginBottom: 6,
    },
    captureText: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
    },
    doneBadge: {
        width: 60,
        height: 60,
        borderRadius: 20,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    doneTitle: {
        color: Colors.white,
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 6,
    },
    doneText: {
        color: 'rgba(255,255,255,0.78)',
        fontSize: 14,
        lineHeight: 20,
        textAlign: 'center',
        marginBottom: 18,
    },
    doneActions: {
        flexDirection: 'row',
        gap: 10,
    },
    secondaryButton: {
        minHeight: 48,
        paddingHorizontal: 18,
        borderRadius: Radius.pill,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '800',
    },
    dangerButton: {
        minHeight: 48,
        paddingHorizontal: 18,
        borderRadius: Radius.pill,
        backgroundColor: 'rgba(217,72,95,0.94)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    dangerButtonText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '800',
    },
});
