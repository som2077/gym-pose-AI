# Pose overlay and workout UI (2026-09-17)

The old SVG stretched normalized coordinates independently across the entire
screen, while the camera used a centered cover crop. It also showed estimates
with visibility as low as 0.2 and polled only every 125 ms.

Android now uses ML Kit's 2D `position` pixels for overlay coordinates. Its
`position3D` values are metric/world-space values and must not be normalized
against the image dimensions.

## Changes

- Android publishes oriented image width, height and capture time in landmark
  slot 34, with zero visibility. Slots 0–32 remain the original body joints and
  slot 33 remains reserved. The UI never renders metadata.
- The overlay projects the normalized joints using the camera's centered cover
  scale and offsets. Dots and lines use screen units so circles remain circular.
- Coordinates outside the image are preserved by the native detector and hidden
  by the UI, instead of clamping them onto the image edge. See the official
  [ML Kit pose documentation](https://developers.google.com/ml-kit/vision/pose-detection/android)
  for out-of-frame landmarks and likelihood semantics.
- Display smoothing reduces small tremors, responds faster to larger movement,
  and resets lost joints immediately. Acquisition uses 0.6 visibility; already
  acquired joints remain visible down to 0.5 to reduce flicker. These thresholds
  are heuristics, not measured accuracy scores.
- Polling runs every 33 ms; Android only smooths each distinct detector snapshot
  once. Native inference remains capped at about 15 FPS and one pending task.
- Android detections older than 500 ms disappear. Pause, background and teardown
  reset the display filter. Camera orientation follows the portrait interface.
- Start requires the native posture check plus reliable exercise-specific joints
  over 350 ms of detection timestamps. Side views accept either body side; front
  curls require both arms. Start is disabled if the pose is lost after calibration.
- The live screen separates preview and controls, respects safe areas, provides
  framing guidance and paused/searching/live labels, and displays clean rep rate.
  Home cards show muscle groups and view requirements; secondary buttons now have
  readable light text.

## Verification

- `npm run typecheck`: passed.
- `npm test`: eight projection/filter/readiness-input cases and eight Kotlin
  YUV buffer layouts passed.
- Android arm64 debug build: passed; installed on the connected Nothing A069.
- Home, setup and live camera screens inspected on device. Empty-scene camera
  preview runs, displays no invented skeleton and keeps Start disabled.
- No new app crash observed during these checks.

## Limits

No quantitative accuracy benchmark or full-body workout was captured during
verification. Real movement, occlusion and lighting still need user validation.
Display smoothing does not modify the detector's raw rep-counting inputs.
iOS was not built/tested; it uses negotiated frame dimensions and polling time,
so Android's timestamp-based stale-result handling is not available there.
The projection assumes preview and inference share the same sensor field of
view; devices negotiating different stream crops need additional verification.

Run `npm run postinstall` after dependency installation. This change includes
native Android metadata, so rebuild the APK; a Metro reload alone is insufficient.

## Push-up follow-up

The bundled push-up configuration used only the left elbow for phases, a 0.1
visibility threshold, and a native posture check requiring both shoulders.
Native angles were calculated in independently normalized coordinates, which
distorted angles on non-square images. The app now owns push-up analysis in
`pushupTracking.ts`, using raw detector landmarks and oriented image dimensions;
native push-up rep/form/posture callbacks are ignored to prevent double counting.

- Select a reliable shoulder–elbow–wrist–hip chain from either side, then lock
  that side for counting. Ankles are optional for counting and required only to
  qualify whole-body form. The overlay displays all individually reliable joints,
  independently of whether counting is ready; one missing joint cannot erase it.
- Check horizontal torso/body placement and wrist position so standing arm bends
  cannot unlock push-up calibration. The hidden shoulder is not required.
- Compute elbow and body angles in image pixels. Confirm each phase for at least
  100 ms on distinct snapshots, with thresholds of 150° up and 105° down.
- Require a complete up/down/up cycle lasting at least 500 ms. Discard unfinished
  cycles on long tracking loss, pause, start and side changes. Repeated cached
  detections cannot generate reps.
- Check the shoulder/hip/ankle line throughout each rep; angles below 155° or
  missing ankles prevent a clean-rep designation. These are tunable heuristics,
  not a clinical assessment.
- Push-up arm/torso visibility requires 0.5. The display acquires points at 0.5
  and retains them down to 0.4, while discarding weak estimates individually.
- Start push-ups is available before pose acquisition. The user can start at the
  phone, then move into plank; only validated full cycles generate counts.
- Setup now illustrates a side-view plank and the live hint no longer asks a
  push-up user to stand up.

`npm run test:pushup` covers 14 synthetic regression cases, including both camera
sides, aspect ratio, partial reps, transient noise, duplicated frames, occlusion,
side changes, hip sag, missing ankles, partial-joint display and moderate confidence.
This verifies the algorithm, not model accuracy on a
recorded human workout; physical push-up validation is still needed.
