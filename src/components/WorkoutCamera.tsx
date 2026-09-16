import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, Text, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, useFrameOutput, type Frame } from 'react-native-vision-camera';
import {
  BICEP_CURL_CONFIG,
  nitroPoseExercises,
  PUSHUP_CONFIG,
  SQUAT_CONFIG,
  type ExerciseConfig as NativeExerciseConfig,
  type FormFeedback,
  type Landmark,
  type RepData,
} from 'react-native-nitro-pose-exercises';

import { type ExerciseId } from '../features/exercises/types';
import { type WorkoutMode } from '../store/workoutStore';
import { PrimaryButton } from './PrimaryButton';
import { PoseSkeleton } from './PoseSkeleton';

type TrackerFeedback = {
  status: 'correct' | 'warning' | 'incorrect' | 'unavailable';
  message: string;
};

type WorkoutCameraProps = {
  exerciseId: ExerciseId;
  isActive: boolean;
  mode: WorkoutMode;
  onPoseReadyChange: (ready: boolean) => void;
  onRepComplete: (wasClean: boolean) => void;
  onFeedback: (feedback: TrackerFeedback) => void;
};

const POSE_CONFIGS: Readonly<Record<ExerciseId, NativeExerciseConfig>> = {
  'squat-side': { ...SQUAT_CONFIG, cameraAngle: 'side' },
  'pushup-side': { ...PUSHUP_CONFIG, cameraAngle: 'side' },
  'bicep-curl-front': BICEP_CURL_CONFIG,
};

// This must be referentially stable. `useFrameOutput` creates a native camera
// output and a Worklets runtime whenever an option changes. An inline object
// here recreated that runtime on every landmarks UI update, which eventually
// caused a native SIGSEGV on Android.
const FRAME_OUTPUT_RESOLUTION = { width: 480, height: 640 };

// Serialize singleton initialization and teardown, including rapid navigation.
let trackerLifecycle: Promise<void> = Promise.resolve();

export function WorkoutCamera({ exerciseId, isActive, mode, onPoseReadyChange, onRepComplete, onFeedback }: WorkoutCameraProps) {
  const [trackerReady, setTrackerReady] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === 'active');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const sessionStartedRef = useRef(false);
  const cameraActive = isActive && foreground && trackerReady && !cameraError;
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [landmarks, setLandmarks] = useState<readonly Landmark[]>([]);
  const initializedRef = useRef(false);
  const modeRef = useRef(mode);
  const poseReadyRef = useRef(false);
  const onPoseReadyChangeRef = useRef(onPoseReadyChange);
  const onRepCompleteRef = useRef(onRepComplete);
  const onFeedbackRef = useRef(onFeedback);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setForeground(state === 'active'));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    onPoseReadyChangeRef.current = onPoseReadyChange;
    onRepCompleteRef.current = onRepComplete;
    onFeedbackRef.current = onFeedback;
  }, [onFeedback, onPoseReadyChange, onRepComplete]);

  const handlePermissionRequest = useCallback(() => {
    void requestPermission().catch((error: unknown) => {
      console.error('Camera permission failed', error);
      setCameraError('Camera permission nahi mil saki. Settings mein camera permission check karo.');
    });
  }, [requestPermission]);

  useEffect(() => {
    let cancelled = false;
    setTrackerReady(false);
    sessionStartedRef.current = false;
    const config = POSE_CONFIGS[exerciseId];

    async function initializeTracker(): Promise<void> {
      try {
        await nitroPoseExercises.initialize('');
        if (cancelled) {
          return;
        }

        nitroPoseExercises.loadExercise(config);
        nitroPoseExercises.onRepComplete = (data: RepData) => {
          if (cancelled) return;
          if (modeRef.current === 'tracking') {
            onRepCompleteRef.current(data.formScore >= 80);
          }
        };
        nitroPoseExercises.onFormFeedback = (feedback: FormFeedback) => {
          if (cancelled) return;
          if (modeRef.current === 'tracking') {
            onFeedbackRef.current({
              status: feedback.severity === 'error' ? 'incorrect' : 'warning',
              message: feedback.message,
            });
          }
        };
        nitroPoseExercises.onPoseLost = () => {
          if (cancelled) return;
          poseReadyRef.current = false;
          setLandmarks([]);
          onPoseReadyChangeRef.current(false);
          onFeedbackRef.current({ status: 'unavailable', message: 'Body frame se bahar hai. Poora body camera mein lao.' });
        };
        nitroPoseExercises.onPostureLost = () => {
          if (cancelled) return;
          poseReadyRef.current = false;
          onPoseReadyChangeRef.current(false);
          onFeedbackRef.current({ status: 'warning', message: 'Camera angle aur full body framing check karo.' });
        };
        nitroPoseExercises.onPostureRegained = () => {
          if (cancelled) return;
          poseReadyRef.current = true;
          onPoseReadyChangeRef.current(true);
        };

        // The native detector only processes active sessions. This calibration
        // session feeds the readiness/skeleton UI; rep callbacks are ignored
        // until the user explicitly starts the workout.
        nitroPoseExercises.startSession(0, 0);
        initializedRef.current = true;
        setTrackerReady(true);
        onFeedbackRef.current({ status: 'warning', message: 'Pose detector start ho raha hai…' });
      } catch (error) {
        console.error('Pose tracker initialization failed', error);
        if (cancelled) return;
        setCameraError('Pose detector start nahi hua. Screen band karke phir try karo.');
        onFeedbackRef.current({ status: 'unavailable', message: 'Pose detector start nahi hua. App ko rebuild karke phir try karo.' });
      }
    }

    trackerLifecycle = trackerLifecycle.then(initializeTracker);

    return () => {
      cancelled = true;
      initializedRef.current = false;
      poseReadyRef.current = false;
      trackerLifecycle = trackerLifecycle.then(() => {
        nitroPoseExercises.onRepComplete = undefined;
        nitroPoseExercises.onFormFeedback = undefined;
        nitroPoseExercises.onPoseLost = undefined;
        nitroPoseExercises.onPostureLost = undefined;
        nitroPoseExercises.onPostureRegained = undefined;
        nitroPoseExercises.release();
      }).catch((error: unknown) => console.error('Pose tracker cleanup failed', error));
    };
  }, [exerciseId]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    if (!cameraActive || mode === 'paused' || mode === 'finished') {
      nitroPoseExercises.pauseSession();
      poseReadyRef.current = false;
      setLandmarks([]);
      onPoseReadyChangeRef.current(false);
    } else if (mode === 'tracking' && !sessionStartedRef.current) {
      nitroPoseExercises.startSession(0, 0);
      sessionStartedRef.current = true;
    } else {
      nitroPoseExercises.resumeSession();
    }
  }, [mode, cameraActive, trackerReady]);

  useEffect(() => {
    const pollLandmarks = setInterval(() => {
      if (!initializedRef.current || !cameraActive) {
        return;
      }

      const nextLandmarks = nitroPoseExercises.landmarks;
      setLandmarks(nextLandmarks);
      const isReady = nitroPoseExercises.isReady();
      if (poseReadyRef.current !== isReady) {
        poseReadyRef.current = isReady;
        onPoseReadyChangeRef.current(isReady);
      }
    }, 125);

    return () => clearInterval(pollLandmarks);
  }, [cameraActive]);

  const android = Platform.OS === 'android';
  const processFrame = useCallback((frame: Frame) => {
    'worklet';
    try {
      if (android) nitroPoseExercises.processFrameAndroid(frame);
      else nitroPoseExercises.processFrameIOS(frame);
    } finally {
      frame.dispose();
    }
  }, [android]);
  const frameOutput = useFrameOutput({
    pixelFormat: 'yuv',
    targetResolution: FRAME_OUTPUT_RESOLUTION,
    enablePreviewSizedOutputBuffers: true,
    onFrame: processFrame,
  });
  const outputs = useMemo(() => [frameOutput], [frameOutput]);
  const handleCameraError = useCallback((error: Error) => {
    console.error('Workout camera failed', error);
    setCameraError('Camera start nahi hua. Camera use karne wali dusri app band karke phir try karo.');
    onPoseReadyChangeRef.current(false);
  }, []);

  if (cameraError) {
    return <View style={styles.fallback}><Text style={styles.copy}>{cameraError}</Text></View>;
  }

  if (!hasPermission) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.title}>Camera permission required</Text>
        <Text style={styles.copy}>Video is processed on this device for live form tracking. It is not uploaded by this app.</Text>
        <PrimaryButton label="Allow camera" onPress={handlePermissionRequest} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color="#84F7C5" />
        <Text style={styles.copy}>Camera device load ho raha hai…</Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera device={device} isActive={cameraActive} outputs={outputs} onError={handleCameraError} style={styles.camera} />
      <PoseSkeleton landmarks={landmarks} />
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1 },
  cameraContainer: { flex: 1 },
  fallback: { flex: 1, padding: 24, gap: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111A22' },
  title: { color: '#F5F8FA', fontWeight: '800', fontSize: 18, textAlign: 'center' },
  copy: { color: '#A7B8C6', lineHeight: 20, textAlign: 'center' },
});
