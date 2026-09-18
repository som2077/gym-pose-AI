import { memo, useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";

import { type Landmark } from "react-native-nitro-pose-exercises";
import {
  isReliableJoint,
  projectJoint,
  type FrameSize,
} from "../features/pose/tracking";

type PoseSkeletonProps = {
  landmarks: readonly Landmark[];
  frameSize: FrameSize;
  visibilityThreshold?: number;
};

const CONNECTIONS: readonly (readonly [number, number])[] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
  [27, 29],
  [29, 31],
  [28, 30],
  [30, 32],
];

const JOINTS = [
  0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
];

/** Renders the live, on-device ML Kit landmarks over the camera preview. */
export const PoseSkeleton = memo(function PoseSkeleton({
  landmarks,
  frameSize,
  visibilityThreshold = 0.5,
}: PoseSkeletonProps) {
  const [viewport, setViewport] = useState<FrameSize>({ width: 0, height: 0 });
  const points = landmarks.map((point) =>
    isReliableJoint(point, visibilityThreshold)
      ? projectJoint(point, frameSize, viewport)
      : null,
  );

  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={styles.overlay}
      onLayout={({ nativeEvent: { layout } }) =>
        setViewport({ width: layout.width, height: layout.height })
      }
    >
      {viewport.width > 0 && viewport.height > 0 && (
        <Svg height={viewport.height} width={viewport.width}>
          {CONNECTIONS.map(([from, to]) => {
            const start = points[from];
            const end = points[to];
            if (!start || !end) {
              return null;
            }

            return (
              <Line
                key={`${from}-${to}`}
                stroke="#84F7C5"
                strokeLinecap="round"
                strokeOpacity={0.85}
                strokeWidth={2.5}
                x1={start.x}
                x2={end.x}
                y1={start.y}
                y2={end.y}
              />
            );
          })}
          {JOINTS.map((index) => {
            const point = points[index];
            return point ? (
              <Circle
                key={index}
                cx={point.x}
                cy={point.y}
                fill="#F1FFF8"
                r={4}
                stroke="#168E5D"
                strokeWidth={2}
              />
            ) : null;
          })}
        </Svg>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, overflow: "hidden" },
});
