const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const cache = new Map();
function load(filename, mocks = {}) {
  const mocked = Object.keys(mocks).length > 0;
  if (!mocked && cache.has(filename)) return cache.get(filename);
  const loaded = new Module(filename, module);
  loaded.require = (name) => name in mocks ? mocks[name] : name.startsWith('.') ? load(path.resolve(path.dirname(filename), `${name}.ts`)) : require(name);
  loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
  if (!mocked) cache.set(filename, loaded.exports);
  return loaded.exports;
}
const { VoiceCuePlayer } = load(path.resolve(__dirname, '../src/features/workout/voiceCues.ts'));
const { ReadyCountdown } = load(path.resolve(__dirname, '../src/features/workout/readyCountdown.ts'));
const { COACH_LANGUAGES, coachLanguages, isCoachLanguage, exerciseCoach, coachText, countdownText, summaryText } = load(path.resolve(__dirname, '../src/features/workout/coachText.ts'));
const { missingJointHint } = load(path.resolve(__dirname, '../src/features/pose/coachObservation.ts'));
const { useWorkoutStore } = load(path.resolve(__dirname, '../src/store/workoutStore.ts'));
const { localizedExerciseName, localizedFeedback, workoutUiText } = load(path.resolve(__dirname, '../src/features/workout/uiText.ts'));
const flush = () => new Promise((resolve) => setImmediate(resolve));
const cue = (id, priority = 40, extra = {}) => ({ id, text: id, priority, ...extra });
function harness(port = {}) {
  let now = 1000;
  const spoken = [], captions = [];
  const player = new VoiceCuePlayer({
    stop: async () => {},
    speak: (text, language, done, error) => spoken.push({ text, language, done, error }),
    ...port,
  }, () => now);
  const owner = Symbol();
  player.activate(owner, (text, error) => captions.push({ text, error }));
  return { player, owner, spoken, captions, time: (value) => { now = value; } };
}
const tests = [];
const test = (name, run) => tests.push([name, run]);

test('each exercise and lifecycle cue covers all three supported languages', () => {
  assert.deepEqual(COACH_LANGUAGES, ['hi', 'en', 'es']);
  assert.equal(Object.keys(exerciseCoach).length, 3);
  for (const exercise of Object.values(exerciseCoach)) for (const text of Object.values(exercise)) {
    assert.match(text.hi, /[\u0900-\u097f]/);
    for (const language of COACH_LANGUAGES) assert.ok(text[language].length > 5);
    assert.notEqual(text.es, text.en);
  }
  for (const text of Object.values(coachText)) for (const language of COACH_LANGUAGES) assert.ok(text[language]);
  assert.equal(countdownText(3, 'hi'), 'तीन'); assert.equal(countdownText(1, 'en'), '1');
  assert.match(summaryText(12, 9, 'en'), /12 reps.*9 reps/); assert.match(summaryText(0, 0, 'hi'), /0/);
});
test('Spanish uses its own label, speech locale, countdown and summary', () => {
  assert.deepEqual(coachLanguages.es, { label: 'Español', locale: 'es-ES' });
  assert.equal(coachLanguages.hi.locale, 'hi-IN'); assert.equal(coachLanguages.en.locale, 'en-US');
  assert.deepEqual([3, 2, 1, 0].map((value) => countdownText(value, 'es')), ['Tres', 'Dos', 'Uno', '¡Empieza!']);
  assert.match(summaryText(12, 9, 'es'), /Entrenamiento completado.*12.*9/);
  assert.match(summaryText(0, 0, 'es'), /registradas: 0.*detector: 0/);
});
test('Spanish coach flow has localized setup, live, feedback and summary UI copy', () => {
  const copy = workoutUiText('es');
  assert.equal(copy.startCalibration, 'Iniciar calibración');
  assert.equal(copy.startWorkout, 'Empezar entrenamiento');
  assert.equal(copy.resume, 'Reanudar');
  assert.equal(copy.cleanOutOf(3, 4), '3 repeticiones limpias de 4');
  assert.equal(localizedExerciseName('pushup-side', 'es', 'Push-up'), 'Flexiones');
  assert.match(localizedFeedback('Hip ko shoulder aur ankle ki line mein rakho.', 'es'), /cadera/);
  assert.match(localizedFeedback('swinging', 'es'), /balancearte/);
  assert.match(localizedFeedback('Any unrecognized tracker message', 'es'), /Any unrecognized/);
  assert.equal(workoutUiText('en').startWorkout, 'Start workout');
  assert.match(workoutUiText('hi').waiting, /Position lo/);
});
test('Spanish confirmed rep numbers use the Spanish speech locale', async () => {
  const h = harness();
  h.player.say(h.owner, cue('rep-1', 60, { text: '1', once: true }), coachLanguages.es.locale);
  await flush(); assert.equal(h.spoken[0].language, 'es-ES'); assert.equal(h.spoken[0].text, '1');
});
test('missing Spanish voice preserves Spanish instructions and reports an error', async () => {
  const h = harness({ prepare: async () => false });
  h.player.say(h.owner, cue('setup', 80, { text: exerciseCoach['pushup-side'].setup.es }), coachLanguages.es.locale);
  await flush(); assert.equal(h.spoken.length, 0); assert.equal(h.captions.at(-1).error, true);
  assert.match(h.captions.at(-1).text, /Flexiones/);
});
test('Spanish language preference survives a storage round trip', async () => {
  let saved = null;
  const mocks = { '@react-native-async-storage/async-storage': { __esModule: true, default: {
    getItem: async () => saved,
    setItem: async (_, value) => { saved = value; },
  } } };
  const filename = path.resolve(__dirname, '../src/store/voiceSettingsStore.ts');
  const first = load(filename, mocks).useVoiceSettings;
  await flush(); assert.equal(first.getState().language, 'hi');
  first.getState().update({ language: 'es', enabled: false, guidance: 'counts' });
  await flush(); assert.equal(JSON.parse(saved).language, 'es');
  const restored = load(filename, mocks).useVoiceSettings;
  await flush(); assert.equal(restored.getState().language, 'es');
  assert.equal(restored.getState().enabled, false); assert.equal(restored.getState().guidance, 'counts');
  assert.equal(restored.getState().hydrated, true);
});
test('existing Hindi/English preferences remain valid and unknown languages fall back safely', async () => {
  for (const language of ['hi', 'en', 'fr', null, '__proto__']) {
    assert.equal(isCoachLanguage(language), language === 'hi' || language === 'en');
    const { useVoiceSettings } = load(path.resolve(__dirname, '../src/store/voiceSettingsStore.ts'), {
      '@react-native-async-storage/async-storage': { __esModule: true, default: {
        getItem: async () => JSON.stringify({ language }), setItem: async () => {},
      } },
    });
    await flush(); assert.equal(useVoiceSettings.getState().language, language === 'en' ? 'en' : 'hi');
  }
  assert.equal(isCoachLanguage('es'), true);
});
test('confirmed rep ID is announced at most once even after cooldown', async () => {
  const h = harness();
  assert.equal(h.player.say(h.owner, cue('rep-1', 60, { once: true }), 'hi-IN'), true);
  await flush(); h.spoken[0].done(); h.time(9000);
  assert.equal(h.player.say(h.owner, cue('rep-1', 60, { once: true }), 'hi-IN'), false);
  assert.equal(h.spoken.length, 1); assert.equal(h.spoken[0].language, 'hi-IN');
});
test('tracking loss interrupts reps; lower priority cues never queue behind it', async () => {
  const h = harness();
  h.player.say(h.owner, cue('rep-1', 60), 'en-US'); await flush();
  h.player.say(h.owner, cue('lost', 90), 'en-US'); await flush();
  assert.equal(h.player.say(h.owner, cue('form', 40), 'en-US'), false);
  assert.deepEqual(h.spoken.map((s) => s.text), ['rep-1', 'lost']);
  h.spoken[1].done(); await flush(); assert.equal(h.spoken.length, 2);
});
test('superseded speech cannot start after asynchronous stop resolves', async () => {
  let unblock;
  const h = harness(); await flush();
  h.player.speech.stop = () => new Promise((resolve) => { unblock = resolve; });
  h.player.say(h.owner, cue('old'), 'en-US'); await flush();
  h.player.say(h.owner, cue('new', 90), 'en-US');
  unblock(); await flush(); unblock(); await flush();
  assert.deepEqual(h.spoken.map((s) => s.text), ['new']);
});
test('release cancels pending speech; old screen cleanup cannot stop new owner', async () => {
  const h = harness();
  h.player.say(h.owner, cue('old'), 'en-US'); h.player.release(h.owner);
  const next = Symbol(); h.player.activate(next, () => {});
  h.player.say(next, cue('summary', 100), 'en-US'); h.player.release(h.owner);
  await flush(); assert.deepEqual(h.spoken.map((s) => s.text), ['summary']);
  assert.equal(h.player.say(h.owner, cue('late'), 'en-US'), false);
});
test('stale completion callbacks do not unlock a newer high priority cue', async () => {
  const h = harness();
  h.player.say(h.owner, cue('phase', 20), 'en-US'); await flush();
  h.player.say(h.owner, cue('pause', 100), 'en-US'); await flush(); h.spoken[0].done();
  assert.equal(h.player.say(h.owner, cue('rep', 60), 'en-US'), false);
});
test('corrections respect cooldown; unrelated priority alerts do not wait', async () => {
  const h = harness();
  h.player.say(h.owner, cue('elbows', 40, { cooldownMs: 8000 }), 'en-US'); await flush(); h.spoken[0].done();
  h.time(6000); assert.equal(h.player.say(h.owner, cue('elbows', 40, { cooldownMs: 8000 }), 'en-US'), false);
  assert.equal(h.player.say(h.owner, cue('lost', 90), 'en-US'), true); await flush(); h.spoken[1].done();
  h.time(9000); assert.equal(h.player.say(h.owner, cue('elbows', 40, { cooldownMs: 8000 }), 'en-US'), true);
});
test('muted coach retains captions with no native speech', async () => {
  const h = harness(); h.player.say(h.owner, cue('caption'), 'en-US', false); await flush();
  assert.equal(h.spoken.length, 0); assert.equal(h.captions[0].text, 'caption');
});
test('speech errors preserve captions and allow future cues', async () => {
  const h = harness(); h.player.say(h.owner, cue('setup', 80), 'hi-IN'); await flush();
  h.spoken[0].error(); assert.equal(h.captions.at(-1).error, true);
  assert.equal(h.player.say(h.owner, cue('rep', 60), 'hi-IN'), true);
});
test('missing language never silently speaks using the wrong voice', async () => {
  const h = harness({ prepare: async () => false }); h.player.say(h.owner, cue('setup'), 'hi-IN'); await flush();
  assert.equal(h.spoken.length, 0); assert.equal(h.captions.at(-1).error, true);
});
test('stop errors are reported without an unhandled rejection', async () => {
  const h = harness({ stop: async () => { throw new Error('native unavailable'); } });
  h.player.say(h.owner, cue('setup'), 'hi-IN'); await flush();
  assert.equal(h.spoken.length, 0); assert.equal(h.captions.at(-1).error, true);
});
test('cancellation during voice discovery prevents late speech', async () => {
  let resolve;
  const h = harness({ prepare: () => new Promise((done) => { resolve = done; }) });
  h.player.say(h.owner, cue('setup'), 'hi-IN'); await flush();
  h.player.release(h.owner); resolve(true); await flush(); assert.equal(h.spoken.length, 0);
});
test('missing native completion callback cannot lock out future cues', async () => {
  const h = harness(); h.player.say(h.owner, cue('pause', 100), 'en-US'); await flush();
  h.time(30000); assert.equal(h.player.say(h.owner, cue('rep', 60), 'en-US'), true);
});
test('pose alone never starts a workout without a user request', () => {
  const countdown = new ReadyCountdown();
  for (const now of [0, 800, 1800, 2800, 3800, 99999]) assert.equal(countdown.update(true, now).start, false);
});
test('stable pose produces 3, 2, 1, Go once after an explicit request', () => {
  const countdown = new ReadyCountdown(); countdown.request();
  assert.equal(countdown.update(true, 0).value, null);
  for (const [now, value] of [[800, 3], [1800, 2], [2800, 1], [3800, 0]]) {
    const result = countdown.update(true, now);
    assert.equal(result.value, value); assert.equal(result.changed, true); assert.equal(result.start, value === 0);
  }
  assert.equal(countdown.update(true, 4800).start, false);
});
test('pose loss requires a full new stable interval and countdown', () => {
  const countdown = new ReadyCountdown(); countdown.request(); countdown.update(true, 0); countdown.update(true, 800);
  assert.equal(countdown.update(false, 1500).value, null); assert.equal(countdown.update(true, 1800).value, null);
  assert.equal(countdown.update(true, 2600).value, 3);
});
test('pause, blur and background cancellation cannot auto-start after return', () => {
  const countdown = new ReadyCountdown(); countdown.request(); countdown.update(true, 0); countdown.update(true, 800); countdown.cancel();
  assert.equal(countdown.update(true, 10000).start, false);
  countdown.request(); assert.equal(countdown.update(true, 11000).value, null);
});
test('stalled timer cannot skip countdown and start a workout', () => {
  const countdown = new ReadyCountdown(); countdown.request(); countdown.update(true, 0); countdown.update(true, 800);
  assert.equal(countdown.update(true, 9000).start, false); assert.equal(countdown.update(true, 9800).value, 3);
});
test('resume calibration preserves counts and original session start', () => {
  const store = useWorkoutStore;
  store.getState().selectExercise('pushup-side'); store.getState().startTracking();
  const started = store.getState().sessionStartedAt;
  store.getState().recordRep(true); store.getState().pauseWorkout(); store.getState().beginCalibration(); store.getState().resumeWorkout();
  assert.equal(store.getState().totalReps, 1); assert.equal(store.getState().cleanReps, 1);
  assert.equal(store.getState().sessionStartedAt, started); store.getState().resetWorkout();
});
const point = (visibility = 0.95) => ({ x: 0.5, y: 0.5, z: 0, visibility });
test('missing-joint hints support both sides without guessing an invisible body', () => {
  const points = Array.from({ length: 33 }, () => point(0));
  assert.equal(missingJointHint(points, 'pushup-side'), 'body');
  for (const index of [12, 14, 24, 28]) points[index] = point();
  assert.equal(missingJointHint(points, 'pushup-side'), 'wrist');
  points[16] = point(); assert.equal(missingJointHint(points, 'pushup-side'), null);
  points[28] = point(0.1); assert.equal(missingJointHint(points, 'pushup-side'), 'ankle');
});
test('curl hints require both arms; squat hints require the leg chain', () => {
  const points = Array.from({ length: 33 }, () => point());
  points[14] = point(0); assert.equal(missingJointHint(points, 'bicep-curl-front'), 'elbow');
  points[25] = point(0); points[26] = point(0); assert.equal(missingJointHint(points, 'squat-side'), 'knee');
});
(async () => {
  for (const [name, run] of tests) { await run(); console.log(`PASS ${name}`); }
  console.log(`${tests.length} voice coach tests passed.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
