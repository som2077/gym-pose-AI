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
      <Text style={styles.eyebrow}>SESSION COMPLETE</Text>
      <Text style={styles.title}>{exercise?.name ?? "Workout"} done.</Text>
      <Text style={styles.subtitle}>
        Consistency matters. Agli session mein ek aur clean rep aim karo.
      </Text>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreLabel}>CLEAN FORM SCORE</Text>
        <Text style={styles.scoreValue}>{cleanPercentage}%</Text>
        <Text style={styles.scoreHint}>
          {cleanReps} clean reps out of {totalReps}
        </Text>
      </View>
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>TOTAL REPS</Text>
          <Text style={styles.metricValue}>{totalReps}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>CLEAN REPS</Text>
          <Text style={[styles.metricValue, styles.greenText]}>
            {cleanReps}
          </Text>
        </View>
      </View>
      <View style={styles.insightCard}>
        <Text style={styles.insightLabel}>MOST FREQUENT NOTE</Text>
        <Text style={styles.insightValue}>
          {topError ? topError[0] : "No high-confidence errors logged"}
        </Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton label="Train again" onPress={startAgain} />
        <View style={styles.actionGap} />
        <PrimaryButton label="Home" variant="secondary" onPress={goHome} />
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
  heroIconText: { color: "#173229", fontSize: 44, fontWeight: "900" },
  eyebrow: {
    color: "#0B8B5A",
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: "900",
    marginTop: 26,
    marginBottom: 8,
  },
  title: {
    color: "#173229",
    fontSize: 36,
    letterSpacing: -0.8,
    fontWeight: "900",
  },
  subtitle: { color: "#60736B", lineHeight: 21, marginTop: 10, maxWidth: 320 },
  scoreCard: {
    alignItems: "center",
    marginTop: 32,
    borderRadius: 24,
    padding: 25,
    backgroundColor: "#EAF8F0",
    borderWidth: 1,
    borderColor: "#BDE4CB",
  },
  scoreLabel: {
    color: "#3C6A55",
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "900",
  },
  scoreValue: {
    color: "#0B8B5A",
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
    borderColor: "#D9E5DF",
  },
  metricLabel: {
    color: "#72847B",
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: "800",
  },
  metricValue: {
    color: "#173229",
    fontWeight: "900",
    fontSize: 30,
    marginTop: 7,
  },
  greenText: { color: "#0B8B5A" },
  insightCard: {
    marginTop: 12,
    borderRadius: 18,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E5DF",
  },
  insightLabel: {
    color: "#72847B",
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: "800",
  },
  insightValue: {
    color: "#173229",
    fontWeight: "700",
    fontSize: 15,
    marginTop: 8,
  },
  actions: { flexDirection: "row", marginTop: 24 },
  actionGap: { width: 10 },
});
