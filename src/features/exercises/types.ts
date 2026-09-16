export type CameraView = "side" | "front" | "three-quarter";

export type ExerciseId = "squat-side" | "pushup-side" | "bicep-curl-front";

export type LandmarkName =
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftWrist"
  | "rightWrist"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftAnkle"
  | "rightAnkle";

export type AngleRange = Readonly<{
  min: number;
  max: number;
}>;

export type FormCheckDefinition = Readonly<{
  id: string;
  label: string;
  severity: "major" | "minor";
  cue: string;
}>;

export type ExerciseConfig = Readonly<{
  id: ExerciseId;
  name: string;
  shortDescription: string;
  targetMuscles: readonly string[];
  requiredView: CameraView;
  placementInstruction: string;
  requiredLandmarks: readonly LandmarkName[];
  primaryAngle: string;
  startRange: AngleRange;
  endRange: AngleRange;
  formChecks: readonly FormCheckDefinition[];
}>;
