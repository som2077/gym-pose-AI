import { Redirect, router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../components/PrimaryButton";
import { WorkoutCamera } from "../../components/WorkoutCamera";
import { getExercise } from "../exercises/config";
import { saveSession } from "../../storage/sessionRepository";
import { useWorkoutStore } from "../../store/workoutStore";

export function LiveWorkoutScreen({
  exerciseId,
}: {
  exerciseId: string | undefined;
}) {
  const exercise = getExercise(exerciseId);
  const mode = useWorkoutStore((state) => state.mode);
  const totalReps = useWorkoutStore((state) => state.totalReps);
  const cleanReps = useWorkoutStore((state) => state.cleanReps);
  const formStatus = useWorkoutStore((state) => state.formStatus);
  const activeFeedback = useWorkoutStore((state) => state.activeFeedback);
  const sessionStartedAt = useWorkoutStore((state) => state.sessionStartedAt);
  const errorCounts = useWorkoutStore((state) => state.errorCounts);
  const markReady = useWorkoutStore((state) => state.markReady);
  const startTracking = useWorkoutStore((state) => state.startTracking);
  const pauseWorkout = useWorkoutStore((state) => state.pauseWorkout);
  const resumeWorkout = useWorkoutStore((state) => state.resumeWorkout);
  const finishSession = useWorkoutStore((state) => state.finishSession);
  const recordRep = useWorkoutStore((state) => state.recordRep);
  const setFeedback = useWorkoutStore((state) => state.setFeedback);
  const [poseReady, setPoseReady] = useState(false);

  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  const configuredExercise = exercise;

  const isPaused = mode === "paused";
  const isCameraActive = focused && mode !== "paused" && mode !== "finished";
  const statusLabel =
    mode === "calibrating"
      ? "CALIBRATING"
      : formStatus === "correct"
        ? "READY"
        : formStatus === "unavailable"
          ? "NO POSE"
          : "TRACKING";

  const handlePoseReadyChange = useCallback(
    (ready: boolean) => {
      setPoseReady(ready);
      if (mode === "calibrating") {
        setFeedback(
          ready ? "warning" : "unavailable",
          ready
            ? "Pose detect ho gaya. Continue dabao."
            : "Full body aur joints ko camera frame mein lao.",
        );
      }
    },
    [mode, setFeedback],
  );

  const handleTrackerFeedback = useCallback(
    (feedback: {
      status: "correct" | "warning" | "incorrect" | "unavailable";
      message: string;
    }) => {
      setFeedback(feedback.status, feedback.message);
    },
    [setFeedback],
  );

  if (!exercise) return <Redirect href="/" />;

  function handlePrimaryAction(): void {
    if (mode === "calibrating") {
      if (poseReady) {
        markReady();
      }
      return;
    }
    if (mode === "ready") {
      startTracking();
      return;
    }
    if (mode === "paused") {
      resumeWorkout();
      return;
    }
    pauseWorkout();
  }

  async function endWorkout(): Promise<void> {
    if (!configuredExercise) return;
    const completedAt = Date.now();
    try {
      await saveSession({
        id: `${completedAt}-${configuredExercise.id}`,
        exerciseId: configuredExercise.id,
        completedAt,
        durationMs: sessionStartedAt ? completedAt - sessionStartedAt : 0,
        totalReps,
        cleanReps,
        errorCounts,
      });
    } catch {
      // The user can still view the current session summary if local storage is unavailable.
    }
    finishSession();
    router.replace("/summary");
  }

  return (
    <View style={styles.screen}>
      <WorkoutCamera
        exerciseId={exercise.id}
        isActive={isCameraActive}
        mode={mode}
        onFeedback={handleTrackerFeedback}
        onPoseReadyChange={handlePoseReadyChange}
        onRepComplete={recordRep}
      />
      <View style={styles.topOverlay}>
        <View style={styles.exercisePill}>
          <Text style={styles.exercisePillText}>
            {exercise.name.toUpperCase()}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            formStatus === "correct" ? styles.statusGood : styles.statusWarning,
          ]}
        >
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>
      <View style={styles.bottomSheet}>
        <View style={styles.repsRow}>
          <View>
            <Text style={styles.repsLabel}>TOTAL REPS</Text>
            <Text style={styles.repsValue}>{totalReps}</Text>
          </View>
          <View style={styles.cleanMetric}>
            <Text style={styles.repsLabel}>CLEAN REPS</Text>
            <Text style={styles.cleanValue}>{cleanReps}</Text>
          </View>
          <PrimaryButton
            label="×"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
        <View style={styles.feedbackCard}>
          <View
            style={[
              styles.feedbackDot,
              formStatus === "correct" ? styles.dotGood : styles.dotWarning,
            ]}
          />
          <Text style={styles.feedbackText}>
            {activeFeedback ?? "Tracker ready hai."}
          </Text>
        </View>
        <View style={styles.controls}>
          <PrimaryButton
            label="End"
            variant="danger"
            onPress={() => void endWorkout()}
          />
          <View style={styles.controlSpacer} />
          <PrimaryButton
            disabled={mode === "calibrating" && !poseReady}
            label={
              isPaused
                ? "Resume"
                : mode === "tracking"
                  ? "Pause"
                  : mode === "ready"
                    ? "Start workout"
                    : poseReady
                      ? "Continue"
                      : "Detecting pose…"
            }
            onPress={handlePrimaryAction}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0B1016" },
  topOverlay: {
    position: "absolute",
    top: 58,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exercisePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "#0B1016CC",
  },
  exercisePillText: {
    color: "#F5F8FA",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  statusPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 99 },
  statusGood: { backgroundColor: "#1F5C41" },
  statusWarning: { backgroundColor: "#76551C" },
  statusText: {
    color: "#F5F8FA",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#0B1016EF",
  },
  repsRow: { flexDirection: "row", alignItems: "center" },
  repsLabel: {
    color: "#8AA0AE",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
  },
  repsValue: {
    color: "#F5F8FA",
    fontSize: 36,
    fontWeight: "900",
    marginTop: 2,
  },
  cleanMetric: { marginLeft: 26, flex: 1 },
  cleanValue: {
    color: "#84F7C5",
    fontSize: 36,
    fontWeight: "900",
    marginTop: 2,
  },
  feedbackCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: "#17232C",
    marginVertical: 15,
  },
  feedbackDot: { width: 9, height: 9, borderRadius: 9 },
  dotGood: { backgroundColor: "#84F7C5" },
  dotWarning: { backgroundColor: "#F6C964" },
  feedbackText: { color: "#E3EEF5", flex: 1, fontSize: 14, fontWeight: "700" },
  controls: { flexDirection: "row", alignItems: "center" },
  controlSpacer: { width: 12 },
});
