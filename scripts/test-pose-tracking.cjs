const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const filename = path.resolve(__dirname, "../src/features/pose/tracking.ts");
const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
}).outputText;
const loaded = new Module(filename, module);
loaded._compile(compiled, filename);
const { projectJoint, isReliableJoint, hasExerciseJoints, PoseSmoother } =
  loaded.exports;
const joint = (x = 0.5, y = 0.5, visibility = 0.95) => ({
  x,
  y,
  z: 0,
  visibility,
});
let count = 0;
function test(name, run) {
  run();
  count++;
  console.log(`PASS ${name}`);
}

test("portrait cover crops horizontally instead of stretching joints", () => {
  const frame = { width: 480, height: 640 };
  const screen = { width: 360, height: 640 };
  assert.deepEqual(projectJoint(joint(), frame, screen), { x: 180, y: 320 });
  assert.deepEqual(projectJoint(joint(0.25, 0.25), frame, screen), {
    x: 60,
    y: 160,
  });
  assert.deepEqual(projectJoint(joint(0, 0), frame, screen), { x: -60, y: 0 });
});
test("wide viewports crop vertically and preserve a uniform scale", () => {
  const frame = { width: 480, height: 640 };
  const screen = { width: 480, height: 400 };
  assert.deepEqual(projectJoint(joint(), frame, screen), { x: 240, y: 200 });
  assert.deepEqual(projectJoint(joint(0.25, 0.25), frame, screen), {
    x: 120,
    y: 40,
  });
});
test("weak, invalid and out-of-frame estimates cannot draw at screen edges", () => {
  for (const point of [
    undefined,
    joint(NaN),
    joint(Infinity),
    joint(-0.1),
    joint(1.1),
    joint(0),
    joint(1),
    joint(0.5, -0.2),
    joint(0.5, 0.5, 0.2),
  ]) {
    assert.equal(isReliableJoint(point), false);
  }
  assert.equal(isReliableJoint(joint()), true);
});
test("side exercises accept either visible side, curls require both arms", () => {
  const points = Array.from({ length: 33 }, () => joint(0.5, 0.5, 0));
  for (const index of [12, 14, 16, 24, 26, 28]) points[index] = joint();
  assert.equal(hasExerciseJoints(points, "squat-side"), true);
  assert.equal(hasExerciseJoints(points, "pushup-side"), true);
  assert.equal(hasExerciseJoints(points, "bicep-curl-front"), false);
  for (const index of [11, 13, 15]) points[index] = joint();
  assert.equal(hasExerciseJoints(points, "bicep-curl-front"), true);
  points[16] = joint(1.1);
  assert.equal(hasExerciseJoints(points, "bicep-curl-front"), false);
});
test("jitter is dampened and duplicate snapshots do not keep moving", () => {
  const smoother = new PoseSmoother();
  smoother.update([joint()], 1000);
  const next = smoother.update([joint(0.51)], 1066);
  assert.ok(next[0].x > 0.5 && next[0].x < 0.507);
  assert.equal(smoother.update([joint(0.51)], 1066), next);
});
test("deliberate movement catches up faster than tiny tremors", () => {
  const smoother = new PoseSmoother();
  smoother.update([joint()], 1000);
  assert.ok(smoother.update([joint(0.7)], 1066)[0].x >= 0.67);
});
test("confidence hysteresis holds stable joints, loss and reacquisition reset them", () => {
  const smoother = new PoseSmoother();
  smoother.update([joint()], 1000);
  assert.ok(smoother.update([joint(0.51, 0.5, 0.55)], 1066)[0].visibility > 0);
  assert.equal(smoother.update([joint(0.52, 0.5, 0.3)], 1132)[0].visibility, 0);
  assert.equal(smoother.update([joint(0.7, 0.5, 0.55)], 1198)[0].visibility, 0);
  assert.equal(smoother.update([joint(0.7)], 1264)[0].x, 0.7);
});
test("stale poses, pause reset and native metadata never leave ghost joints", () => {
  const smoother = new PoseSmoother();
  smoother.update([joint()], 1000);
  assert.equal(smoother.update([joint(0.8)], 1800)[0].x, 0.8);
  smoother.reset();
  assert.equal(smoother.update([joint(0.2)], 1866)[0].x, 0.2);
  assert.equal(
    smoother.update(
      Array.from({ length: 35 }, () => joint()),
      1932,
    ).length,
    33,
  );
  assert.deepEqual(smoother.update([], 1998), []);
});
test("push-up display acquires moderate confidence and retains visible joints without inventing weak ones", () => {
  const smoother = new PoseSmoother(0.5, 0.4);
  assert.equal(
    smoother.update([joint(0.5, 0.5, 0.55)], 1000)[0].visibility,
    0.55,
  );
  assert.equal(
    smoother.update([joint(0.51, 0.5, 0.45)], 1066)[0].visibility,
    0.45,
  );
  assert.equal(smoother.update([joint(0.52, 0.5, 0.2)], 1132)[0].visibility, 0);
});
console.log(`${count} pose tracking tests passed.`);
