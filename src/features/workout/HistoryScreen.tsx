import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppTabBar } from "../../components/AppTabBar";
import { Screen } from "../../components/Screen";
import { getExercise } from "../exercises/config";
import {
  loadSessions,
  type WorkoutSession,
} from "../../storage/sessionRepository";

export function HistoryScreen() {
  const [sessions, setSessions] = useState<readonly WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshHistory = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const storedSessions = await loadSessions();
    setSessions(storedSessions);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  return (
    <Screen contentPadding={16} bottomBar={<AppTabBar activeTab="history" />}>
      <Text style={styles.eyebrow}>YOUR TRAINING LOG</Text>
      <Text style={styles.title}>Your workout history</Text>
      <Text style={styles.copy}>
        Saved summaries device par rehte hain. Camera video save nahi hota.
      </Text>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#347DF2" />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No sessions yet</Text>
          <Text style={styles.cardText}>
            Apna pehla workout complete karo; summary yahan local device par
            save hogi.
          </Text>
        </View>
      ) : (
        <View style={styles.sessionList}>
          {sessions.map((session) => {
            const exercise = getExercise(session.exerciseId);
            const cleanPercentage =
              session.totalReps === 0
                ? 0
                : Math.round((session.cleanReps / session.totalReps) * 100);
            return (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionTitle}>
                    {exercise?.name ?? "Workout"}
                  </Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.completedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.sessionMetrics}>
                  {session.totalReps} reps · {session.cleanReps} clean ·{" "}
                  {cleanPercentage}% form score
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: "#347DF2", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 10, marginBottom: 8 },
  title: {
    color: "#20212D",
    fontSize: 29,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  copy: { color: "#777D89", fontSize: 14, lineHeight: 21, marginTop: 10 },
  loading: { minHeight: 120, justifyContent: "center", alignItems: "center" },
  card: {
    marginTop: 28,
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },
  cardTitle: {
    color: "#347DF2",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardText: { color: "#777D89", lineHeight: 20 },
  sessionList: { gap: 12, marginTop: 28 },
  sessionCard: {
    borderRadius: 18,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionTitle: { color: "#20212D", fontSize: 16, fontWeight: "800" },
  sessionDate: { color: "#8A909B", fontSize: 12 },
  sessionMetrics: {
    color: "#347DF2",
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
  },
});
