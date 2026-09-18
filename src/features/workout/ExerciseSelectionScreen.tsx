import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { EXERCISES } from "../exercises/config";
import { useWorkoutStore } from "../../store/workoutStore";

export function ExerciseSelectionScreen() {
  const selectExercise = useWorkoutStore((state) => state.selectExercise);

  function chooseExercise(exerciseId: (typeof EXERCISES)[number]["id"]): void {
    selectExercise(exerciseId);
    router.push({ pathname: "/setup", params: { exerciseId } });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.brandLockup}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandText}>GYM</Text>
          </View>
          <View>
            <Text style={styles.brandName}>POSE AI</Text>
            <Text style={styles.brandCaption}>Your movement, in focus.</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open workout history"
          onPress={() => router.push("/history")}
          style={styles.historyButton}
        >
          <Text style={styles.historyLabel}>History ↗</Text>
        </Pressable>
      </View>
      <Text style={styles.eyebrow}>ON-DEVICE FORM COACH</Text>
      <Text style={styles.title}>Train with{`\n`}better form.</Text>
      <Text style={styles.subtitle}>
        Phone camera se live rep counting aur short Hinglish coaching. Video
        upload nahi hota.
      </Text>

      <View style={styles.featureRow}>
        <View style={styles.featureChip}>
          <View style={styles.liveDot} />
          <Text style={styles.featureText}>Live tracking</Text>
        </View>
        <View style={styles.featureChip}>
          <Text style={styles.featureText}>Rep counting</Text>
        </View>
        <View style={styles.featureChip}>
          <Text style={styles.featureText}>Private</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Choose an exercise</Text>
        <Text style={styles.sectionMeta}>3 supported</Text>
      </View>

      <View style={styles.exerciseList}>
        {EXERCISES.map((exercise, index) => (
          <Pressable
            key={exercise.id}
            accessibilityRole="button"
            accessibilityLabel={`Set up ${exercise.name}, ${exercise.requiredView} view`}
            onPress={() => chooseExercise(exercise.id)}
            style={({ pressed }) => [
              styles.exerciseCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View
              style={[
                styles.exerciseBadge,
                index === 1 && styles.exerciseBadgeBlue,
                index === 2 && styles.exerciseBadgeOrange,
              ]}
            >
              <Text style={styles.exerciseBadgeText}>0{index + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDescription}>
                {exercise.shortDescription}
              </Text>
              <Text style={styles.muscleLabel}>
                {exercise.targetMuscles.join(" · ")}
              </Text>
              <View style={styles.cameraChip}>
                <Text style={styles.cameraHint}>
                  {exercise.requiredView === "side"
                    ? "SIDE VIEW"
                    : "FRONT VIEW"}{" "}
                  ↗
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>Private by design</Text>
        <Text style={styles.privacyText}>
          Pose analysis device par hoti hai. Workout camera video save ya cloud
          par upload nahi hota.
        </Text>
      </View>
      <PrimaryButton
        label="View workout history"
        variant="secondary"
        onPress={() => router.push("/history")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 36,
  },
  brandLockup: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  brandName: {
    color: "#173229",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  brandCaption: { color: "#6D7E76", fontSize: 10, marginTop: 3 },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8BE8BF",
  },
  brandText: { color: "#173229", fontSize: 10, fontWeight: "900" },
  historyButton: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E7F0EB",
  },
  historyLabel: { color: "#173229", fontSize: 12, fontWeight: "700" },
  featureRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 22 },
  featureChip: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#CDE8D9",
    borderRadius: 99,
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: "#EAF8F0",
  },
  featureText: { color: "#3C6A55", fontSize: 11, fontWeight: "600" },
  liveDot: { height: 5, width: 5, borderRadius: 3, backgroundColor: "#0F9F68" },
  eyebrow: {
    color: "#0B8B5A",
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginBottom: 10,
  },
  title: {
    color: "#173229",
    fontSize: 40,
    lineHeight: 45,
    fontWeight: "900",
    letterSpacing: -1.2,
  },
  subtitle: {
    color: "#60736B",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 14,
    maxWidth: 330,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 38,
    marginBottom: 12,
  },
  sectionTitle: { color: "#173229", fontSize: 20, fontWeight: "800" },
  sectionMeta: { color: "#72847B", fontSize: 13, fontWeight: "700" },
  exerciseList: { gap: 12 },
  exerciseCard: {
    minHeight: 138,
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "#D9E5DF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#19372A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  exerciseBadge: {
    width: 45,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DDF6E8",
  },
  exerciseBadgeBlue: { backgroundColor: "#E0EFF8" },
  exerciseBadgeOrange: { backgroundColor: "#FFF0DB" },
  exerciseBadgeText: { color: "#24523E", fontWeight: "900", fontSize: 15 },
  exerciseInfo: { flex: 1, gap: 3 },
  exerciseName: { color: "#173229", fontSize: 18, fontWeight: "800" },
  exerciseDescription: { color: "#60736B", fontSize: 13, lineHeight: 18 },
  muscleLabel: { color: "#72847B", fontSize: 11, marginTop: 2 },
  cameraChip: {
    alignSelf: "flex-start",
    marginTop: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#E2F6EA",
  },
  cameraHint: {
    color: "#087A4E",
    fontSize: 9,
    letterSpacing: 0.7,
    fontWeight: "800",
  },
  chevron: { color: "#7B9187", fontSize: 28, lineHeight: 28 },
  privacyCard: {
    marginTop: 22,
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#EAF8F0",
    borderWidth: 1,
    borderColor: "#C8EAD6",
  },
  privacyTitle: { color: "#236347", fontWeight: "800", marginBottom: 5 },
  privacyText: { color: "#4E7763", fontSize: 13, lineHeight: 19 },
});
