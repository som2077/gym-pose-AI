import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../components/PrimaryButton";
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
    <Screen>
      <PrimaryButton
        label="← Back"
        variant="secondary"
        onPress={() => router.back()}
      />
      <View style={styles.icon}>
        <Text style={styles.iconText}>LOCAL</Text>
      </View>
      <Text style={styles.title}>Your workout history</Text>
      <Text style={styles.copy}>
        Saved summaries device par rehte hain. Camera video save nahi hota.
      </Text>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#0F9F68" />
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
  icon: {
    width: 68,
    height: 68,
    marginTop: 60,
    marginBottom: 22,
    borderRadius: 20,
    backgroundColor: "#E2F6EA",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { color: "#0B8B5A", fontSize: 10, fontWeight: "900" },
  title: {
    color: "#173229",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  copy: { color: "#60736B", fontSize: 16, lineHeight: 23, marginTop: 12 },
  loading: { minHeight: 120, justifyContent: "center", alignItems: "center" },
  card: {
    marginTop: 28,
    borderRadius: 18,
    padding: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E5DF",
  },
  cardTitle: {
    color: "#0B8B5A",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },
  cardText: { color: "#60736B", lineHeight: 20 },
  sessionList: { gap: 12, marginTop: 28 },
  sessionCard: {
    borderRadius: 18,
    padding: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E5DF",
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  sessionTitle: { color: "#173229", fontSize: 16, fontWeight: "800" },
  sessionDate: { color: "#72847B", fontSize: 12 },
  sessionMetrics: {
    color: "#0B8B5A",
    marginTop: 8,
    fontSize: 13,
    fontWeight: "700",
  },
});
