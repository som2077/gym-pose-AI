import { create } from 'zustand';

import { type ExerciseId } from '../features/exercises/types';
import { type RepPhase } from '../features/workout/repCounter';

export type FormStatus = 'correct' | 'warning' | 'incorrect' | 'unavailable';
export type WorkoutMode = 'idle' | 'calibrating' | 'ready' | 'tracking' | 'paused' | 'finished';

type WorkoutStore = {
  selectedExerciseId: ExerciseId | null;
  mode: WorkoutMode;
  repPhase: RepPhase;
  totalReps: number;
  cleanReps: number;
  formStatus: FormStatus;
  activeFeedback: string | null;
  sessionStartedAt: number | null;
  errorCounts: Readonly<Record<string, number>>;
  selectExercise: (exerciseId: ExerciseId) => void;
  beginCalibration: () => void;
  markReady: () => void;
  startTracking: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  recordRep: (wasClean: boolean) => void;
  setFeedback: (formStatus: FormStatus, feedback: string | null) => void;
  recordError: (errorId: string) => void;
  finishSession: () => void;
  resetWorkout: () => void;
};

const initialWorkoutState = {
  selectedExerciseId: null,
  mode: 'idle' as WorkoutMode,
  repPhase: 'up' as RepPhase,
  totalReps: 0,
  cleanReps: 0,
  formStatus: 'unavailable' as FormStatus,
  activeFeedback: null,
  sessionStartedAt: null,
  errorCounts: {},
};

export const useWorkoutStore = create<WorkoutStore>((set) => ({
  ...initialWorkoutState,
  selectExercise: (exerciseId) => set({ ...initialWorkoutState, selectedExerciseId: exerciseId }),
  beginCalibration: () => set({ mode: 'calibrating', formStatus: 'warning', activeFeedback: 'Body ko guide ke andar position karo.' }),
  markReady: () => set({ mode: 'ready', formStatus: 'correct', activeFeedback: 'Position ready hai.' }),
  startTracking: () => set({ mode: 'tracking', sessionStartedAt: Date.now(), formStatus: 'warning', activeFeedback: 'Pose tracker connect ho raha hai.' }),
  pauseWorkout: () => set({ mode: 'paused', activeFeedback: 'Workout paused hai.' }),
  resumeWorkout: () => set({ mode: 'tracking', activeFeedback: 'Workout resume ho gaya.' }),
  recordRep: (wasClean) => set((state) => ({
    totalReps: state.totalReps + 1,
    cleanReps: state.cleanReps + (wasClean ? 1 : 0),
  })),
  setFeedback: (formStatus, activeFeedback) => set({ formStatus, activeFeedback }),
  recordError: (errorId) => set((state) => ({
    errorCounts: {
      ...state.errorCounts,
      [errorId]: (state.errorCounts[errorId] ?? 0) + 1,
    },
  })),
  finishSession: () => set({ mode: 'finished', activeFeedback: null }),
  resetWorkout: () => set(initialWorkoutState),
}));
