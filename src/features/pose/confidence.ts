import { type LandmarkName } from "../exercises/types";
import { type PoseFrame } from "./types";

export function hasRequiredLandmarks(
  poseFrame: PoseFrame | undefined,
  requiredLandmarks: readonly LandmarkName[],
  minimumConfidence: number,
): boolean {
  if (!poseFrame) {
    return false;
  }

  return requiredLandmarks.every((landmarkName) => {
    const landmark = poseFrame.landmarks[landmarkName];
    return landmark !== undefined && landmark.confidence >= minimumConfidence;
  });
}
