import { useLocalSearchParams } from 'expo-router';

import { SetupScreen } from '../src/features/workout/SetupScreen';

export default function SetupRoute() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string | string[] }>();
  const selectedExerciseId = Array.isArray(exerciseId) ? exerciseId[0] : exerciseId;

  return <SetupScreen exerciseId={selectedExerciseId} />;
}
