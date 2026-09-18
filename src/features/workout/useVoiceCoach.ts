import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useVoiceSettings } from "../../store/voiceSettingsStore";
import { VoiceCuePlayer, type VoiceCue } from "./voiceCues";
import { coachLanguages } from "./coachText";

// Only the focused screen owns native speech, even with mounted router screens.
let voices: Speech.Voice[] | null = null;
const findVoice = (language: string) =>
  voices?.find(
    (voice) =>
      voice.language.replace("_", "-").split("-")[0] === language.split("-")[0],
  );
const player = new VoiceCuePlayer({
  stop: Speech.stop,
  prepare: async (language) => {
    voices ??= await Speech.getAvailableVoicesAsync();
    const available = !!findVoice(language);
    if (!available) voices = null;
    return available;
  },
  speak: (text, language, onDone, onError) =>
    Speech.speak(text, {
      language: language.split("-")[0],
      voice: findVoice(language)?.identifier,
      rate: 0.94,
      onDone,
      onStopped: onDone,
      onError,
    }),
});
export function useVoiceCoach() {
  const owner = useRef(Symbol("voice-screen")).current;
  const [focused, setFocused] = useState(false);
  const [foreground, setForeground] = useState(
    AppState.currentState === "active",
  );
  const [caption, setCaption] = useState("");
  const [error, setError] = useState(false);
  const settings = useVoiceSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const active = focused && foreground && settings.hydrated;
  const activeRef = useRef(false);
  const stop = useCallback(() => player.cancel(owner), [owner]);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => {
        activeRef.current = false;
        player.release(owner);
        setFocused(false);
      };
    }, [owner]),
  );
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        activeRef.current = false;
        player.release(owner);
      }
      setForeground(state === "active");
    });
    return () => subscription.remove();
  }, [owner]);
  useEffect(() => {
    activeRef.current = active;
    if (!active) return;
    player.activate(owner, (text, failed = false) => {
      setCaption(text);
      setError(failed);
    });
    setCaption("");
    setError(false);
    return () => {
      activeRef.current = false;
      player.release(owner);
    };
  }, [active, owner, settings.enabled, settings.language, settings.guidance]);
  const say = useCallback(
    (cue: VoiceCue, guidance = false, explicit = false) => {
      if (!activeRef.current) return false;
      const preferences = settingsRef.current;
      if (guidance && preferences.guidance === "counts" && !explicit)
        return false;
      return player.say(
        owner,
        cue,
        coachLanguages[preferences.language].locale,
        preferences.enabled,
      );
    },
    [owner],
  );
  return {
    active,
    caption,
    error,
    say,
    stop,
    language: settings.language,
    enabled: settings.enabled,
    guidance: settings.guidance,
  };
}
