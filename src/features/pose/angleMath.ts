import { type Point2D } from "./types";

const RADIANS_TO_DEGREES = 180 / Math.PI;

export function calculateAngleDegrees(
  first: Point2D,
  vertex: Point2D,
  third: Point2D,
): number {
  const firstVector = { x: first.x - vertex.x, y: first.y - vertex.y };
  const thirdVector = { x: third.x - vertex.x, y: third.y - vertex.y };
  const dotProduct =
    firstVector.x * thirdVector.x + firstVector.y * thirdVector.y;
  const firstMagnitude = Math.hypot(firstVector.x, firstVector.y);
  const thirdMagnitude = Math.hypot(thirdVector.x, thirdVector.y);

  if (firstMagnitude === 0 || thirdMagnitude === 0) {
    return 0;
  }

  const cosine = Math.min(
    1,
    Math.max(-1, dotProduct / (firstMagnitude * thirdMagnitude)),
  );
  return Math.acos(cosine) * RADIANS_TO_DEGREES;
}

export function isAngleInRange(
  angle: number,
  range: Readonly<{ min: number; max: number }>,
): boolean {
  return angle >= range.min && angle <= range.max;
}
