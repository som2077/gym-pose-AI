import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useVoiceSettings } from "../store/voiceSettingsStore";
import { COACH_LANGUAGES, coachLanguages } from "../features/workout/coachText";

export function VoiceCoachControls({
  caption,
  error,
  onReplay,
  replayDisabled = false,
}: {
  caption: string;
  error: boolean;
  onReplay: () => void;
  replayDisabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const { enabled, language, guidance, update, storageError } =
    useVoiceSettings();
  const spanish = language === "es";
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel="Voice coach settings"
          onPress={() => setExpanded(!expanded)}
          style={styles.titleButton}
        >
          <Text style={styles.title}>
            Voice coach ·{" "}
            {enabled ? coachLanguages[language].label : spanish ? "Desactivado" : "Off"}{" "}
            {expanded ? "−" : "+"}
          </Text>
        </Pressable>
        <Switch
          accessibilityLabel="Enable voice coach"
          value={enabled}
          onValueChange={(value) => update({ enabled: value })}
          trackColor={{ false: "#9BACA3", true: "#0F9F68" }}
        />
      </View>
      {!!caption && <Text style={styles.caption}>{caption}</Text>}
      {error && (
        <Text style={styles.warning}>
          {spanish
            ? "Voz no disponible. Comprueba la voz en español y el volumen multimedia del teléfono. Las instrucciones siguen en pantalla."
            : "Voice unavailable. Check your phone’s text-to-speech language and media volume. Instructions remain on screen."}
        </Text>
      )}
      {expanded && (
        <View>
          <View style={styles.options}>
            {COACH_LANGUAGES.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: language === value }}
                onPress={() => update({ language: value })}
                style={[styles.option, language === value && styles.selected]}
              >
                <Text style={styles.optionText}>
                  {coachLanguages[value].label}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.options}>
            {(["full", "counts"] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ checked: guidance === value }}
                onPress={() => update({ guidance: value })}
                style={[styles.option, guidance === value && styles.selected]}
              >
                <Text style={styles.optionText}>
                  {value === "full" ? spanish ? "Guía completa" : "Full guidance" : spanish ? "Solo conteo" : "Counts only"}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.caption}>
            {spanish
              ? "Solo conteo incluye la cuenta atrás, las pausas y las alertas de seguimiento. La voz utiliza el motor de síntesis del teléfono."
              : "Counts only keeps countdown, pause and tracking alerts. Voice uses your phone’s installed speech engine."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: replayDisabled }}
            disabled={replayDisabled}
            onPress={onReplay}
            style={styles.replay}
          >
            <Text style={styles.optionText}>
              {replayDisabled
                ? spanish ? "Cuenta atrás en curso…" : "Countdown in progress…"
                : spanish ? "↻ Repetir instrucciones" : "↻ Instructions dobara suno"}
            </Text>
          </Pressable>
          {storageError && (
            <Text style={styles.warning}>
              {spanish ? "No se pudieron guardar los ajustes en este dispositivo." : "Settings could not be saved on this device."}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9E5DF",
    backgroundColor: "#FFFFFF",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  titleButton: { minHeight: 44, flex: 1, justifyContent: "center" },
  title: { color: "#23473A", fontSize: 13, fontWeight: "800" },
  caption: { color: "#60736B", fontSize: 13, lineHeight: 20, paddingBottom: 8 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  option: {
    flex: 1,
    minWidth: 85,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: "#F5F8F6",
  },
  selected: {
    backgroundColor: "#DDF4E8",
    borderWidth: 1,
    borderColor: "#0B8B5A",
  },
  optionText: { color: "#23473A", fontSize: 13, fontWeight: "700", textAlign: "center" },
  replay: { minHeight: 44, justifyContent: "center" },
  warning: { color: "#8A4D16", fontSize: 12, lineHeight: 18, paddingBottom: 8 },
});
