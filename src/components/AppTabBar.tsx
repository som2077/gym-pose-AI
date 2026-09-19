import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export type AppTab = "home" | "history" | "settings";

const TABS: ReadonlyArray<{
  key: AppTab;
  label: string;
  icon: string;
  path: "/" | "/history" | "/settings";
}> = [
  { key: "home", label: "Home", icon: "⌂", path: "/" },
  { key: "history", label: "History", icon: "▣", path: "/history" },
  { key: "settings", label: "Settings", icon: "⚙", path: "/settings" },
];

export function AppTabBar({ activeTab }: { activeTab: AppTab }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={tab.label}
            onPress={() => router.replace(tab.path)}
            style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, active && styles.activeIconWrap]}>
              <Text style={[styles.icon, active && styles.activeIcon]}>
                {tab.icon}
              </Text>
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E8EE",
  },
  tab: { alignItems: "center", minWidth: 72, gap: 3 },
  iconWrap: {
    width: 48,
    height: 30,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconWrap: { backgroundColor: "#DFF3FF" },
  icon: { color: "#727986", fontSize: 23, lineHeight: 25 },
  activeIcon: { color: "#1976D2" },
  label: { color: "#6B7280", fontSize: 11, fontWeight: "600" },
  activeLabel: { color: "#20212D", fontWeight: "800" },
  pressed: { opacity: 0.68 },
});
