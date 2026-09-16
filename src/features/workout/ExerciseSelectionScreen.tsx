import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '../../components/PrimaryButton';
import { Screen } from '../../components/Screen';
import { EXERCISES } from '../exercises/config';
import { useWorkoutStore } from '../../store/workoutStore';

export function ExerciseSelectionScreen() {
  const selectExercise = useWorkoutStore((state) => state.selectExercise);

  function chooseExercise(exerciseId: (typeof EXERCISES)[number]['id']): void {
    selectExercise(exerciseId);
    router.push({ pathname: '/setup', params: { exerciseId } });
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.brandIcon}><Text style={styles.brandText}>GYM</Text></View>
        <Pressable accessibilityLabel="Open workout history" onPress={() => router.push('/history')} style={styles.historyButton}><Text style={styles.historyLabel}>HISTORY</Text></Pressable>
      </View>
      <Text style={styles.eyebrow}>ON-DEVICE FORM COACH</Text>
      <Text style={styles.title}>Train with{`\n`}better form.</Text>
      <Text style={styles.subtitle}>Phone camera se live rep counting aur short Hinglish coaching. Video upload nahi hota.</Text>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Choose an exercise</Text>
        <Text style={styles.sectionMeta}>3 supported</Text>
      </View>

      <View style={styles.exerciseList}>
        {EXERCISES.map((exercise, index) => (
          <Pressable key={exercise.id} onPress={() => chooseExercise(exercise.id)} style={({ pressed }) => [styles.exerciseCard, pressed && styles.cardPressed]}>
            <View style={[styles.exerciseBadge, index === 1 && styles.exerciseBadgeBlue, index === 2 && styles.exerciseBadgeOrange]}>
              <Text style={styles.exerciseBadgeText}>0{index + 1}</Text>
            </View>
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseDescription}>{exercise.shortDescription}</Text>
              <Text style={styles.cameraHint}>{exercise.requiredView === 'side' ? 'Side camera view' : 'Front camera view'}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle}>Private by design</Text>
        <Text style={styles.privacyText}>Pose analysis device par hoti hai. Workout camera video save ya cloud par upload nahi hota.</Text>
      </View>
      <PrimaryButton label="View workout history" variant="secondary" onPress={() => router.push('/history')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 },
  brandIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#84F7C5' },
  brandText: { color: '#07120E', fontSize: 10, fontWeight: '900' },
  historyButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#18242D' },
  historyLabel: { color: '#E3EEF5', fontSize: 7, fontWeight: '900' },
  eyebrow: { color: '#84F7C5', fontSize: 12, letterSpacing: 1.4, fontWeight: '800', marginBottom: 10 },
  title: { color: '#F5F8FA', fontSize: 40, lineHeight: 45, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { color: '#A7B8C6', fontSize: 16, lineHeight: 23, marginTop: 14, maxWidth: 330 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 38, marginBottom: 12 },
  sectionTitle: { color: '#F5F8FA', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#748795', fontSize: 13, fontWeight: '700' },
  exerciseList: { gap: 12 },
  exerciseCard: { minHeight: 112, borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#24333D', backgroundColor: '#111A22' },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  exerciseBadge: { width: 45, height: 56, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#294735' },
  exerciseBadgeBlue: { backgroundColor: '#263E52' },
  exerciseBadgeOrange: { backgroundColor: '#5A3C22' },
  exerciseBadgeText: { color: '#F5F8FA', fontWeight: '900', fontSize: 15 },
  exerciseInfo: { flex: 1, gap: 3 },
  exerciseName: { color: '#F5F8FA', fontSize: 18, fontWeight: '800' },
  exerciseDescription: { color: '#A7B8C6', fontSize: 13, lineHeight: 18 },
  cameraHint: { color: '#84F7C5', fontSize: 12, fontWeight: '700', marginTop: 3 },
  chevron: { color: '#748795', fontSize: 28, lineHeight: 28 },
  privacyCard: { marginTop: 22, marginBottom: 14, borderRadius: 16, padding: 16, backgroundColor: '#15251F', borderWidth: 1, borderColor: '#264735' },
  privacyTitle: { color: '#BDF9DB', fontWeight: '800', marginBottom: 5 },
  privacyText: { color: '#B9D6C6', fontSize: 13, lineHeight: 19 },
});
