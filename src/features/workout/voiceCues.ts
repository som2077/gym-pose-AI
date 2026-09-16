import * as Speech from "expo-speech";

const COOLDOWN_MS = 2_500;

let lastCue: string | null = null;
let lastCueTimestamp = 0;

export function speakCue(cue: string, now = Date.now()): void {
  const isWithinCooldown = now - lastCueTimestamp < COOLDOWN_MS;
  if (cue === lastCue && isWithinCooldown) {
    return;
  }

  if (isWithinCooldown) {
    return;
  }

  Speech.stop();
  Speech.speak(cue, { rate: 0.92 });
  lastCue = cue;
  lastCueTimestamp = now;
}

export function resetCueCooldown(): void {
  lastCue = null;
  lastCueTimestamp = 0;
}
