import type { Landmark } from "react-native-nitro-pose-exercises";
import { isReliableJoint, STALE_POSE_MS, type FrameSize } from "./tracking";

type Side = "left" | "right";
type Phase = "up" | "down";
const CHAINS = {
  left: [11, 13, 15, 23, 27],
  right: [12, 14, 16, 24, 28],
} as const;

/** Angles must use image pixels: independently normalized x/y distort geometry. */
export function imageAngle(
  a: Landmark,
  b: Landmark,
  c: Landmark,
  size: FrameSize,
): number {
  const ax = (a.x - b.x) * size.width;
  const ay = (a.y - b.y) * size.height;
  const cx = (c.x - b.x) * size.width;
  const cy = (c.y - b.y) * size.height;
  const magnitude = Math.hypot(ax, ay) * Math.hypot(cx, cy);
  return magnitude > 1
    ? (Math.acos(Math.max(-1, Math.min(1, (ax * cx + ay * cy) / magnitude))) *
        180) /
        Math.PI
    : NaN;
}

function sideScore(
  points: readonly Landmark[],
  side: Side,
  size: FrameSize,
): number {
  const indices = CHAINS[side];
  // Floor-level framing often occludes the hip/ankle. A stable shoulder,
  // elbow and wrist chain is enough to count elbow movement.
  if (
    !indices.slice(0, 3).every((index) => isReliableJoint(points[index], 0.45))
  )
    return 0;
  const [shoulder, , wrist] = indices.map((index) => points[index]);
  if (wrist.y < shoulder.y - 0.08) return 0;
  return Math.min(
    ...indices.slice(0, 3).map((index) => points[index].visibility),
  );
}

export type PushupObservation = {
  ready: boolean;
  side: Side | null;
  landmarks: readonly Landmark[];
  message: string;
  status: "correct" | "warning" | "unavailable";
  rep: boolean;
  clean: boolean;
};

/** One coherent visible-side chain, with a debounced up → down → up cycle. */
export class PushupTracker {
  private side: Side | null = null;
  private lastValid = 0;
  private lastSample = -1;
  private candidate: Phase | null = null;
  private candidateSince = 0;
  private phase: Phase | null = null;
  private startedAt: number | null = null;
  private reachedBottom = false;
  private clean = true;

  get currentPhase(): Phase | null {
    return this.phase;
  }

  reset() {
    this.side = null;
    this.lastValid = 0;
    this.lastSample = -1;
    this.resetCycle();
  }

  private resetCycle() {
    this.candidate = null;
    this.phase = null;
    this.startedAt = null;
    this.reachedBottom = false;
    this.clean = true;
  }

  update(
    points: readonly Landmark[],
    size: FrameSize,
    timestamp: number,
  ): PushupObservation {
    const unavailable: PushupObservation = {
      // Rendering is independent of readiness: keep every reliable visible joint.
      ready: false,
      side: this.side,
      landmarks: points.slice(0, 33),
      rep: false,
      clean: false,
      status: "unavailable",
      message:
        "Side se shoulder, elbow, haath aur hip dikhao. Plank position lo.",
    };
    if (!Number.isFinite(timestamp) || timestamp < this.lastSample) {
      this.reset();
      return unavailable;
    }
    if (timestamp - this.lastValid >= STALE_POSE_MS) {
      this.side = null;
      this.resetCycle();
    }
    const fresh = timestamp !== this.lastSample;
    this.lastSample = timestamp;
    const left = sideScore(points, "left", size);
    const right = sideScore(points, "right", size);
    if (!this.side)
      this.side =
        left > 0 || right > 0 ? (left >= right ? "left" : "right") : null;
    if (!this.side || (this.side === "left" ? left : right) === 0) {
      // Never join half a rep from one arm with half from the other.
      this.candidate = null;
      this.clean = false;
      return unavailable;
    }
    this.lastValid = timestamp;
    const [s, e, w, h, a] = CHAINS[this.side];
    const elbow = imageAngle(points[s], points[e], points[w], size);
    const body =
      isReliableJoint(points[a], 0.45) && isReliableJoint(points[h], 0.45)
        ? imageAngle(points[s], points[h], points[a], size)
        : NaN;
    if (!Number.isFinite(elbow)) return unavailable;
    const bodyVisible = Number.isFinite(body);
    const straight = bodyVisible && body >= 155;
    const observation: PushupObservation = {
      ready: true,
      side: this.side,
      rep: false,
      clean: false,
      landmarks: points.slice(0, 33),
      status: straight ? "correct" : "warning",
      message: !bodyVisible
        ? "Arm track ho rahi hai. Reps count hongi; body line ke liye hip aur pair bhi frame mein rakho."
        : straight
          ? "Arm tracked. Neeche jao, phir elbows seedhe karke upar aao."
          : "Hip ko shoulder aur ankle ki line mein rakho.",
    };
    if (!fresh) return observation;
    if (this.startedAt !== null && timestamp - this.startedAt > 15000)
      this.resetCycle();
    if (this.startedAt !== null) this.clean = this.clean && straight;
    const next: Phase | null =
      elbow >= 135 ? "up" : elbow <= 125 ? "down" : null;
    if (!next) {
      this.candidate = null;
      return observation;
    }
    if (next !== this.candidate) {
      this.candidate = next;
      this.candidateSince = timestamp;
      return observation;
    }
    if (timestamp - this.candidateSince < 66 || this.phase === next)
      return observation;
    this.phase = next;
    if (next === "up") {
      observation.rep =
        this.reachedBottom &&
        this.startedAt !== null &&
        timestamp - this.startedAt >= 300;
      observation.clean = observation.rep && this.clean && straight;
      this.startedAt = timestamp;
      this.reachedBottom = false;
      this.clean = straight;
    } else if (this.startedAt !== null) this.reachedBottom = true;
    return observation;
  }
}
