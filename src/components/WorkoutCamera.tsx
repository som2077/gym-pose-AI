import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameOutput,
  type Frame,
} from "react-native-vision-camera";
import {
  BICEP_CURL_CONFIG,
  nitroPoseExercises,
  PUSHUP_CONFIG,
  SQUAT_CONFIG,
  type ExerciseConfig as NativeExerciseConfig,
  type FormFeedback,
  type Landmark,
  type RepData,
} from "react-native-nitro-pose-exercises";

import { type ExerciseId } from "../features/exercises/types";
import { type WorkoutMode } from "../store/workoutStore";
import {
  hasExerciseJoints,
  isReliableJoint,
  PoseSmoother,
  STALE_POSE_MS,
  type FrameSize,
} from "../features/pose/tracking";
import { PushupTracker } from "../features/pose/pushupTracking";
import {
  missingJointHint,
  type CoachObservation,
} from "../features/pose/coachObservation";
import { PrimaryButton } from "./PrimaryButton";
import { PoseSkeleton } from "./PoseSkeleton";

type TrackerFeedback = {
  status: "correct" | "warning" | "incorrect" | "unavailable";
  message: string;
  ruleName?: string;
};

type WorkoutCameraProps = {
  exerciseId: ExerciseId;
  isActive: boolean;
  mode: WorkoutMode;
  onPoseReadyChange: (ready: boolean) => void;
  onRepComplete: (wasClean: boolean) => void;
  onFeedback: (feedback: TrackerFeedback) => void;
  onCoachObservation: (observation: CoachObservation) => void;
};

const POSE_CONFIGS: Readonly<Record<ExerciseId, NativeExerciseConfig>> = {
  "squat-side": { ...SQUAT_CONFIG, cameraAngle: "side" },
  "pushup-side": { ...PUSHUP_CONFIG, cameraAngle: "side" },
  "bicep-curl-front": BICEP_CURL_CONFIG,
};

// This must be referentially stable. `useFrameOutput` creates a native camera
// output and a Worklets runtime whenever an option changes. An inline object
// here recreated that runtime on every landmarks UI update, which eventually
// caused a native SIGSEGV on Android.
const FRAME_OUTPUT_RESOLUTION = { width: 480, height: 640 };

// Serialize singleton initialization and teardown, including rapid navigation.
let trackerLifecycle: Promise<void> = Promise.resolve();

export function WorkoutCamera({
  exerciseId,
  isActive,
  mode,
  onPoseReadyChange,
  onRepComplete,
  onFeedback,
  onCoachObservation,
}: WorkoutCameraProps) {
  const [trackerReady, setTrackerReady] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const [cameraError, setCameraError] = useState<string | null>(null);
  const cameraActive = isActive && foreground && trackerReady && !cameraError;
  const device = useCameraDevice("back");
  const { hasPermission, requestPermission } = useCameraPermission();
  const [landmarks, setLandmarks] = useState<readonly Landmark[]>([]);
  const [frameSize, setFrameSize] = useState<FrameSize>(
    FRAME_OUTPUT_RESOLUTION,
  );
  const smootherRef = useRef(new PoseSmoother());
  const pushupRef = useRef(new PushupTracker());
  const pushupFeedbackRef = useRef("");
  const readySinceRef = useRef<number | null>(null);
  const initializedRef = useRef(false);
  const modeRef = useRef(mode);
  const poseReadyRef = useRef(false);
  const onPoseReadyChangeRef = useRef(onPoseReadyChange);
  const onRepCompleteRef = useRef(onRepComplete);
  const onFeedbackRef = useRef(onFeedback);
  const onCoachObservationRef = useRef(onCoachObservation);
  const coachKeyRef = useRef("");
  const rawLandmarksRef = useRef<readonly Landmark[]>([]);
  const sampleTimeRef = useRef(0);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) =>
      setForeground(state === "active"),
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    onPoseReadyChangeRef.current = onPoseReadyChange;
    onRepCompleteRef.current = onRepComplete;
    onFeedbackRef.current = onFeedback;
    onCoachObservationRef.current = onCoachObservation;
  }, [onFeedback, onPoseReadyChange, onRepComplete, onCoachObservation]);

  const handlePermissionRequest = useCallback(() => {
    void requestPermission().catch((error: unknown) => {
      console.error("Camera permission failed", error);
      setCameraError(
        "Camera permission nahi mil saki. Settings mein camera permission check karo.",
      );
    });
  }, [requestPermission]);

  useEffect(() => {
    let cancelled = false;
    setTrackerReady(false);
    smootherRef.current =
      exerciseId === "pushup-side"
        ? new PoseSmoother(0.5, 0.4)
        : new PoseSmoother();
    pushupRef.current.reset();
    pushupFeedbackRef.current = "";
    readySinceRef.current = null;
    setLandmarks([]);
    const config = POSE_CONFIGS[exerciseId];

    async function initializeTracker(): Promise<void> {
      try {
        await nitroPoseExercises.initialize("");
        if (cancelled) {
          return;
        }

        nitroPoseExercises.loadExercise(config);
        nitroPoseExercises.onRepComplete = (data: RepData) => {
          if (cancelled || exerciseId === "pushup-side") return;
          if (modeRef.current === "tracking") {
            onRepCompleteRef.current(data.formScore >= 80);
          }
        };
        nitroPoseExercises.onFormFeedback = (feedback: FormFeedback) => {
          if (cancelled || exerciseId === "pushup-side") return;
          const rule = config.formRules.find(
            (item) => item.name === feedback.ruleName,
          );
          const angle = config.angles.find(
            (item) => item.name === rule?.angleName,
          );
          const confident =
            angle &&
            [angle.landmarkA, angle.landmarkB, angle.landmarkC].every((index) =>
              isReliableJoint(rawLandmarksRef.current[index]),
            );
          if (
            modeRef.current === "tracking" &&
            poseReadyRef.current &&
            confident &&
            Date.now() - sampleTimeRef.current < STALE_POSE_MS
          ) {
            onFeedbackRef.current({
              status: feedback.severity === "error" ? "incorrect" : "warning",
              message: feedback.message,
              ruleName: feedback.ruleName,
            });
          }
        };
        nitroPoseExercises.onPoseLost = () => {
          if (cancelled) return;
          poseReadyRef.current = false;
          readySinceRef.current = null;
          smootherRef.current.reset();
          setLandmarks([]);
          onPoseReadyChangeRef.current(false);
          if (exerciseId !== "pushup-side") {
            onFeedbackRef.current({
              status: "unavailable",
              message: "Body frame se bahar hai. Poora body camera mein lao.",
            });
          }
        };
        nitroPoseExercises.onPostureLost = () => {
          if (cancelled || exerciseId === "pushup-side") return;
          poseReadyRef.current = false;
          onPoseReadyChangeRef.current(false);
          onFeedbackRef.current({
            status: "warning",
            message: "Camera angle aur full body framing check karo.",
          });
        };
        nitroPoseExercises.onPostureRegained = () => {
          if (cancelled || exerciseId === "pushup-side") return;
          // The poll below confirms visible exercise joints before enabling Start.
          readySinceRef.current = null;
        };

        // The native detector only processes active sessions. This calibration
        // session feeds the readiness/skeleton UI; rep callbacks are ignored
        // until the user explicitly starts the workout.
        nitroPoseExercises.startSession(0, 0);
        initializedRef.current = true;
        setTrackerReady(true);
        onFeedbackRef.current({
          status: "warning",
          message: "Pose detector start ho raha hai…",
        });
      } catch (error) {
        console.error("Pose tracker initialization failed", error);
        if (cancelled) return;
        setCameraError(
          "Pose detector start nahi hua. Screen band karke phir try karo.",
        );
        onFeedbackRef.current({
          status: "unavailable",
          message:
            "Pose detector start nahi hua. App ko rebuild karke phir try karo.",
        });
      }
    }

    trackerLifecycle = trackerLifecycle.then(initializeTracker);

    return () => {
      cancelled = true;
      initializedRef.current = false;
      poseReadyRef.current = false;
      readySinceRef.current = null;
      smootherRef.current.reset();
      trackerLifecycle = trackerLifecycle
        .then(() => {
          nitroPoseExercises.onRepComplete = undefined;
          nitroPoseExercises.onFormFeedback = undefined;
          nitroPoseExercises.onPoseLost = undefined;
          nitroPoseExercises.onPostureLost = undefined;
          nitroPoseExercises.onPostureRegained = undefined;
          nitroPoseExercises.release();
        })
        .catch((error: unknown) =>
          console.error("Pose tracker cleanup failed", error),
        );
    };
  }, [exerciseId]);

  useEffect(() => {
    if (!initializedRef.current) {
      return;
    }

    if (!cameraActive || mode === "paused" || mode === "finished") {
      nitroPoseExercises.pauseSession();
      pushupRef.current.reset();
      pushupFeedbackRef.current = "";
      coachKeyRef.current = "";
      rawLandmarksRef.current = [];
      poseReadyRef.current = false;
      readySinceRef.current = null;
      smootherRef.current.reset();
      setLandmarks([]);
      onPoseReadyChangeRef.current(false);
    } else if (mode === "tracking") {
      // Calibration/resume movement cannot complete a rep after the countdown.
      nitroPoseExercises.startSession(0, 0);
      pushupRef.current.reset();
      pushupFeedbackRef.current = "";
    } else {
      nitroPoseExercises.resumeSession();
    }
  }, [mode, cameraActive, trackerReady]);

  const android = Platform.OS === "android";
  const processFrame = useCallback(
    (frame: Frame) => {
      "worklet";
      try {
        if (android) nitroPoseExercises.processFrameAndroid(frame);
        else nitroPoseExercises.processFrameIOS(frame);
      } finally {
        frame.dispose();
      }
    },
    [android],
  );
  const frameOutput = useFrameOutput({
    pixelFormat: "yuv",
    targetResolution: FRAME_OUTPUT_RESOLUTION,
    enablePreviewSizedOutputBuffers: true,
    onFrame: processFrame,
  });
  const outputs = useMemo(() => [frameOutput], [frameOutput]);

  useEffect(() => {
    if (!cameraActive || mode === "paused" || mode === "finished") return;
    const pollLandmarks = setInterval(() => {
      if (!initializedRef.current) return;
      const snapshot = nitroPoseExercises.landmarks;
      // Android's patched detector publishes geometry and capture time atomically.
      // iOS uses the actual negotiated output size (the app is portrait locked).
      const metadata = Platform.OS === "android" ? snapshot[34] : undefined;
      const resolution = frameOutput.currentResolution;
      const width =
        metadata?.x ??
        (resolution ? Math.min(resolution.width, resolution.height) : 480);
      const height =
        metadata?.y ??
        (resolution ? Math.max(resolution.width, resolution.height) : 640);
      setFrameSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
      const now = Date.now();
      const sampleTime = metadata?.z ?? now;
      const stale = metadata && now - metadata.z > STALE_POSE_MS;
      const nextLandmarks = stale ? [] : snapshot;
      rawLandmarksRef.current = nextLandmarks;
      sampleTimeRef.current = sampleTime;
      const pushup =
        exerciseId === "pushup-side"
          ? pushupRef.current.update(
              nextLandmarks,
              { width, height },
              stale || snapshot.length === 0 ? now : sampleTime,
            )
          : null;
      if (nextLandmarks.length === 0) smootherRef.current.reset();
      const smoothed = smootherRef.current.update(
        pushup?.landmarks ?? nextLandmarks,
        sampleTime,
      );
      setLandmarks((previous) =>
        smoothed.length === 0 && previous.length === 0 ? previous : smoothed,
      );

      const jointsReady = pushup
        ? pushup.ready
        : hasExerciseJoints(nextLandmarks, exerciseId) &&
          nitroPoseExercises.isReady();
      if (!jointsReady) readySinceRef.current = null;
      else if (readySinceRef.current === null)
        readySinceRef.current = sampleTime;
      // Repeated polls of one cached detection must not unlock Start.
      const isReady =
        readySinceRef.current !== null &&
        sampleTime - readySinceRef.current >= 350;
      if (poseReadyRef.current !== isReady) {
        poseReadyRef.current = isReady;
        onPoseReadyChangeRef.current(isReady);
      }
      const missing = missingJointHint(nextLandmarks, exerciseId);
      const phase = pushup
        ? pushupRef.current.currentPhase
        : nitroPoseExercises.currentPhase;
      // Native squat/curl phase angles are left-sided; do not coach from hidden left joints.
      const phaseJoints =
        exerciseId === "squat-side" ? [23, 25, 27] : [11, 13, 15];
      const phaseConfident = pushup
        ? pushup.ready
        : phaseJoints.every((index) => isReliableJoint(nextLandmarks[index]));
      const observation: CoachObservation = {
        hint:
          missing ??
          (!isReady
            ? "position"
            : pushup?.status === "warning"
              ? "bodyLine"
              : null),
        phase:
          isReady && phaseConfident && (phase === "up" || phase === "down")
            ? phase
            : null,
      };
      const coachKey = `${observation.hint}:${observation.phase}`;
      if (coachKey !== coachKeyRef.current) {
        coachKeyRef.current = coachKey;
        onCoachObservationRef.current(observation);
      }
      if (pushup) {
        if (pushup.rep && modeRef.current === "tracking")
          onRepCompleteRef.current(pushup.clean);
        const feedbackKey = `${pushup.status}:${pushup.message}`;
        if (pushupFeedbackRef.current !== feedbackKey) {
          pushupFeedbackRef.current = feedbackKey;
          onFeedbackRef.current({
            status: pushup.status,
            message: pushup.message,
          });
        }
      }
    }, 33);
    return () => clearInterval(pollLandmarks);
  }, [cameraActive, exerciseId, frameOutput, mode]);
  const handleCameraError = useCallback((error: Error) => {
    console.error("Workout camera failed", error);
    setCameraError(
      "Camera start nahi hua. Camera use karne wali dusri app band karke phir try karo.",
    );
    onPoseReadyChangeRef.current(false);
  }, []);

  if (cameraError) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.copy}>{cameraError}</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.title}>Camera permission required</Text>
        <Text style={styles.copy}>
          Video is processed on this device for live form tracking. It is not
          uploaded by this app.
        </Text>
        <PrimaryButton label="Allow camera" onPress={handlePermissionRequest} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.fallback}>
        <ActivityIndicator color="#0F9F68" />
        <Text style={styles.copy}>Camera device load ho raha hai…</Text>
      </View>
    );
  }

  return (
    <View style={styles.cameraContainer}>
      <Camera
        device={device}
        isActive={cameraActive}
        outputs={outputs}
        onError={handleCameraError}
        orientationSource="interface"
        mirrorMode="off"
        resizeMode="cover"
        style={styles.camera}
      />
      <PoseSkeleton
        landmarks={landmarks}
        frameSize={frameSize}
        visibilityThreshold={exerciseId === "pushup-side" ? 0.4 : 0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  camera: { flex: 1 },
  cameraContainer: { flex: 1 },
  fallback: {
    flex: 1,
    padding: 24,
    gap: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F8F6",
  },
  title: {
    color: "#173229",
    fontWeight: "800",
    fontSize: 18,
    textAlign: "center",
  },
  copy: { color: "#60736B", lineHeight: 20, textAlign: "center" },
});
