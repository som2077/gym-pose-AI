import { Redirect, router } from "expo-router";
import { useCallback, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import { CameraPlacementGuide } from "../../components/CameraPlacementGuide";
import { PrimaryButton } from "../../components/PrimaryButton";
import { Screen } from "../../components/Screen";
import { getExercise } from "../exercises/config";
import { useWorkoutStore } from "../../store/workoutStore";
import { VoiceCoachControls } from "../../components/VoiceCoachControls";
import { useVoiceCoach } from "./useVoiceCoach";
import { exerciseCoach } from "./coachText";

export function SetupScreen({
  exerciseId,
}: {
  exerciseId: string | undefined;
}) {
  const exercise = getExercise(exerciseId);
  const selectExercise = useWorkoutStore((state) => state.selectExercise);
  const beginCalibration = useWorkoutStore((state) => state.beginCalibration);
  const { active, say, stop, language, enabled, guidance, caption, error } =
    useVoiceCoach();
  const replay = useCallback(
    (explicit = true) => {
      if (!exercise) return;
      const text = exerciseCoach[exercise.id];
      say(
        {
          id: "setup",
          text: `${text.setup[language]} ${text.movement[language]}`,
          priority: 80,
          cooldownMs: 0,
        },
        true,
        explicit,
      );
    },
    [exercise, language, say],
  );
  useEffect(() => {
    if (active) replay(false);
  }, [active, replay, enabled, guidance]);

  if (!exercise) {
    return <Redirect href="/" />;
  }

  const configuredExercise = exercise;

  function startSetup(): void {
    stop();
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
      <CameraPlacementGuide
        view={configuredExercise.requiredView}
        pushup={configuredExercise.id === "pushup-side"}
      />
      <VoiceCoachControls
        caption={caption}
        error={error}
        onReplay={() => replay()}
      />
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
    color: "#0B8B5A",
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 10,
  },
  title: {
    color: "#173229",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "#60736B",
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9E5DF",
  },
  instructionIcon: {
    color: "#0B8B5A",
    fontSize: 13,
    fontWeight: "900",
    paddingTop: 1,
  },
  instructionContent: { flex: 1, gap: 4 },
  instructionTitle: { color: "#173229", fontSize: 15, fontWeight: "800" },
  instructionText: { color: "#60736B", fontSize: 13, lineHeight: 19 },
  spacer: { flex: 1, minHeight: 24 },
});
