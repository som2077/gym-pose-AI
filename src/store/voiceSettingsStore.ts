import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { isCoachLanguage, type CoachLanguage } from "../features/workout/coachText";

type Settings = {
  enabled: boolean;
  language: CoachLanguage;
  guidance: "full" | "counts";
};
type VoiceSettings = Settings & {
  hydrated: boolean;
  storageError: boolean;
  update: (settings: Partial<Settings>) => void;
};
const key = "gym-pose-voice-settings-v1";
let edited = false;
let writes = Promise.resolve();
export const useVoiceSettings = create<VoiceSettings>((set, get) => ({
  enabled: true,
  language: "hi",
  guidance: "full",
  hydrated: false,
  storageError: false,
  update: (settings) => {
    edited = true;
    set(settings);
    const { enabled, language, guidance } = get();
    writes = writes
      .then(() =>
        AsyncStorage.setItem(
          key,
          JSON.stringify({ enabled, language, guidance }),
        ),
      )
      .then(() => set({ storageError: false }))
      .catch(() => set({ storageError: true }));
  },
}));
void AsyncStorage.getItem(key)
  .then((raw) => {
    if (!raw || edited) return;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return;
    const saved = data as Record<string, unknown>;
    useVoiceSettings.setState({
      enabled: typeof saved.enabled === "boolean" ? saved.enabled : true,
      language: isCoachLanguage(saved.language) ? saved.language : "hi",
      guidance: saved.guidance === "counts" ? "counts" : "full",
    });
  })
  .catch(() => useVoiceSettings.setState({ storageError: true }))
  .finally(() => useVoiceSettings.setState({ hydrated: true }));
