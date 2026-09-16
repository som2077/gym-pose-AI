import { type PropsWithChildren } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
}>;

export function Screen({ children, scroll = true }: ScreenProps) {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B1016' },
  scrollContent: { flexGrow: 1, padding: 20 },
});
