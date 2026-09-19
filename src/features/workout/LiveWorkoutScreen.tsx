import { Redirect, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { PrimaryButton } from "../../components/PrimaryButton";
import { WorkoutCamera } from "../../components/WorkoutCamera";
import { getExercise } from "../exercises/config";
import { saveSession } from "../../storage/sessionRepository";
import { useWorkoutStore } from "../../store/workoutStore";
import { VoiceCoachControls } from "../../components/VoiceCoachControls";
import { useWorkoutCoach } from "./useWorkoutCoach";
import { localizedExerciseName, localizedFeedback, workoutUiText } from "./uiText";

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
  const finishSession = useWorkoutStore((state) => state.finishSession);
  const coach = useWorkoutCoach(exercise?.id);
  const { poseReady } = coach;
  const copy = workoutUiText(coach.language);
  const [finishing, setFinishing] = useState(false);
  const finishingRef = useRef(false);
  useEffect(() => {
    if (!exercise) return;
    const current = useWorkoutStore.getState();
    if (
      current.selectedExerciseId !== exercise.id ||
      current.mode === "idle" ||
      current.mode === "finished"
    ) {
      current.selectExercise(exercise.id);
      current.beginCalibration();
    }
  }, [exercise]);

  const configuredExercise = exercise;

  const isPaused = mode === "paused";
  const isCameraActive =
    coach.active && mode !== "paused" && mode !== "finished";
  const statusLabel = isPaused
    ? copy.paused
    : coach.countdown !== null
      ? copy.getReady
      : poseReady
        ? mode === "tracking"
          ? copy.trackingLive
          : copy.bodyInFrame
        : copy.findingPosition;

  if (!exercise) return <Redirect href="/" />;

  function handlePrimaryAction(): void {
    if (mode === "tracking" || coach.armed) coach.pause();
    else coach.start();
  }

  async function endWorkout(): Promise<void> {
    if (!configuredExercise || finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    coach.cancelStart();
    coach.stop();
    // Freeze counting before asynchronous storage and take one consistent snapshot.
    const snapshot = useWorkoutStore.getState();
    finishSession();
    const completedAt = Date.now();
    try {
      await saveSession({
        id: `${completedAt}-${configuredExercise.id}`,
        exerciseId: configuredExercise.id,
        completedAt,
        durationMs: snapshot.sessionStartedAt
          ? completedAt - snapshot.sessionStartedAt
          : 0,
        totalReps: snapshot.totalReps,
        cleanReps: snapshot.cleanReps,
        errorCounts: snapshot.errorCounts,
      });
    } catch {
      // The user can still view the current session summary if local storage is unavailable.
    }
    router.replace("/summary");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{copy.liveCoach}</Text>
          <Text style={styles.exerciseName}>{localizedExerciseName(exercise.id, coach.language, exercise.name)}</Text>
        </View>
        <View style={styles.viewPill}>
          <Text style={styles.viewLabel}>
            {exercise.requiredView === "side" ? copy.sideView : copy.frontView}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.backToSetup}
          disabled={finishing}
          onPress={() => {
            coach.stop();
            coach.cancelStart();
            router.back();
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeLabel}>×</Text>
        </Pressable>
      </View>
      <View style={styles.cameraStage}>
        <WorkoutCamera
          exerciseId={exercise.id}
          isActive={isCameraActive}
          mode={mode}
          onFeedback={coach.handleFeedback}
          onPoseReadyChange={coach.handleReady}
          onRepComplete={coach.handleRep}
          onCoachObservation={coach.handleObservation}
        />
        <View pointerEvents="none" style={styles.cameraOverlay}>
          <View
            style={[
              styles.statusPill,
              poseReady && !isPaused ? styles.statusGood : styles.statusWarning,
            ]}
          >
            <View
              style={[
                styles.feedbackDot,
                poseReady && !isPaused ? styles.dotGood : styles.dotWarning,
              ]}
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          {!poseReady && !isPaused && (
            <View style={styles.frameGuide}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          )}
          {isPaused && (
            <View style={styles.pauseOverlay}>
              <Text style={styles.pauseTitle}>{copy.pauseTitle}</Text>
              <Text style={styles.pauseCopy}>{copy.pauseCopy}</Text>
            </View>
          )}
          {coach.countdown !== null && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownNumber}>{coach.countdown}</Text>
              <Text style={styles.pauseCopy}>{copy.countdownCopy}</Text>
            </View>
          )}
          <View style={styles.cameraHint}>
            <Text style={styles.cameraHintText}>
              {isPaused
                ? copy.cameraPaused
                : poseReady
                  ? copy.slowControl
                  : exercise.id === "pushup-side"
                    ? copy.pushupHint
                    : exercise.requiredView === "side"
                      ? copy.sideHint
                      : copy.frontHint}
            </Text>
          </View>
        </View>
      </View>
      <ScrollView
        style={styles.panelScroll}
        contentContainerStyle={styles.panelContent}
        bounces={false}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.repsRow}>
            <View style={styles.metric}>
              <Text style={styles.repsLabel}>{copy.totalReps}</Text>
              <Text style={styles.repsValue}>{totalReps}</Text>
            </View>
            <View style={styles.cleanMetric}>
              <Text style={styles.repsLabel}>{copy.cleanReps}</Text>
              <Text style={styles.cleanValue}>{cleanReps}</Text>
            </View>
            <View style={styles.qualityMetric}>
              <Text style={styles.repsLabel}>{copy.cleanRate}</Text>
              <Text style={styles.qualityValue}>
                {totalReps > 0
                  ? `${Math.round((cleanReps / totalReps) * 100)}%`
                  : "—"}
              </Text>
            </View>
          </View>
          <View style={styles.feedbackCard}>
            <View
              style={[
                styles.feedbackDot,
                formStatus === "incorrect"
                  ? styles.dotError
                  : poseReady &&
                      (mode !== "tracking" || formStatus === "correct")
                    ? styles.dotGood
                    : styles.dotWarning,
              ]}
            />
            <Text style={styles.feedbackText}>
              {isPaused
                ? copy.pausedFeedback
                : !poseReady
                  ? exercise.id === "pushup-side" && activeFeedback
                    ? localizedFeedback(activeFeedback, coach.language)
                    : copy.jointsFeedback
                  : mode !== "tracking"
                    ? copy.positionReady
                    : (activeFeedback ? localizedFeedback(activeFeedback, coach.language) : copy.steadyPace)}
            </Text>
          </View>
          <View style={styles.controls}>
            <PrimaryButton
              label={finishing ? copy.finishing : copy.finish}
              disabled={finishing}
              variant="danger"
              onPress={() => void endWorkout()}
            />
            <View style={styles.primaryControl}>
              <PrimaryButton
                disabled={!coach.active || finishing}
                label={
                  isPaused
                    ? copy.resume
                    : mode === "tracking" || coach.armed
                      ? copy.pause
                      : copy.startWorkout
                }
                onPress={handlePrimaryAction}
              />
            </View>
          </View>
          {coach.armed && coach.countdown === null && (
            <Text style={styles.waitingText}>
              {copy.waiting}
            </Text>
          )}
          <VoiceCoachControls
            caption={coach.caption}
            error={coach.error}
            onReplay={coach.replay}
            replayDisabled={coach.countdown !== null || finishing}
          />
          <Text style={styles.privacyNote}>
            {copy.privacy}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F8F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    color: "#0B8B5A",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  exerciseName: {
    color: "#173229",
    fontSize: 25,
    fontWeight: "800",
    marginTop: 3,
  },
  viewPill: {
    borderWidth: 1,
    borderColor: "#C9DAD1",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewLabel: {
    color: "#3C6A55",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5EFEA",
    alignItems: "center",
    justifyContent: "center",
  },
  closeLabel: { color: "#173229", fontSize: 27 },
  cameraStage: {
    flex: 1,
    minHeight: 200,
    marginHorizontal: 12,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#2A3B45",
  },
  cameraOverlay: { ...StyleSheet.absoluteFill },
  statusPill: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 99,
    zIndex: 1,
  },
  statusGood: { backgroundColor: "#102B22E8" },
  statusWarning: { backgroundColor: "#302918E8" },
  frameGuide: {
    position: "absolute",
    top: 64,
    bottom: 60,
    left: "12%",
    right: "12%",
  },
  corner: {
    position: "absolute",
    width: 25,
    height: 25,
    borderColor: "#FFFFFF80",
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 12,
  },
  cameraHint: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: "center",
  },
  cameraHintText: {
    color: "#FFFFFF",
    fontSize: 11,
    textAlign: "center",
    backgroundColor: "#173229D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#173229C9",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  pauseTitle: { color: "#FFFFFF", fontSize: 26, fontWeight: "800" },
  pauseCopy: { color: "#D5E7DE", fontSize: 14 },
  countdownOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#17322980",
  },
  countdownNumber: {
    color: "#FFFFFF",
    fontSize: 80,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  waitingText: {
    color: "#60736B",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },
  panelScroll: { flexGrow: 0, flexShrink: 1 },
  panelContent: { flexGrow: 1 },
  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  bottomSheet: {
    padding: 18,
    paddingBottom: 8,
  },
  repsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  metric: { flex: 1 },
  repsLabel: {
    color: "#72847B",
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: "800",
  },
  repsValue: {
    color: "#173229",
    fontSize: 40,
    fontWeight: "900",
    marginTop: 2,
  },
  cleanMetric: {
    flex: 1,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#D9E5DF",
  },
  qualityMetric: {
    flex: 1,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: "#D9E5DF",
  },
  qualityValue: {
    color: "#173229",
    fontSize: 30,
    fontWeight: "800",
    marginTop: 9,
    fontVariant: ["tabular-nums"],
  },
  cleanValue: {
    color: "#0B8B5A",
    fontSize: 40,
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
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E5DF",
    marginVertical: 15,
  },
  feedbackDot: { width: 9, height: 9, borderRadius: 9 },
  dotGood: { backgroundColor: "#0F9F68" },
  dotWarning: { backgroundColor: "#D69A22" },
  dotError: { backgroundColor: "#FF8585" },
  feedbackText: { color: "#23473A", flex: 1, fontSize: 14, fontWeight: "700" },
  controls: { flexDirection: "row", alignItems: "center", gap: 12 },
  primaryControl: { flex: 1 },
  privacyNote: {
    color: "#72847B",
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 13,
  },
});
