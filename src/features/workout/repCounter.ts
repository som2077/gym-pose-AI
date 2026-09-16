export type RepPhase = "up" | "transitioning" | "down";

export type RepCounterState = Readonly<{
  phase: RepPhase;
  hasReachedBottom: boolean;
  totalReps: number;
  cleanReps: number;
}>;

export type RepCounterThresholds = Readonly<{
  upEnter: number;
  downEnter: number;
}>;

export const INITIAL_REP_COUNTER_STATE: RepCounterState = {
  phase: "up",
  hasReachedBottom: false,
  totalReps: 0,
  cleanReps: 0,
};

export function advanceRepCounter(
  state: RepCounterState,
  primaryAngle: number,
  thresholds: RepCounterThresholds,
  wasFormCorrect: boolean,
): RepCounterState {
  if (primaryAngle <= thresholds.downEnter) {
    return {
      ...state,
      phase: "down",
      hasReachedBottom: true,
    };
  }

  if (primaryAngle >= thresholds.upEnter && state.hasReachedBottom) {
    return {
      phase: "up",
      hasReachedBottom: false,
      totalReps: state.totalReps + 1,
      cleanReps: state.cleanReps + (wasFormCorrect ? 1 : 0),
    };
  }

  return {
    ...state,
    phase: "transitioning",
  };
}
