import { router } from "expo-router";
import { type ReactNode } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { AppTabBar } from "../../components/AppTabBar";
import { Screen } from "../../components/Screen";
import { useVoiceSettings } from "../../store/voiceSettingsStore";

function SettingRow({
  icon,
  label,
  detail,
  onPress,
  trailing,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress?: () => void;
  trailing?: ReactNode;
}) {
  const content = (
    <>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowSpacer} />
      {detail && <Text style={styles.rowDetail}>{detail}</Text>}
      {trailing ?? <Text style={styles.rowChevron}>›</Text>}
    </>
  );
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

export function SettingsScreen() {
  const enabled = useVoiceSettings((state) => state.enabled);
  const language = useVoiceSettings((state) => state.language);
  const update = useVoiceSettings((state) => state.update);

  return (
    <Screen contentPadding={16} bottomBar={<AppTabBar activeTab="settings" />}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.proCard}>
        <Text style={styles.proEyebrow}>✦ GYM POSE AI</Text>
        <Text style={styles.proTitle}>Train with confidence</Text>
        <Text style={styles.proSubtitle}>On-device coaching, clear feedback and private workout history.</Text>
        <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRIVATE MODE ACTIVE</Text></View>
      </View>

      <View style={styles.group}>
        <SettingRow
          icon="◉"
          label="Voice coach"
          detail={enabled ? "On" : "Off"}
          trailing={<Switch value={enabled} onValueChange={(value) => update({ enabled: value })} trackColor={{ false: "#D8DCE4", true: "#8DBBFF" }} thumbColor={enabled ? "#347DF2" : "#FFFFFF"} />}
        />
        <SettingRow icon="◎" label="Coach language" detail={language === "hi" ? "Hinglish" : "Español"} />
        <SettingRow icon="↻" label="Replay onboarding guide" onPress={() => router.push("/")} />
      </View>

      <View style={styles.group}>
        <SettingRow icon="▣" label="Workout history" onPress={() => router.push("/history")} />
        <SettingRow icon="▤" label="Privacy & data" />
        <SettingRow icon="✓" label="About GYM POSE AI" />
      </View>

      <View style={styles.versionCard}>
        <View style={styles.versionIcon}><Text style={styles.versionIconText}>GP</Text></View>
        <View>
          <Text style={styles.versionTitle}>GYM POSE AI</Text>
          <Text style={styles.versionText}>Version 1.0.0 · Built for private training</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: "#1B1C28", fontSize: 29, fontWeight: "900", letterSpacing: -0.6, marginTop: 8, marginBottom: 20 },
  proCard: { minHeight: 164, borderRadius: 24, padding: 21, backgroundColor: "#282832", overflow: "hidden", marginBottom: 12 },
  proEyebrow: { color: "#FFBF36", fontSize: 11, fontWeight: "900", letterSpacing: 1.1 },
  proTitle: { color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginTop: 13 },
  proSubtitle: { color: "#C7C8D0", fontSize: 12, lineHeight: 18, marginTop: 7, maxWidth: 285 },
  proBadge: { alignSelf: "flex-start", marginTop: 15, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#FFFFFF" },
  proBadgeText: { color: "#282832", fontSize: 10, fontWeight: "900", letterSpacing: 0.4 },
  group: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E7EAF0", overflow: "hidden", marginBottom: 12 },
  row: { minHeight: 59, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F0F1F4" },
  rowIcon: { color: "#1F2330", width: 25, fontSize: 17, textAlign: "center", marginRight: 9 },
  rowLabel: { color: "#282A36", fontSize: 14, fontWeight: "600" },
  rowSpacer: { flex: 1 },
  rowDetail: { color: "#8A909D", fontSize: 12, marginRight: 8 },
  rowChevron: { color: "#9BA0AA", fontSize: 24, fontWeight: "300" },
  versionCard: { borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7EAF0", padding: 15, flexDirection: "row", alignItems: "center", marginBottom: 18 },
  versionIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#E5F0FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  versionIconText: { color: "#347DF2", fontWeight: "900", fontSize: 14 },
  versionTitle: { color: "#282A36", fontSize: 14, fontWeight: "800" },
  versionText: { color: "#9BA0AA", fontSize: 10, marginTop: 4 },
  pressed: { opacity: 0.7 },
});
