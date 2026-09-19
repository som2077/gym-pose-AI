# Voice coach

Squat (side), push-up (side), and bicep curl (front) have Hindi, English, and Spanish
setup, movement, and phase instructions. The setup screen speaks automatically
in Full guidance. Expand **Voice coach** to change language, toggle voice,
choose Full guidance / Counts only, or replay instructions. Preferences are
stored in AsyncStorage. Counts only retains countdown, tracking alerts, pause,
and the finish summary, while skipping automatic technique instructions.

Select **Español** in Voice coach for Spanish setup, live workout, summary,
instructions, countdown, spoken counts, and known tracker/form feedback. The
choice persists across app restarts. The coach selects an installed Spanish
voice (including regional variants); without one, Spanish captions remain
visible with an error notice. The home, history, and exercise-selection screens
remain in the app's default language.

## Workout flow

1. Open setup, follow phone placement instructions, then Start calibration.
2. Tap Start workout before moving into position. This arms the session; it
   does not begin counting yet. Camera readiness must remain stable for another
   800 ms, followed by a visible and spoken 3–2–1 countdown.
3. Losing readiness cancels the countdown. Reacquisition starts a fresh one.
   A stalled JS timer also cannot jump directly to Begin.
4. The existing trackers confirm reps; the coach announces their count. It
   does not create reps from speech, phase changes, or elapsed time. Detector
   cycles reset when tracking begins so calibration/resume motion cannot finish
   a partial rep. Resume preserves the app's accumulated counts.
5. Tracking-loss speech waits 650 ms to avoid one-frame warnings. Missing-joint
   hints use actual reliable landmarks. Form speech is confidence-gated and
   limited to supported rules; uncertain observations do not produce invented
   posture corrections. The app is not a medical or injury-safety assessment.
6. Pause, background, and screen blur stop the camera/countdown as appropriate
   and cancel speech. Returning never automatically resumes a workout. Finish
   freezes the session before storage, then announces the recorded totals.

## Implementation

- `coachText.ts`: localized exercise and lifecycle text.
- `voiceCues.ts`: injectable speech scheduler with screen ownership, cancellation
  generations, priority, rep deduplication, and per-cue cooldowns. No speech
  backlog: lower-priority cues are dropped during higher-priority alerts. In
  particular, an interrupted rep announcement is not replayed later.
- `useVoiceCoach.ts`: Expo Speech, language/voice availability, focus/AppState
  cleanup, and visual captions. A missing voice or speech failure leaves text
  visible and shows a notice. The selected device TTS engine supplies audio;
  offline availability depends on that engine and its installed voice data.
- `readyCountdown.ts` / `useWorkoutCoach.ts`: explicit-start state machine and
  camera/workout event integration. Technique cues have 7–8 second cooldowns.
- `coachObservation.ts`: missing-joint hints on a coherent visible body side.
- `VoiceCoachControls.tsx`: shared light-theme accessible controls and captions.

No microphone permission, speech recognition, cloud LLM, or video upload was
added. Rep-counting thresholds were not changed for this feature.

## Verification

`npm run typecheck`, `npm run test:voice`, and `npm test`.

Voice tests use mocked speech/timer/native ports: 26 scheduler/catalog/readiness
and preference checks, and 8 tests running the actual workout hook against deterministic ports.
Existing pose, push-up, and native buffer regressions also run in `npm test`.

Android device smoke check (2026-09-18, Nothing A069): Hindi/English captions and
replay, native TTS initialization without a reported speech error, persisted
mute/counts-only preferences after restart, Start waiting for a pose, camera
pause, resume waiting for reacquisition, and background-return remaining paused
all passed. Hindi Full guidance was restored; no test session was saved. This
checks UI/native integration, not a human-confirmed assessment of audio quality.

Before release, physically exercise all three modes: verify pronunciation,
countdown timing, one spoken count per confirmed rep, correction relevance,
and pose loss during movement. Also check installed/missing Hindi and Spanish voices,
Bluetooth audio, media volume, navigation, background/resume, and font scaling.
Synthetic tests cannot establish real-body tracking accuracy or audible timing.
