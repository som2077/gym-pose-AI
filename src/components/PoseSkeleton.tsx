import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { type Landmark } from 'react-native-nitro-pose-exercises';

type PoseSkeletonProps = {
  landmarks: readonly Landmark[];
};

const CONNECTIONS: readonly (readonly [number, number])[] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [24, 26], [26, 28], [27, 29], [29, 31], [28, 30], [30, 32],
];

function isVisible(landmark: Landmark | undefined): landmark is Landmark {
  return Boolean(landmark && landmark.visibility >= 0.2);
}

/** Renders the live, on-device ML Kit landmarks over the camera preview. */
export function PoseSkeleton({ landmarks }: PoseSkeletonProps) {
  if (landmarks.length < 33) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg height="100%" preserveAspectRatio="none" style={StyleSheet.absoluteFill} viewBox="0 0 1 1" width="100%">
        {CONNECTIONS.map(([from, to]) => {
          const start = landmarks[from];
          const end = landmarks[to];
          if (!isVisible(start) || !isVisible(end)) {
            return null;
          }

          return <Line key={`${from}-${to}`} stroke="#84F7C5" strokeLinecap="round" strokeOpacity={0.92} strokeWidth={0.008} x1={start.x} x2={end.x} y1={start.y} y2={end.y} />;
        })}
        {landmarks.map((landmark, index) => isVisible(landmark) ? (
          <Circle key={index} cx={landmark.x} cy={landmark.y} fill="#E8FFF4" r={0.011} stroke="#168E5D" strokeWidth={0.004} />
        ) : null)}
      </Svg>
    </View>
  );
}
