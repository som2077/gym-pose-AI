import type { Landmark } from "react-native-nitro-pose-exercises";
import type { ExerciseId } from "../exercises/types";

export type FrameSize = { width: number; height: number };
export const JOINT_VISIBILITY = 0.6;
export const STALE_POSE_MS = 500;

export function isReliableJoint(
  point: Landmark | undefined,
  threshold = JOINT_VISIBILITY,
): boolean {
  return Boolean(
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    Number.isFinite(point.visibility) &&
    point.visibility >= threshold &&
    point.x > 0 &&
    point.x < 1 &&
    point.y > 0 &&
    point.y < 1,
  );
}

/** Match the camera's centered cover transform, without stretching the pose. */
export function projectJoint(
  point: Landmark,
  frame: FrameSize,
  viewport: FrameSize,
) {
  const scale = Math.max(
    viewport.width / frame.width,
    viewport.height / frame.height,
  );
  return {
    x:
      point.x * frame.width * scale +
      (viewport.width - frame.width * scale) / 2,
    y:
      point.y * frame.height * scale +
      (viewport.height - frame.height * scale) / 2,
  };
}

/** Side views need one visible chain; front curls need both arms. */
export function hasExerciseJoints(
  points: readonly Landmark[],
  exercise: ExerciseId,
): boolean {
  const visible = (indices: number[]) =>
    indices.every((index) => isReliableJoint(points[index]));
  if (exercise === "bicep-curl-front") return visible([11, 13, 15, 12, 14, 16]);
  if (exercise === "squat-side")
    return visible([11, 23, 25, 27]) || visible([12, 24, 26, 28]);
  return visible([11, 13, 15, 23, 27]) || visible([12, 14, 16, 24, 28]);
}

/** Display-only smoothing. Hidden joints reset immediately on loss. */
export class PoseSmoother {
  constructor(
    private readonly acquireThreshold = JOINT_VISIBILITY,
    private readonly retainThreshold = 0.5,
  ) {}
  private previous: readonly Landmark[] = [];
  private timestamp = 0;

  reset() {
    this.previous = [];
    this.timestamp = 0;
  }

  update(points: readonly Landmark[], timestamp: number): readonly Landmark[] {
    if (timestamp === this.timestamp && this.previous.length > 0)
      return this.previous;
    const elapsed = timestamp - this.timestamp;
    const previous =
      elapsed > 0 && elapsed < STALE_POSE_MS ? this.previous : [];
    this.timestamp = timestamp;
    this.previous = points.slice(0, 33).map((point, index) => {
      const old = previous[index];
      // Hysteresis avoids flicker around the acquisition threshold.
      const visible = isReliableJoint(
        point,
        old && old.visibility > 0
          ? this.retainThreshold
          : this.acquireThreshold,
      );
      if (!visible) return { ...point, visibility: 0 };
      if (!old || old.visibility === 0) return point;
      const distance = Math.hypot(point.x - old.x, point.y - old.y);
      const response = Math.min(0.9, 0.3 + distance * 12);
      const alpha = 1 - Math.pow(1 - response, Math.min(elapsed, 150) / 66);
      return {
        ...point,
        x: old.x + (point.x - old.x) * alpha,
        y: old.y + (point.y - old.y) * alpha,
      };
    });
    return this.previous;
  }
}
