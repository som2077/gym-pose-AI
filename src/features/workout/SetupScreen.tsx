import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { CameraPlacementGuide } from "../../components/CameraPlacementGuide";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { getExercise } from "../exercises/config";
import { useWorkoutStore } from "../../store/workoutStore";

export function SetupScreen({
  exerciseId,
}: {
  exerciseId: string | undefined;
}) {
  const exercise = getExercise(exerciseId);
  const selectExercise = useWorkoutStore((state) => state.selectExercise);
  const beginCalibration = useWorkoutStore((state) => state.beginCalibration);

  if (!exercise) {
    router.replace("/");
    return null;
  }

  const configuredExercise = exercise;

  function startSetup(): void {
    selectExercise(configuredExercise.id);
    beginCalibration();
    router.push({
      pathname: "/workout",
      params: { exerciseId: configuredExercise.id },
    });
  }

  return (
    <Screen>
      <PrimaryButton
        label="← Back"
        variant="secondary"
        onPress={() => router.back()}
      />
      <Text style={styles.eyebrow}>CAMERA SETUP</Text>
      <Text style={styles.title}>{configuredExercise.name} setup</Text>
      <Text style={styles.subtitle}>
        Reliable coaching ke liye phone placement important hai.
      </Text>
      <CameraPlacementGuide view={configuredExercise.requiredView} />
      <View style={styles.instructionCard}>
        <Text style={styles.instructionIcon}>01</Text>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionTitle}>Phone placement</Text>
          <Text style={styles.instructionText}>
            {configuredExercise.placementInstruction}
          </Text>
        </View>
      </View>
      <View style={styles.instructionCard}>
        <Text style={styles.instructionIcon}>02</Text>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionTitle}>Privacy first</Text>
          <Text style={styles.instructionText}>
            Live camera frames is device par analyse honge. App workout video
            upload nahi karta.
          </Text>
        </View>
      </View>
      <View style={styles.spacer} />
      <PrimaryButton label="Start calibration" onPress={startSetup} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: "#84F7C5",
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 10,
  },
  title: {
    color: "#F5F8FA",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "#A7B8C6",
    marginTop: 10,
    marginBottom: 24,
    lineHeight: 21,
  },
  instructionCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#111A22",
    borderWidth: 1,
    borderColor: "#24333D",
  },
  instructionIcon: {
    color: "#84F7C5",
    fontSize: 13,
    fontWeight: "900",
    paddingTop: 1,
  },
  instructionContent: { flex: 1, gap: 4 },
  instructionTitle: { color: "#F5F8FA", fontSize: 15, fontWeight: "800" },
  instructionText: { color: "#A7B8C6", fontSize: 13, lineHeight: 19 },
  spacer: { flex: 1, minHeight: 24 },
});
