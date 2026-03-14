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
import { Colors } from '../constants/theme';
import { useChurch } from '../context/ChurchContext';

export default function SpotlightScreen() {
    const { studentId, studentName, churchId } = useLocalSearchParams<{ studentId: string; studentName: string; churchId?: string }>();
    const router = useRouter();
    const { activeChurchId } = useChurch();
    const scopedChurchId = churchId ?? activeChurchId ?? undefined;

    const [permission, requestPermission] = useCameraPermissions();
    const [capturing, setCapturing] = useState(false);
    const [done, setDone] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [started, setStarted] = useState(false);
    const cameraRef = useRef<CameraView>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // Request permission on mount
    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    // Auto-start countdown once camera is ready
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
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Feather name="camera-off" size={48} color={Colors.textSecondary} />
                <Text style={styles.permText}>Camera permission needed</Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
                    <Text style={styles.permBtnText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="black" />

            {/* Full-screen front camera */}
            <CameraView
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                facing="front"
            />

            {/* Dark gradient overlay at top */}
            <View style={styles.topOverlay}>
                {/* Back button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <Feather name="arrow-left" size={22} color="white" />
                </TouchableOpacity>

                {/* "Jesus Loves" heading */}
                <View style={styles.headingWrap}>
                    <Text style={styles.jesusText}>✝️  Jesus Loves</Text>
                    <Text style={styles.nameText}>{studentName}</Text>
                    <Text style={styles.mostText}>the Most! ❤️</Text>
                </View>
            </View>

            {/* Bottom overlay — countdown / done state */}
            <View style={styles.bottomOverlay}>
                {done ? (
                    /* ─── Done state ─── */
                    <View style={styles.doneWrap}>
                        <Text style={styles.doneIcon}>🎉</Text>
                        <Text style={styles.doneText}>Now showing on the screen!</Text>
                        <View style={styles.doneActions}>
                            <TouchableOpacity style={styles.retakeBtn} onPress={retake} activeOpacity={0.8}>
                                <Feather name="refresh-cw" size={16} color={Colors.primary} />
                                <Text style={styles.retakeBtnText}>Retake</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.8}>
                                <Feather name="x-circle" size={16} color="white" />
                                <Text style={styles.clearBtnText}>Clear Spotlight</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : capturing ? (
                    /* ─── Uploading ─── */
                    <View style={styles.capturingWrap}>
                        <ActivityIndicator size="large" color="white" />
                        <Text style={styles.capturingText}>Sending to screen…</Text>
                    </View>
                ) : (
                    /* ─── Countdown ─── */
                    <View style={styles.countdownWrap}>
                        {countdown > 0 ? (
                            <>
                                <Text style={styles.countdownHint}>Auto-capturing in</Text>
                                <View style={styles.countdownCircle}>
                                    <Text style={styles.countdownNum}>{countdown}</Text>
                                </View>
                            </>
                        ) : (
                            <ActivityIndicator size="large" color="white" />
                        )}
                        {/* Manual capture button */}
                        <TouchableOpacity style={styles.captureNowBtn} onPress={() => {
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            capturePhoto();
                        }} activeOpacity={0.8}>
                            <Text style={styles.captureNowText}>📸  Capture Now</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, gap: 16 },

    topOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingTop: 56, paddingHorizontal: 24, paddingBottom: 32,
        backgroundColor: 'rgba(0,0,0,0.55)',
    },
    backBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 20,
    },
    headingWrap: { alignItems: 'center' },
    jesusText: {
        fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.85)',
        letterSpacing: 2, marginBottom: 6,
    },
    nameText: {
        fontSize: 42, fontWeight: '900', color: 'white',
        textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
        textAlign: 'center', lineHeight: 48, marginBottom: 6,
    },
    mostText: {
        fontSize: 22, fontWeight: '800', color: '#FDA4AF',
        textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
    },

    bottomOverlay: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingBottom: 60, paddingTop: 28, paddingHorizontal: 24,
        alignItems: 'center',
    },

    // Countdown
    countdownWrap: { alignItems: 'center', gap: 16 },
    countdownHint: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '600' },
    countdownCircle: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 4, borderColor: 'white',
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    countdownNum: { color: 'white', fontSize: 40, fontWeight: '900' },
    captureNowBtn: {
        marginTop: 8, paddingHorizontal: 28, paddingVertical: 14,
        backgroundColor: 'rgba(239,68,68,0.85)',
        borderRadius: 30, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    },
    captureNowText: { color: 'white', fontSize: 16, fontWeight: '700' },

    // Capturing / uploading
    capturingWrap: { alignItems: 'center', gap: 14 },
    capturingText: { color: 'white', fontSize: 16, fontWeight: '600' },

    // Done
    doneWrap: { alignItems: 'center', gap: 12 },
    doneIcon: { fontSize: 48 },
    doneText: { color: 'white', fontSize: 18, fontWeight: '700', textAlign: 'center' },
    doneActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    retakeBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 12,
        backgroundColor: 'white', borderRadius: 24,
    },
    retakeBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
    clearBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 20, paddingVertical: 12,
        backgroundColor: 'rgba(239,68,68,0.8)', borderRadius: 24,
    },
    clearBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

    // Permission
    permText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
    permBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
    permBtnText: { color: 'white', fontWeight: '700' },
});
