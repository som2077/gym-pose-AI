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
import { localizedExerciseName, workoutUiText } from "./uiText";

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
  const copy = workoutUiText(language);
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
        label={copy.back}
        variant="secondary"
        onPress={() => router.back()}
      />
      <Text style={styles.eyebrow}>{copy.cameraSetup}</Text>
      <Text style={styles.title}>{localizedExerciseName(configuredExercise.id, language, configuredExercise.name)} {copy.setupSuffix}</Text>
      <Text style={styles.subtitle}>
        {copy.setupSubtitle}
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
          <Text style={styles.instructionTitle}>{copy.phonePlacement}</Text>
          <Text style={styles.instructionText}>
            {language === "es" ? exerciseCoach[configuredExercise.id].setup.es : configuredExercise.placementInstruction}
          </Text>
        </View>
      </View>
      <View style={styles.instructionCard}>
        <Text style={styles.instructionIcon}>02</Text>
        <View style={styles.instructionContent}>
          <Text style={styles.instructionTitle}>{copy.privacyFirst}</Text>
          <Text style={styles.instructionText}>
            {copy.setupPrivacy}
          </Text>
        </View>
      </View>
      <View style={styles.spacer} />
      <PrimaryButton label={copy.startCalibration} onPress={startSetup} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: "#347DF2",
    fontSize: 12,
    letterSpacing: 1.4,
    fontWeight: "800",
    marginTop: 28,
    marginBottom: 10,
  },
  title: {
    color: "#20212D",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  subtitle: {
    color: "#777D89",
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
    borderColor: "#E7EAF0",
  },
  instructionIcon: {
    color: "#347DF2",
    fontSize: 13,
    fontWeight: "900",
    paddingTop: 1,
  },
  instructionContent: { flex: 1, gap: 4 },
  instructionTitle: { color: "#20212D", fontSize: 15, fontWeight: "800" },
  instructionText: { color: "#777D89", fontSize: 13, lineHeight: 19 },
  spacer: { flex: 1, minHeight: 24 },
});
