import { router } from "expo-router";
import { useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { getExercise } from "../exercises/config";
import { useWorkoutStore } from "../../store/workoutStore";
import { VoiceCoachControls } from "../../components/VoiceCoachControls";
import { useVoiceCoach } from "./useVoiceCoach";
import { summaryText } from "./coachText";
import { localizedExerciseName, localizedFeedback, workoutUiText } from "./uiText";

export function SessionSummaryScreen() {
  const selectedExerciseId = useWorkoutStore(
    (state) => state.selectedExerciseId,
  );
  const totalReps = useWorkoutStore((state) => state.totalReps);
  const cleanReps = useWorkoutStore((state) => state.cleanReps);
  const errorCounts = useWorkoutStore((state) => state.errorCounts);
  const resetWorkout = useWorkoutStore((state) => state.resetWorkout);
  const exercise = getExercise(selectedExerciseId ?? undefined);
  const { active, say, language, enabled, caption, error } = useVoiceCoach();
  const mode = useWorkoutStore((state) => state.mode);
  const copy = workoutUiText(language);
  const replay = useCallback(() => {
    if (mode !== "finished") return;
    say({
      id: "summary",
      text: summaryText(totalReps, cleanReps, language),
      priority: 100,
      cooldownMs: 0,
    });
  }, [mode, say, totalReps, cleanReps, language]);
  useEffect(() => {
    if (active) replay();
  }, [active, replay, enabled]);
  const cleanPercentage =
    totalReps === 0 ? 0 : Math.round((cleanReps / totalReps) * 100);
  const topError = Object.entries(errorCounts).sort(
    ([, firstCount], [, secondCount]) => secondCount - firstCount,
  )[0];

  function startAgain(): void {
    if (!exercise) {
      router.replace("/");
      return;
    }
    router.replace({ pathname: "/setup", params: { exerciseId: exercise.id } });
  }

  function goHome(): void {
    resetWorkout();
    router.replace("/");
  }

  return (
    <Screen>
      <View style={styles.heroIcon}>
        <Text style={styles.heroIconText}>✓</Text>
      </View>
      <Text style={styles.eyebrow}>{copy.sessionComplete}</Text>
      <Text style={styles.title}>{exercise ? localizedExerciseName(exercise.id, language, exercise.name) : "Workout"} {copy.doneSuffix}</Text>
      <Text style={styles.subtitle}>
        {copy.consistency}
      </Text>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>{copy.cleanFormScore}</Text>
        <Text style={styles.scoreValue}>{cleanPercentage}%</Text>
        <Text style={styles.scoreHint}>
          {copy.cleanOutOf(cleanReps, totalReps)}
        </Text>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{copy.totalReps}</Text>
          <Text style={styles.metricValue}>{totalReps}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>{copy.cleanReps}</Text>
          <Text style={[styles.metricValue, styles.greenText]}>
            {cleanReps}
          </Text>
        </View>
      </View>
      <View style={styles.insightCard}>
        <Text style={styles.insightLabel}>{copy.mostFrequentNote}</Text>
        <Text style={styles.insightValue}>
          {topError ? localizedFeedback(topError[0], language) : copy.noErrors}
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label={copy.trainAgain} onPress={startAgain} />
        <View style={styles.actionGap} />
        <PrimaryButton label={copy.home} variant="secondary" onPress={goHome} />
      </View>
      <VoiceCoachControls caption={caption} error={error} onReplay={replay} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8BE8BF",
  },
  heroIconText: { color: "#20212D", fontSize: 44, fontWeight: "900" },
  eyebrow: {
    color: "#347DF2",
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: "900",
    marginTop: 26,
    marginBottom: 8,
  },
  title: {
    color: "#20212D",
    fontSize: 36,
    letterSpacing: -0.8,
    fontWeight: "900",
  },
  subtitle: { color: "#777D89", lineHeight: 21, marginTop: 10, maxWidth: 320 },
  scoreCard: {
    alignItems: "center",
    marginTop: 32,
    borderRadius: 24,
    padding: 25,
    backgroundColor: "#E5F0FF",
    borderWidth: 1,
    borderColor: "#C5DCFF",
  },
  scoreLabel: {
    color: "#3C6A55",
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "900",
  },
  scoreValue: {
    color: "#347DF2",
    fontSize: 68,
    fontWeight: "900",
    lineHeight: 80,
  },
  scoreHint: { color: "#4E7763", fontSize: 14 },
  metricsRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  metricCard: {
    flex: 1,
    padding: 17,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },
  metricLabel: {
    color: "#72847B",
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: "800",
  },
  metricValue: {
    color: "#20212D",
    fontWeight: "900",
    fontSize: 30,
    marginTop: 7,
  },
  greenText: { color: "#347DF2" },
  insightCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },
  insightLabel: {
    color: "#72847B",
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: "800",
  },
  insightValue: {
    color: "#20212D",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 8,
  },
  actions: { flexDirection: "row", marginTop: 24 },
  actionGap: { width: 10 },
});
