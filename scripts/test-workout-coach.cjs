// Runs the real workout hook against deterministic React/native/timer ports.
// Device UI and actual TTS playback remain separate smoke tests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const cache = new Map();
function load(relative, mocks = {}, prefix = '') {
  const filename = path.resolve(__dirname, '../', relative);
  const loaded = new Module(filename, module);
  loaded.require = (name) => {
    if (name in mocks) return mocks[name];
    if (!name.startsWith('.')) return require(name);
    const next = path.resolve(path.dirname(filename), `${name}.ts`);
    if (!cache.has(next)) cache.set(next, load(path.relative(path.resolve(__dirname, '..'), next)));
    return cache.get(next);
  };
  loaded._compile(prefix + ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
  return loaded.exports;
}
const { useWorkoutStore: store } = load('src/store/workoutStore.ts');
function harness() {
  let slots = [], cursor = 0, pending = [], dirty = false, output, now = 1000, nextId = 0;
  let focused = true;
  const timers = new Map(), listeners = new Set(), spoken = [];
  const same = (a, b) => a && b && a.length === b.length && a.every((value, i) => Object.is(value, b[i]));
  const react = {
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useState(value) {
      const i = cursor++; slots[i] ??= { value };
      return [slots[i].value, (next) => {
        next = typeof next === 'function' ? next(slots[i].value) : next;
        if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; }
      }];
    },
    useCallback(fn, deps) { const i = cursor++; if (!same(slots[i]?.deps, deps)) slots[i] = { fn, deps }; return slots[i].fn; },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!same(slots[i]?.deps, deps)) pending.push(() => {
        slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() };
      });
    },
  };
  const timerPort = {
    now: () => now,
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { fn, due: now + delay }); return id; },
    setInterval(fn, delay) { const id = ++nextId; timers.set(id, { fn, due: now + delay, delay }); return id; },
    clearTimeout: (id) => timers.delete(id), clearInterval: (id) => timers.delete(id),
  };
  const voice = { active: true, language: 'hi', enabled: true, guidance: 'full', caption: '', error: false,
    say: (cue) => { spoken.push(cue); return true; }, stop: () => {} };
  const fakeStoreHook = (selector) => selector(store.getState()); fakeStoreHook.getState = store.getState;
  const { useWorkoutCoach } = load('src/features/workout/useWorkoutCoach.ts', {
    react, 'expo-router': { useFocusEffect: (fn) => react.useEffect(() => focused ? fn() : undefined, [focused, fn]) },
    'react-native': { AppState: { addEventListener: (_, fn) => { listeners.add(fn); return { remove: () => listeners.delete(fn) }; } } },
    '../../store/workoutStore': { useWorkoutStore: fakeStoreHook },
    './useVoiceCoach': { useVoiceCoach: () => voice }, '__timers': timerPort,
  }, "const {setTimeout, setInterval, clearTimeout, clearInterval} = require('__timers'); const Date = {now: require('__timers').now};\n");
  function render() {
    let iterations = 0;
    do {
      if (++iterations > 20) throw new Error('Hook render loop');
      dirty = false; cursor = 0; pending = []; output = useWorkoutCoach('pushup-side');
      for (const effect of pending) effect();
    } while (dirty);
  }
  function advance(ms) {
    const target = now + ms;
    while (true) {
      const next = [...timers.entries()].filter(([, timer]) => timer.due <= target).sort((a, b) => a[1].due - b[1].due)[0];
      if (!next) break;
      const [id, timer] = next; now = timer.due;
      if (timer.delay) timer.due += timer.delay; else timers.delete(id);
      timer.fn(); render();
    }
    now = target; render();
  }
  store.getState().selectExercise('pushup-side'); store.getState().beginCalibration(); render();
  return {
    get coach() { return output; }, spoken, render, advance,
    setLanguage(language) { voice.language = language; render(); },
    background() { for (const listener of listeners) listener('background'); voice.active = false; render(); },
    foreground() { voice.active = true; render(); },
    blur() { focused = false; voice.active = false; render(); },
    destroy() { for (const slot of slots) slot?.cleanup?.(); timers.clear(); },
  };
}
let passed = 0;
function test(name, run) { const h = harness(); try { run(h); passed++; console.log(`PASS ${name}`); } finally { h.destroy(); } }
test('real hook waits for Start and stable pose before enabling reps', (h) => {
  h.coach.handleReady(true); h.render(); h.advance(5000);
  assert.equal(store.getState().mode, 'calibrating');
  h.coach.handleRep(true); assert.equal(store.getState().totalReps, 0);
  h.coach.start(); h.render(); h.advance(4000);
  assert.equal(store.getState().mode, 'tracking');
  assert.deepEqual(h.spoken.filter((cue) => cue.id === 'countdown').map((cue) => cue.text), ['तीन', 'दो', 'एक', 'शुरू करें।']);
  h.coach.handleRep(true); assert.equal(store.getState().totalReps, 1);
  assert.equal(h.spoken.at(-1).id, 'rep-1');
});
test('pose loss in countdown cannot start early; reacquisition restarts at three', (h) => {
  h.coach.start(); h.coach.handleReady(true); h.render(); h.advance(1000);
  h.coach.handleReady(false); h.render(); h.advance(5000);
  assert.equal(store.getState().mode, 'calibrating'); assert.equal(h.coach.countdown, null);
  h.coach.handleReady(true); h.render(); h.advance(1000); assert.equal(h.coach.countdown, 3);
});
test('pause/resume preserves counts and requires a fresh countdown', (h) => {
  h.coach.start(); h.coach.handleReady(true); h.render(); h.advance(4000); h.coach.handleRep(true);
  const started = store.getState().sessionStartedAt;
  h.coach.pause(); h.render(); h.coach.handleRep(true); assert.equal(store.getState().totalReps, 1);
  h.coach.start(); h.render(); h.advance(6000); assert.equal(store.getState().mode, 'calibrating');
  h.coach.handleReady(true); h.render(); h.advance(4000);
  assert.equal(store.getState().mode, 'tracking'); assert.equal(store.getState().totalReps, 1);
  assert.equal(store.getState().sessionStartedAt, started);
});
test('background and return never automatically resume an armed workout', (h) => {
  h.coach.start(); h.coach.handleReady(true); h.render(); h.advance(1000); h.background(); h.advance(5000); h.foreground();
  assert.equal(store.getState().mode, 'paused'); assert.equal(h.coach.armed, false);
  h.coach.handleReady(true); h.render(); h.advance(5000); assert.equal(store.getState().mode, 'paused');
});
test('screen blur pauses tracking and drops late rep callbacks', (h) => {
  h.coach.start(); h.coach.handleReady(true); h.render(); h.advance(4000); h.blur(); h.coach.handleRep(true);
  assert.equal(store.getState().mode, 'paused'); assert.equal(store.getState().totalReps, 0);
});
test('tracking alerts are debounced and return has its own cue', (h) => {
  h.coach.start(); h.coach.handleReady(true); h.render(); h.advance(4000);
  h.coach.handleReady(false); h.render(); h.advance(300); h.coach.handleReady(true); h.render();
  assert.equal(h.spoken.some((cue) => cue.id === 'lost'), false);
  h.coach.handleReady(false); h.render(); h.advance(700); assert.equal(h.spoken.at(-1).id, 'lost');
  h.coach.handleReady(true); h.render(); assert.equal(h.spoken.at(-1).id, 'regained');
});
test('finished sessions reject late tracker callbacks', (h) => {
  h.coach.start(); h.coach.handleReady(true); h.render(); h.advance(4000);
  store.getState().finishSession(); h.coach.cancelStart(); h.render(); h.coach.handleRep(true);
  assert.equal(store.getState().totalReps, 0);
});
test('Spanish workout uses localized setup replay, countdown, tracking and pause cues', (h) => {
  h.setLanguage('es'); h.coach.replay(); assert.match(h.spoken.at(-1).text, /Flexiones/);
  h.coach.start(); assert.match(h.spoken.at(-1).text, /Ponte en posición/);
  h.coach.handleReady(true); h.render(); h.advance(4000);
  assert.deepEqual(h.spoken.filter((cue) => cue.id === 'countdown').map((cue) => cue.text), ['Tres', 'Dos', 'Uno', '¡Empieza!']);
  h.coach.handleRep(true); assert.equal(h.spoken.at(-1).text, '1');
  h.coach.handleReady(false); h.render(); h.advance(700);
  assert.match(h.spoken.at(-1).text, /Se ha perdido el seguimiento/);
  h.coach.handleReady(true); h.render(); assert.match(h.spoken.at(-1).text, /Seguimiento recuperado/);
  h.coach.pause(); assert.match(h.spoken.at(-1).text, /Entrenamiento en pausa/);
});
console.log(`${passed} workout coach integration tests passed.`);
