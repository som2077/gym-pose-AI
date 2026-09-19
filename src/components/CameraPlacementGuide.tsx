import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path } from "react-native-svg";

import { type CameraView } from "../features/exercises/types";

export function CameraPlacementGuide({
  view,
  pushup = false,
}: {
  view: CameraView;
  pushup?: boolean;
}) {
  const viewLabel =
    view === "side"
      ? "SIDE VIEW"
      : view === "front"
        ? "FRONT VIEW"
        : "45° VIEW";

  return (
    <View
      accessibilityLabel={`Camera placement guide: ${viewLabel}`}
      style={styles.container}
    >
      <View style={styles.labelPill}>
        <Text style={styles.label}>{viewLabel}</Text>
      </View>
      <Svg height="250" width="100%" viewBox="0 0 220 250">
        <Path
          d="M46 20 L174 20 Q200 20 200 46 L200 204 Q200 230 174 230 L46 230 Q20 230 20 204 L20 46 Q20 20 46 20"
          fill="none"
          stroke="#4B5C68"
          strokeDasharray="8 7"
          strokeWidth="2"
        />
        {pushup ? (
          <>
            <Line
              x1="30"
              y1="190"
              x2="196"
              y2="190"
              stroke="#4B5C68"
              strokeWidth="2"
            />
            <Circle
              cx="54"
              cy="116"
              r="12"
              fill="none"
              stroke="#84F7C5"
              strokeWidth="3"
            />
            <Path
              d="M66 128 L121 146 L183 177 L193 188 M68 130 L70 158 L68 186 L53 186"
              fill="none"
              stroke="#84F7C5"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="68" cy="130" r="4" fill="#F1FFF8" />
            <Circle cx="70" cy="158" r="4" fill="#F1FFF8" />
            <Circle cx="68" cy="186" r="4" fill="#F1FFF8" />
            <Circle cx="121" cy="146" r="4" fill="#F1FFF8" />
            <Circle cx="183" cy="177" r="4" fill="#F1FFF8" />
          </>
        ) : (
          <>
            <Circle
              cx="110"
              cy="70"
              r="18"
              fill="none"
              stroke="#84F7C5"
              strokeWidth="3"
            />
            <Line
              x1="110"
              y1="88"
              x2="110"
              y2="148"
              stroke="#84F7C5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Line
              x1="110"
              y1="105"
              x2="75"
              y2="130"
              stroke="#84F7C5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Line
              x1="110"
              y1="105"
              x2="145"
              y2="130"
              stroke="#84F7C5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Line
              x1="110"
              y1="148"
              x2="83"
              y2="205"
              stroke="#84F7C5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Line
              x1="110"
              y1="148"
              x2="137"
              y2="205"
              stroke="#84F7C5"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Circle cx="75" cy="130" r="4" fill="#84F7C5" />
            <Circle cx="145" cy="130" r="4" fill="#84F7C5" />
            <Circle cx="83" cy="205" r="4" fill="#84F7C5" />
            <Circle cx="137" cy="205" r="4" fill="#84F7C5" />
          </>
        )}
      </Svg>
      <Text style={styles.helper}>
        {pushup
          ? "Side se plank position dikhao. Camera wali arm, hip aur feet poore frame mein rakho."
          : "Head se ankles tak body ko dashed frame ke andar rakho."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 285,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7EAF0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    paddingTop: 18,
    shadowColor: "#19372A",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  labelPill: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 99,
    backgroundColor: "#E5F0FF",
  },
  label: {
    color: "#347DF2",
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "800",
  },
  helper: {
    color: "#777D89",
    textAlign: "center",
    fontSize: 13,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
});
