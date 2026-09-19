import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import type { ExerciseId } from "../exercises/types";
import type { CoachObservation } from "../pose/coachObservation";
import { useWorkoutStore } from "../../store/workoutStore";
import { coachText, countdownText, exerciseCoach } from "./coachText";
import { ReadyCountdown } from "./readyCountdown";
import { useVoiceCoach } from "./useVoiceCoach";
import { localizedFeedback } from "./uiText";

export function useWorkoutCoach(exerciseId: ExerciseId | undefined) {
  const voice = useVoiceCoach();
  const { say, stop, language, active } = voice;
  const mode = useWorkoutStore((state) => state.mode);
  const [poseReady, setPoseReady] = useState(false);
  const [armed, setArmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [observation, setObservation] = useState<CoachObservation>({
    hint: "body",
    phase: null,
  });
  const readyRef = useRef(false);
  const armedRef = useRef(false);
  const countdownRef = useRef(new ReadyCountdown());
  const reportedLost = useRef(false);

  const cancelStart = useCallback(() => {
    armedRef.current = false;
    countdownRef.current.cancel();
    setArmed(false);
    setCountdown(null);
  }, []);
  const suspend = useCallback(() => {
    const current = useWorkoutStore.getState();
    if (current.mode === "tracking" || armedRef.current) current.pauseWorkout();
    readyRef.current = false;
    setPoseReady(false);
    cancelStart();
    stop();
  }, [cancelStart, stop]);
  useFocusEffect(useCallback(() => () => suspend(), [suspend]));
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") suspend();
    });
    return () => subscription.remove();
  }, [suspend]);

  const handleReady = useCallback(
    (ready: boolean) => {
      if (readyRef.current && !ready) {
        countdownRef.current.update(false, Date.now());
        setCountdown(null);
        // Cancel countdown immediately. During tracking, the debounced lost
        // alert interrupts speech; a native session reset must not clip Go.
        if (useWorkoutStore.getState().mode !== "tracking") stop();
      }
      readyRef.current = ready;
      setPoseReady(ready);
    },
    [stop],
  );

  const start = useCallback(() => {
    if (!active || armedRef.current) return;
    useWorkoutStore.getState().beginCalibration();
    countdownRef.current.request();
    armedRef.current = true;
    setArmed(true);
    say({
      id: "waiting",
      text: coachText.waiting[language],
      priority: 80,
      cooldownMs: 0,
    });
  }, [active, language, say]);
  const pause = useCallback(() => {
    cancelStart();
    useWorkoutStore.getState().pauseWorkout();
    readyRef.current = false;
    setPoseReady(false);
    stop();
    say({
      id: "paused",
      text: coachText.paused[language],
      priority: 100,
      cooldownMs: 0,
    });
  }, [cancelStart, language, say, stop]);

  useEffect(() => {
    if (!active || !armed) return;
    const timer = setInterval(() => {
      if (!armedRef.current) return;
      const state = countdownRef.current.update(readyRef.current, Date.now());
      if (state.changed) {
        setCountdown(state.value);
        if (state.value !== null)
          say({
            id: "countdown",
            text: countdownText(state.value, language),
            priority: 100,
            cooldownMs: 0,
          });
      }
      if (state.start) {
        cancelStart();
        reportedLost.current = false;
        const store = useWorkoutStore.getState();
        if (store.sessionStartedAt === null) store.startTracking();
        else store.resumeWorkout();
      }
    }, 100);
    return () => clearInterval(timer);
  }, [active, armed, language, say, cancelStart]);

  // Delay alerts slightly so a single dropped frame does not generate speech.
  useEffect(() => {
    if (!active || mode !== "tracking") return;
    if (poseReady) {
      if (reportedLost.current) {
        reportedLost.current = false;
        stop();
        say({
          id: "regained",
          text: coachText.regained[language],
          priority: 80,
        });
      }
      return;
    }
    const timer = setTimeout(() => {
      reportedLost.current = true;
      say({ id: "lost", text: coachText.lost[language], priority: 90 });
    }, 650);
    return () => clearTimeout(timer);
  }, [active, mode, poseReady, language, say, stop]);

  useEffect(() => {
    if (
      !active ||
      mode === "paused" ||
      mode === "finished" ||
      countdown !== null
    )
      return;
    const hint = observation.hint;
    if (!hint) return;
    const speakHint = () =>
      say(
        {
          id: `hint-${hint}`,
          text: coachText[hint][language],
          priority: poseReady ? 40 : 70,
          cooldownMs: 8000,
        },
        true,
      );
    const delay = setTimeout(speakHint, 2200);
    const repeat = setInterval(speakHint, 8500);
    return () => {
      clearTimeout(delay);
      clearInterval(repeat);
    };
  }, [active, mode, countdown, observation.hint, poseReady, language, say]);

  useEffect(() => {
    if (
      !active ||
      !poseReady ||
      armed ||
      (mode !== "calibrating" && mode !== "ready")
    )
      return;
    say({ id: "ready", text: coachText.ready[language], priority: 70 });
  }, [active, poseReady, armed, mode, language, say]);

  useEffect(() => {
    if (
      !active ||
      !exerciseId ||
      !poseReady ||
      mode !== "tracking" ||
      observation.hint
    )
      return;
    const phase = observation.phase;
    if (!phase) return;
    // Only a stable phase triggers a cue, with a shared cooldown across phases.
    const timer = setTimeout(
      () =>
        say(
          {
            id: "phase",
            text: exerciseCoach[exerciseId][phase][language],
            priority: 20,
            cooldownMs: 7000,
          },
          true,
        ),
      500,
    );
    return () => clearTimeout(timer);
  }, [
    active,
    exerciseId,
    mode,
    poseReady,
    observation.phase,
    observation.hint,
    language,
    say,
  ]);

  const handleRep = useCallback(
    (clean: boolean) => {
      const current = useWorkoutStore.getState();
      // A confirmed tracker rep is authoritative; display-readiness debounce
      // must not discard it on a brief frame drop at the end of the movement.
      if (!active || current.mode !== "tracking") return;
      current.recordRep(clean);
      const rep = useWorkoutStore.getState().totalReps;
      say({ id: `rep-${rep}`, text: String(rep), priority: 60, once: true });
    },
    [active, say],
  );

  const handleFeedback = useCallback(
    (feedback: {
      status: "correct" | "warning" | "incorrect" | "unavailable";
      message: string;
      ruleName?: string;
    }) => {
      useWorkoutStore.getState().setFeedback(
        feedback.status,
        localizedFeedback(feedback.message, language, feedback.ruleName),
      );
      if (
        !active ||
        !readyRef.current ||
        useWorkoutStore.getState().mode !== "tracking"
      )
        return;
      const key =
        feedback.ruleName === "leaningForward"
          ? "torso"
          : feedback.ruleName === "elbowFlare"
            ? "elbows"
            : feedback.ruleName === "swinging"
              ? "control"
              : null;
      if (key)
        say(
          {
            id: `form-${key}`,
            text: coachText[key][language],
            priority: 40,
            cooldownMs: 8000,
          },
          true,
        );
    },
    [active, language, say],
  );

  const replay = useCallback(() => {
    if (!exerciseId || countdown !== null) return;
    const text = exerciseCoach[exerciseId];
    say(
      {
        id: "replay",
        text: `${text.setup[language]} ${text.movement[language]}`,
        priority: 80,
        cooldownMs: 0,
      },
      true,
      true,
    );
  }, [exerciseId, countdown, language, say]);

  return {
    ...voice,
    poseReady,
    armed,
    countdown,
    start,
    pause,
    cancelStart,
    replay,
    handleReady,
    handleRep,
    handleFeedback,
    handleObservation: setObservation,
  };
}
