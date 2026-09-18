const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
function load(filename) {
  const loaded = new Module(filename, module);
  loaded.require = (name) =>
    name.startsWith(".")
      ? load(path.resolve(path.dirname(filename), `${name}.ts`))
      : require(name);
  loaded._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    filename,
  );
  return loaded.exports;
}
const { PushupTracker, imageAngle } = load(
  path.resolve(__dirname, "../src/features/pose/pushupTracking.ts"),
);
const size = { width: 640, height: 480 };
const point = (x, y, visibility = 0.95) => ({
  x: x / size.width,
  y: y / size.height,
  z: 0,
  visibility,
});
function pose(angle, side = "left", visibility = 0.95) {
  const p = Array.from({ length: 33 }, () => point(0, 0, 0));
  const [s, e, w, h, a] =
    side === "left" ? [11, 13, 15, 23, 27] : [12, 14, 16, 24, 28];
  p[s] = point(100, 200, visibility);
  p[e] = point(100, 280, visibility);
  p[w] = point(
    100 + 80 * Math.sin((angle * Math.PI) / 180),
    280 - 80 * Math.cos((angle * Math.PI) / 180),
    visibility,
  );
  p[h] = point(300, 210, visibility);
  p[a] = point(500, 220, visibility);
  return p;
}
const sequence = [
  [0, 170],
  [120, 170],
  [240, 125],
  [360, 90],
  [480, 90],
  [600, 125],
  [720, 170],
  [840, 170],
];
function cycle(tracker, side = "left", base = 1000, alter = (p) => p) {
  return sequence.map(([offset, angle]) =>
    tracker.update(alter(pose(angle, side)), size, base + offset),
  );
}
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log(`PASS ${name}`);
}
test("pixel geometry returns the correct angle on non-square images", () => {
  assert.ok(
    Math.abs(
      imageAngle(point(100, 200), point(180, 280), point(260, 200), size) - 90,
    ) < 1e-6,
  );
  assert.ok(
    Number.isNaN(
      imageAngle(point(100, 200), point(100, 200), point(260, 200), size),
    ),
  );
});
for (const side of ["left", "right"])
  test(`${side} arm alone can track and count one complete push-up`, () => {
    const results = cycle(new PushupTracker(), side);
    assert.ok(results.every((r) => r.ready && r.side === side));
    assert.equal(results.filter((r) => r.rep).length, 1);
    assert.equal(results.at(-1).clean, true);
    assert.equal(
      results.at(-1).landmarks[side === "left" ? 12 : 11].visibility,
      0,
    );
  });
test("starting at the bottom cannot count an incomplete rep", () => {
  const tracker = new PushupTracker();
  for (const [time, angle] of [
    [1000, 90],
    [1120, 90],
    [1240, 170],
    [1360, 170],
  ]) {
    assert.equal(tracker.update(pose(angle), size, time).rep, false);
  }
});
test("a real down phase followed by a full extension counts once", () => {
  const tracker = new PushupTracker();
  let reps = 0;
  for (const [time, angle] of [
    [1000, 170],
    [1120, 170],
    [1240, 120],
    [1360, 90],
    [1420, 130],
    [1540, 170],
    [1660, 170],
  ]) {
    if (tracker.update(pose(angle), size, time).rep) reps += 1;
  }
  assert.equal(reps, 1);
});
test("duplicate cached detections do not advance phase confirmation", () => {
  const tracker = new PushupTracker();
  for (let n = 0; n < 20; n++)
    assert.equal(tracker.update(pose(170), size, 1000).rep, false);
  for (const [time, angle] of [
    [1120, 90],
    [1240, 90],
    [1480, 170],
    [1600, 170],
  ]) {
    assert.equal(tracker.update(pose(angle), size, time).rep, false);
  }
});
test("weak joints, standing arm bends and out-of-frame joints are rejected", () => {
  const tracker = new PushupTracker();
  assert.equal(tracker.update(pose(170, "left", 0.2), size, 1000).ready, false);
  const standing = pose(170);
  standing[15] = point(100, 100);
  assert.equal(tracker.update(standing, size, 1120).ready, false);
  const cropped = pose(170);
  cropped[15] = point(-10, 300);
  assert.equal(tracker.update(cropped, size, 1240).ready, false);
});
test("camera-facing arm stays locked and cannot merge opposite-side half reps", () => {
  const tracker = new PushupTracker();
  tracker.update(pose(170), size, 1000);
  tracker.update(pose(170), size, 1120);
  tracker.update(pose(90), size, 1240);
  tracker.update(pose(90), size, 1360);
  assert.equal(tracker.update(pose(170, "right"), size, 1480).ready, false);
  assert.equal(tracker.update(pose(170, "right"), size, 2000).rep, false);
  assert.equal(tracker.update(pose(170, "right"), size, 2120).rep, false);
});
test("long pose loss discards the unfinished cycle", () => {
  const tracker = new PushupTracker();
  for (const [offset, angle] of sequence.slice(0, 5))
    tracker.update(pose(angle), size, 1000 + offset);
  tracker.update([], size, 2100);
  assert.equal(tracker.update(pose(170), size, 2220).rep, false);
  assert.equal(tracker.update(pose(170), size, 2340).rep, false);
});
test("a completed rep with hip sag is counted but is not marked clean", () => {
  const results = cycle(new PushupTracker(), "left", 1000, (p) => {
    p[23] = point(300, 290);
    return p;
  });
  assert.equal(results.filter((r) => r.rep).length, 1);
  assert.equal(results.at(-1).clean, false);
  assert.equal(results.at(-1).status, "warning");
});
test("consecutive full cycles count once each and reset clears a partial cycle", () => {
  const tracker = new PushupTracker();
  assert.equal(
    [...cycle(tracker), ...cycle(tracker, "left", 1900)].filter((r) => r.rep)
      .length,
    2,
  );
  tracker.reset();
  assert.equal(tracker.update(pose(170), size, 3000).rep, false);
});
test("a missing ankle does not hide the arm or block a complete rep", () => {
  const results = cycle(new PushupTracker(), "left", 1000, (p) => {
    p[27] = point(0, 0, 0);
    return p;
  });
  assert.ok(results.every((r) => r.ready && r.landmarks[13].visibility > 0));
  assert.equal(results.filter((r) => r.rep).length, 1);
  assert.equal(results.at(-1).clean, false);
});
test("a compact shoulder-to-hip image segment still exposes a reliable arm", () => {
  const p = pose(170);
  p[23] = point(115, 210);
  const result = new PushupTracker().update(p, size, 1000);
  assert.equal(result.ready, true);
  assert.equal(result.landmarks[13].visibility, 0.95);
});
test("visible dots remain available when the hip is missing", () => {
  const p = pose(170);
  p[23] = point(0, 0, 0);
  const result = new PushupTracker().update(p, size, 1000);
  assert.equal(result.ready, true);
  assert.equal(result.rep, false);
  assert.equal(result.landmarks[13].visibility, 0.95);
  assert.equal(result.landmarks[15].visibility, 0.95);
});
test("moderate reliable confidence can count without accepting weak 0.2 estimates", () => {
  const results = cycle(new PushupTracker(), "right", 1000, (p) =>
    p.map((joint) =>
      joint.visibility > 0 ? { ...joint, visibility: 0.55 } : joint,
    ),
  );
  assert.equal(results.filter((r) => r.rep).length, 1);
});
console.log(`${count} push-up regression tests passed.`);
