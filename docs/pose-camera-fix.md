# Pose camera stability fix

## Changes

- Android copies YUV camera planes into an owned NV21 byte array before asynchronous ML Kit inference. Camera frames can now be disposed immediately without invalidating the detector input.
- At most one inference is pending. Session generations reject results from before pause, reset, exercise changes or teardown. Detector close waits for its outstanding task to finish.
- Native lifecycle and session methods synchronize access to detector state. Empty detection clears cached landmarks.
- React serializes singleton initialization/cleanup, stabilizes the frame callback and camera outputs, and starts a tracking session only once. Resume preserves the native session.
- Android setup screens use safe-area-context so Back buttons remain below the status bar.
- Camera activity follows app foreground and screen focus. Runtime camera errors have visible feedback. Workout hooks are called before an invalid-route redirect.
- The native dependency is pinned to 1.1.19. `npm run postinstall` reapplies the fix and fails if expected upstream source sections change.

## Validation (2026-09-16)

- `npx tsc --noEmit`: passed.
- `./gradlew :app:assembleDebug -PreactNativeArchitectures=arm64-v8a`: passed.
- `npm run test:pose-buffers`: passed. Tests invoke the actual compiled Kotlin helper for eight combinations of row padding, chroma pixel stride and buffer offset. They verify NV21 ordering, buffer positions and independence from reused camera memory.
- Applied the patch to the published 1.1.19 npm package and reran it successfully.
- Connected Android phone: all three exercise camera open/close flows passed; background camera disconnect and foreground return passed; Back-button safe-area test passed.
- Live workout: camera preview, full-body readiness and one squat rep observed; paused UI observed. User confirmed additional reps count after Resume. No new entry in the crash buffer during these checks.

## Limits

The earlier native SIGSEGV reports did not include a stack trace, so this fixes identified ownership and lifecycle defects without attributing every historical crash to them. iOS has not been built or tested. Accurate rep counts and form scores require a longer workout with suitable camera placement.

Run the buffer tests after a debug Android build, which supplies the compiled helper and Kotlin standard library. Native changes require rebuilding the APK; Metro reload alone cannot apply them.
