import AsyncStorage from '@react-native-async-storage/async-storage';

import { type ExerciseId } from '../features/exercises/types';

const SESSION_STORAGE_KEY = 'gym-pose-ai:sessions:v1';

export type WorkoutSession = Readonly<{
  id: string;
  exerciseId: ExerciseId;
  completedAt: number;
  durationMs: number;
  totalReps: number;
  cleanReps: number;
  errorCounts: Readonly<Record<string, number>>;
}>;

function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const session = value as Partial<WorkoutSession>;
  return (
    typeof session.id === 'string' &&
    typeof session.exerciseId === 'string' &&
    typeof session.completedAt === 'number' &&
    typeof session.durationMs === 'number' &&
    typeof session.totalReps === 'number' &&
    typeof session.cleanReps === 'number'
  );
}

export async function loadSessions(): Promise<readonly WorkoutSession[]> {
  const serializedSessions = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
  if (!serializedSessions) {
    return [];
  }

  try {
    const parsed = JSON.parse(serializedSessions) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isWorkoutSession).sort((first, second) => second.completedAt - first.completedAt);
  } catch {
    return [];
  }
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const existingSessions = await loadSessions();
  const nextSessions = [session, ...existingSessions].slice(0, 100);
  await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSessions));
}
