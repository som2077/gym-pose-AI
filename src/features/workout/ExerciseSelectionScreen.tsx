import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppTabBar } from "../../components/AppTabBar";
import { Screen } from "../../components/Screen";
import { EXERCISES } from "../exercises/config";
import { loadSessions, type WorkoutSession } from "../../storage/sessionRepository";

const COLORS = ["#E5F0FF", "#EDE5FF", "#FFF0D9"] as const;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function startOfDay(date: Date): number {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value.getTime();
}

function getWeekStart(date: Date): Date {
  const value = new Date(date);
  const day = value.getDay();
  value.setDate(value.getDate() + (day === 0 ? -6 : 1 - day));
  value.setHours(0, 0, 0, 0);
  return value;
}

export function ExerciseSelectionScreen() {
  const [sessions, setSessions] = useState<readonly WorkoutSession[]>([]);
  const today = useMemo(() => new Date(), []);
  const weekStart = useMemo(() => getWeekStart(today), [today]);
  const todayIndex = Math.max(
    0,
    Math.min(6, Math.floor((startOfDay(today) - weekStart.getTime()) / 86400000)),
  );

  useEffect(() => {
    let mounted = true;
    void loadSessions().then((stored) => {
      if (mounted) setSessions(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const monthSessions = sessions.filter((session) => {
    const date = new Date(session.completedAt);
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  }).length;
  const weeklyReps = WEEKDAYS.map((_, index) => {
    const dayStart = weekStart.getTime() + index * 86400000;
    const dayEnd = dayStart + 86400000;
    return sessions
      .filter((session) => session.completedAt >= dayStart && session.completedAt < dayEnd)
      .reduce((total, session) => total + session.totalReps, 0);
  });
  const maxReps = Math.max(...weeklyReps, 1);
  const latestSession = sessions[0];

  function startWorkout(exerciseId = EXERCISES[0].id): void {
    router.push({ pathname: "/setup", params: { exerciseId } });
  }

  return (
    <Screen contentPadding={16} bottomBar={<AppTabBar activeTab="home" />}>
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>gym</Text>
            <Text style={styles.brandSpark}>✦</Text>
          </View>
          <Text style={styles.brandCaption}>POSE AI · FORM COACH</Text>
        </View>
        <View style={styles.streakPill}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.streakValue}>{sessions.length ? 1 : 0}</Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        {WEEKDAYS.map((day, index) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          const active = index === todayIndex;
          return (
            <View key={day} style={styles.dateItem}>
              <Text style={styles.dateNumber}>{date.getDate()}</Text>
              <View style={[styles.dateCircle, active && styles.activeDateCircle]}>
                <Text style={[styles.dateLabel, active && styles.activeDateLabel]}>{day.slice(0, 1)}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.progressCard}>
        <View>
          <Text style={styles.progressValue}>
            {monthSessions}<Text style={styles.progressSlash}> / 30</Text>
          </Text>
          <Text style={styles.progressLabel}>Monthly workouts</Text>
        </View>
        <View style={styles.progressRing}>
          <View style={styles.progressRingInner}>
            <Text style={styles.progressRingIcon}>●</Text>
          </View>
        </View>
      </View>

      <View style={styles.performanceCard}>
        <View style={styles.cardHeading}>
          <Text style={styles.cardTitle}>Performance</Text>
          <View style={styles.segmentedControl}>
            <Text style={styles.segmentActive}>Week</Text>
            <Text style={styles.segmentText}>Month</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <Text style={styles.legendPill}>All exercises</Text>
          <Text style={styles.legendItem}><Text style={styles.blueDot}>●</Text> Reps</Text>
          <Text style={styles.legendItem}><Text style={styles.purpleDot}>●</Text> Clean</Text>
        </View>
        <View style={styles.chart}>
          {WEEKDAYS.map((day, index) => {
            const value = weeklyReps[index];
            const barHeight = value ? Math.max(16, Math.round((value / maxReps) * 96)) : 4;
            return (
              <View key={day} style={styles.chartColumn}>
                <View style={styles.barArea}>
                  <View style={[styles.bar, value ? styles.barBlue : styles.barEmpty, { height: barHeight }]} />
                </View>
                <Text style={[styles.chartLabel, index === todayIndex && styles.chartLabelActive]}>{day}</Text>
              </View>
            );
          })}
        </View>
        {!sessions.length && <Text style={styles.emptyChart}>Complete a workout to see your weekly progress.</Text>}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => startWorkout()}
        style={({ pressed }) => [styles.newWorkout, pressed && styles.pressed]}
      >
        <View>
          <Text style={styles.newWorkoutTitle}>New workout</Text>
          <Text style={styles.newWorkoutSubtitle}>Start with {EXERCISES[0].name} · camera coach ready</Text>
        </View>
        <View style={styles.playButton}><Text style={styles.playIcon}>▶</Text></View>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        disabled={!latestSession}
        onPress={() => latestSession && startWorkout(latestSession.exerciseId)}
        style={({ pressed }) => [styles.continueCard, pressed && latestSession && styles.pressed]}
      >
        <View style={styles.continueIcon}><Text style={styles.continueIconText}>↻</Text></View>
        <View style={styles.continueCopy}>
          <Text style={styles.continueTitle}>Continue workout</Text>
          <Text style={styles.continueSubtitle}>
            {latestSession
              ? `${EXERCISES.find((exercise) => exercise.id === latestSession.exerciseId)?.name ?? "Workout"} · ${latestSession.totalReps} reps · ${Math.round((latestSession.cleanReps / Math.max(latestSession.totalReps, 1)) * 100)}% form`
              : "Your latest session will appear here"}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Choose an exercise</Text>
      <View style={styles.exerciseList}>
        {EXERCISES.map((exercise, index) => (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            accessibilityLabel={`Set up ${exercise.name}`}
            onPress={() => startWorkout(exercise.id)}
            style={({ pressed }) => [styles.exerciseRow, pressed && styles.pressed]}
          >
            <View style={[styles.exerciseIcon, { backgroundColor: COLORS[index] }]}>
              <Text style={styles.exerciseIconText}>{index === 0 ? "↘" : index === 1 ? "↔" : "∿"}</Text>
            </View>
            <View style={styles.exerciseCopy}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseMeta}>{exercise.requiredView} view · {exercise.targetMuscles.join(" · ")}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.privacyNote}>
        <Text style={styles.privacyTitle}>Private by design</Text>
        <Text style={styles.privacyText}>Pose analysis stays on this device. Workout video is never saved or uploaded.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 8, marginBottom: 20 },
  brandRow: { flexDirection: "row", alignItems: "flex-start" },
  brand: { color: "#151620", fontSize: 30, fontWeight: "900", letterSpacing: -1.4 },
  brandSpark: { color: "#F4B52C", fontSize: 14, marginTop: 0, marginLeft: 2 },
  brandCaption: { color: "#8D93A0", fontSize: 9, letterSpacing: 1.1, fontWeight: "800", marginTop: 1 },
  streakPill: { minWidth: 62, height: 38, borderRadius: 22, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, borderWidth: 1, borderColor: "#E7EAF0" },
  flame: { fontSize: 16 },
  streakValue: { color: "#292A37", fontSize: 14, fontWeight: "800" },
  dateRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  dateItem: { alignItems: "center", gap: 5 },
  dateNumber: { color: "#787E8A", fontSize: 12, fontWeight: "600" },
  dateCircle: { width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: "#FF9EAC", borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  activeDateCircle: { backgroundColor: "#20212D", borderColor: "#20212D" },
  dateLabel: { color: "#6D7380", fontSize: 12, fontWeight: "600" },
  activeDateLabel: { color: "#FFFFFF" },
  progressCard: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: "#E7EAF0", marginBottom: 12 },
  progressValue: { color: "#20212D", fontSize: 36, fontWeight: "800", letterSpacing: -1 },
  progressSlash: { color: "#9CA1AE", fontSize: 14, fontWeight: "500", letterSpacing: 0 },
  progressLabel: { color: "#777D89", fontSize: 13, marginTop: 5 },
  progressRing: { width: 74, height: 74, borderRadius: 37, borderWidth: 9, borderColor: "#EDF1F7", alignItems: "center", justifyContent: "center" },
  progressRingInner: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F7F9FC", alignItems: "center", justifyContent: "center" },
  progressRingIcon: { color: "#20212D", fontSize: 19 },
  performanceCard: { backgroundColor: "#FFFFFF", borderRadius: 22, padding: 17, borderWidth: 1, borderColor: "#E7EAF0", marginBottom: 12 },
  cardHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: "#20212D", fontSize: 17, fontWeight: "800" },
  segmentedControl: { flexDirection: "row", alignItems: "center", borderRadius: 18, backgroundColor: "#F2F4F8", padding: 3, gap: 2 },
  segmentActive: { backgroundColor: "#FFFFFF", color: "#20212D", fontSize: 11, fontWeight: "800", paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, shadowColor: "#1F2937", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentText: { color: "#A0A5B0", fontSize: 11, paddingHorizontal: 8 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  legendPill: { color: "#656B78", fontSize: 10, fontWeight: "700", backgroundColor: "#F2F4F8", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 },
  legendItem: { color: "#9AA0AC", fontSize: 10 },
  blueDot: { color: "#26B4E9" },
  purpleDot: { color: "#A97DE8" },
  chart: { height: 150, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 10 },
  chartColumn: { flex: 1, alignItems: "center", height: 140 },
  barArea: { height: 116, justifyContent: "flex-end", alignItems: "center" },
  bar: { width: 19, borderRadius: 5 },
  barBlue: { backgroundColor: "#27B5EA" },
  barEmpty: { backgroundColor: "#E1E4E9" },
  chartLabel: { color: "#9DA2AC", fontSize: 10, marginTop: 7 },
  chartLabelActive: { color: "#20212D", fontWeight: "800" },
  emptyChart: { color: "#A0A5B0", fontSize: 11, textAlign: "center", marginTop: -3 },
  newWorkout: { backgroundColor: "#347DF2", minHeight: 86, borderRadius: 20, paddingHorizontal: 22, paddingVertical: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, shadowColor: "#347DF2", shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  newWorkoutTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  newWorkoutSubtitle: { color: "#DDEAFF", fontSize: 11, marginTop: 7 },
  playButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#65A1FF", alignItems: "center", justifyContent: "center" },
  playIcon: { color: "#FFFFFF", fontSize: 15, marginLeft: 2 },
  continueCard: { backgroundColor: "#FFFFFF", minHeight: 82, borderRadius: 20, paddingHorizontal: 17, paddingVertical: 14, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E7EAF0", marginBottom: 23 },
  continueIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#F1F3F7", alignItems: "center", justifyContent: "center", marginRight: 12 },
  continueIconText: { color: "#20212D", fontSize: 22 },
  continueCopy: { flex: 1 },
  continueTitle: { color: "#20212D", fontSize: 16, fontWeight: "800" },
  continueSubtitle: { color: "#7D828F", fontSize: 11, marginTop: 5 },
  chevron: { color: "#8A909B", fontSize: 27, fontWeight: "300", marginLeft: 8 },
  sectionTitle: { color: "#20212D", fontSize: 18, fontWeight: "800", marginBottom: 11 },
  exerciseList: { gap: 9 },
  exerciseRow: { backgroundColor: "#FFFFFF", minHeight: 70, borderRadius: 17, paddingHorizontal: 13, paddingVertical: 11, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E7EAF0" },
  exerciseIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  exerciseIconText: { color: "#20212D", fontSize: 22, fontWeight: "700" },
  exerciseCopy: { flex: 1 },
  exerciseName: { color: "#20212D", fontSize: 15, fontWeight: "800" },
  exerciseMeta: { color: "#858B97", fontSize: 11, marginTop: 4, textTransform: "capitalize" },
  privacyNote: { paddingVertical: 19, alignItems: "center" },
  privacyTitle: { color: "#555B68", fontSize: 11, fontWeight: "800" },
  privacyText: { color: "#9CA2AC", fontSize: 10, textAlign: "center", marginTop: 5, lineHeight: 15 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
