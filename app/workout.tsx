import { useLocalSearchParams } from 'expo-router';

import { LiveWorkoutScreen } from '../src/features/workout/LiveWorkoutScreen';

export default function WorkoutRoute() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string | string[] }>();
  const selectedExerciseId = Array.isArray(exerciseId) ? exerciseId[0] : exerciseId;

  return <LiveWorkoutScreen exerciseId={selectedExerciseId} />;
}
