export type Point2D = Readonly<{
  x: number;
  y: number;
}>;

export type PoseLandmark = Point2D &
  Readonly<{
    name: string;
    confidence: number;
  }>;

export type PoseFrame = Readonly<{
  landmarks: Readonly<Record<string, PoseLandmark | undefined>>;
  timestampMs: number;
}>;

export type PoseAvailability = "ready" | "low-confidence" | "unavailable";
