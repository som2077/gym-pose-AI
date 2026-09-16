# Project: GYM Pose AI

Build a React Native (Expo) mobile app called **GYM Pose AI** that gives users real-time, on-screen and voice feedback about whether they are performing an exercise with correct form, using live camera-based pose detection.

## Tech Stack

- Expo (bare/dev-client workflow — NOT Expo Go, since real-time frame processing needs native modules)
- `react-native-vision-camera` for camera access and frame processing
- `react-native-fast-tflite` (or a MediaPipe Pose Landmarker plugin) for on-device pose detection — model must run locally, no server round-trip, to keep latency low enough for real-time feedback
- `expo-speech` (or `react-native-tts`) for voice feedback cues
- Zustand for app state (current exercise, rep count, form status)
- NativeWind (Tailwind for React Native) for UI styling
- `expo-router` for navigation

## Core Pipeline

Must run every frame, target 15–30 fps:

1. Capture camera frame via vision-camera frame processor
2. Run pose detection model on frame → output 33 body keypoints (x, y, confidence score) in normalized coordinates
3. From keypoints, calculate relevant joint angles using vector/trigonometry math (angle between three points: e.g. shoulder-elbow-wrist for arm angle, hip-knee-ankle for leg angle)
4. Compare calculated angles against the "ideal range" rules for the currently selected exercise
5. Update rep-counting state machine (see below)
6. Trigger on-screen visual feedback (skeleton overlay, color-coded: green = correct form, red = incorrect) and, on major form breaks, a voice cue

## Exercise Rule Engine

Implement as a config-driven system, not hardcoded per exercise. Each exercise should be defined as a data object containing:

- Name and target muscle group
- List of tracked joint angles (which 3 keypoints define each angle)
- Ideal angle range for the "start" position and "end" position of one rep
- Common form-error checks (e.g. for squats: knees caving inward — compare knee x-position to ankle x-position; back angle exceeding X degrees from vertical)
- Rep-counting thresholds (angle value that marks "down" phase vs "up" phase, with hysteresis to avoid double-counting near the threshold)

Start with **3 exercises** to prove the system: squats, push-ups, bicep curls. Design the config so more exercises can be added later without changing core logic.

## Rep Counting State Machine

- States: `up` (starting position) → `transitioning` → `down` (bottom of rep)
- A rep only counts when the user goes up → down → up in sequence, with angle crossing defined thresholds — this prevents partial-movement false counts
- Track total reps and consecutive correct-form reps separately, so user can see form quality over time, not just count

## Feedback UX

- Skeleton overlay drawn on top of camera preview using the detected keypoints (connect keypoints with lines matching body structure)
- Overlay color changes live based on form correctness (per-joint or whole-body)
- Short voice cue triggered only on a state change (not every frame) — e.g. "knees seedhe rakho", "peeth seedhi rakho" — with a cooldown (e.g. minimum 2 seconds between voice cues) to avoid spamming
- A simple session summary screen after workout: total reps, correct-form %, which mistakes were most frequent

## Screens Needed

1. Exercise selection screen (list/grid of supported exercises)
2. Live workout screen (camera preview + skeleton overlay + rep counter + form status indicator)
3. Session summary screen (post-workout stats)
4. Basic history screen (past sessions, optional for v1)

## Performance Considerations

- Frame processor must run pose detection on a background thread (worklets) so UI stays smooth
- Downscale camera frames before running inference if fps is too low
- Skip frames if processing time exceeds frame budget (drop frames rather than lag)

## Non-Goals for v1

- No social features
- No cloud sync of workouts
- No AI-generated workout plans

Focus purely on the live form-correction core loop working reliably.
