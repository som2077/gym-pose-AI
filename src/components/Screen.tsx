import { type PropsWithChildren, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  bottomBar?: ReactNode;
  contentPadding?: number;
}>;

export function Screen({
  children,
  scroll = true,
  bottomBar,
  contentPadding = 20,
}: ScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingHorizontal: contentPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
      {bottomBar}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F9FC" },
  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 8, paddingBottom: 28 },
});
