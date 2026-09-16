import { type ExerciseConfig, type ExerciseId } from './types';

export const EXERCISES: readonly ExerciseConfig[] = [
  {
    id: 'squat-side',
    name: 'Squat',
    shortDescription: 'Depth aur torso position track karo.',
    targetMuscles: ['Quads', 'Glutes'],
    requiredView: 'side',
    placementInstruction: 'Phone ko side mein, hip height par rakho. Sir se ankle tak poora body visible hona chahiye.',
    requiredLandmarks: ['leftShoulder', 'leftHip', 'leftKnee', 'leftAnkle'],
    primaryAngle: 'Knee angle',
    startRange: { min: 155, max: 180 },
    endRange: { min: 65, max: 115 },
    formChecks: [
      { id: 'squat-depth', label: 'Depth', severity: 'major', cue: 'Thoda aur neeche jao.' },
      { id: 'squat-torso', label: 'Torso lean', severity: 'major', cue: 'Chest upar, peeth seedhi rakho.' },
    ],
  },
  {
    id: 'pushup-side',
    name: 'Push-up',
    shortDescription: 'Body line aur elbow range monitor karo.',
    targetMuscles: ['Chest', 'Triceps'],
    requiredView: 'side',
    placementInstruction: 'Phone ko side mein floor level ke qareeb rakho. Head, hip aur ankles frame mein rakho.',
    requiredLandmarks: ['leftShoulder', 'leftElbow', 'leftWrist', 'leftHip', 'leftAnkle'],
    primaryAngle: 'Elbow angle',
    startRange: { min: 145, max: 180 },
    endRange: { min: 55, max: 105 },
    formChecks: [
      { id: 'pushup-depth', label: 'Depth', severity: 'major', cue: 'Thoda aur neeche jao.' },
      { id: 'pushup-line', label: 'Body line', severity: 'major', cue: 'Body ko seedha rakho.' },
    ],
  },
  {
    id: 'bicep-curl-front',
    name: 'Bicep curl',
    shortDescription: 'Elbow range aur arm control track karo.',
    targetMuscles: ['Biceps', 'Forearms'],
    requiredView: 'front',
    placementInstruction: 'Phone ko saamne chest height par rakho. Dono shoulders aur elbows clearly frame mein hon.',
    requiredLandmarks: ['leftShoulder', 'leftElbow', 'leftWrist', 'rightShoulder', 'rightElbow', 'rightWrist'],
    primaryAngle: 'Elbow angle',
    startRange: { min: 145, max: 180 },
    endRange: { min: 35, max: 80 },
    formChecks: [
      { id: 'curl-range', label: 'Range of motion', severity: 'major', cue: 'Curl ko poora complete karo.' },
      { id: 'curl-swing', label: 'Arm swing', severity: 'major', cue: 'Elbow stable rakho.' },
    ],
  },
] as const;

export function getExercise(exerciseId: string | undefined): ExerciseConfig | undefined {
  return EXERCISES.find((exercise) => exercise.id === exerciseId);
}

export function isExerciseId(value: string | undefined): value is ExerciseId {
  return EXERCISES.some((exercise) => exercise.id === value);
}
