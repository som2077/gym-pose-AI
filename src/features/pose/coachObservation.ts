import type { Landmark } from "react-native-nitro-pose-exercises";
import type { ExerciseId } from "../exercises/types";
import type { CoachHint } from "../workout/coachText";
import { isReliableJoint } from "./tracking";

export type CoachObservation = {
  hint: CoachHint | null;
  phase: "up" | "down" | null;
};
const names: Record<number, CoachHint> = {
  11: "shoulder",
  12: "shoulder",
  13: "elbow",
  14: "elbow",
  15: "wrist",
  16: "wrist",
  23: "hip",
  24: "hip",
  25: "knee",
  26: "knee",
  27: "ankle",
  28: "ankle",
};

/** Name only a genuinely missing joint on the best-visible coherent chain. */
export function missingJointHint(
  points: readonly Landmark[],
  exerciseId: ExerciseId,
): CoachHint | null {
  const chains =
    exerciseId === "bicep-curl-front"
      ? [[11, 13, 15, 12, 14, 16]]
      : exerciseId === "squat-side"
        ? [
            [11, 23, 25, 27],
            [12, 24, 26, 28],
          ]
        : [
            [11, 13, 15, 23, 27],
            [12, 14, 16, 24, 28],
          ];
  const visible = (index: number) =>
    isReliableJoint(points[index], exerciseId === "pushup-side" ? 0.45 : 0.6);
  const score = (chain: number[]) => chain.filter(visible).length;
  const chain = chains.reduce((best, next) =>
    score(next) > score(best) ? next : best,
  );
  if (score(chain) === 0) return "body";
  const missing = chain.find((index) => !visible(index));
  return missing === undefined ? null : names[missing];
}
