// Persist the Android frame-ownership fix across npm installs. Fail closed if
// the dependency changes instead of silently shipping the unsafe implementation.
const fs = require('node:fs');
const path = require('node:path');
const target = path.join(__dirname, '../node_modules/react-native-nitro-pose-exercises/android/src/main/java/com/margelo/nitro/nitroposeexercises/NitroPoseExercises.kt');
let source = fs.readFileSync(target, 'utf8');
const marker = '// gym-pose-ai: owned image inference v1';
const original = source;
function replace(before, after) {
  if (!source.includes(before)) throw new Error(`Nitro Pose patch mismatch: ${before}`);
  source = source.replace(before, after);
}
if (!source.includes(marker)) {
  replace('  private var poseDetector: PoseDetector? = null', `${marker}
    private var pendingPose: com.google.android.gms.tasks.Task<com.google.mlkit.vision.pose.Pose>? = null
    private var sessionGeneration = 0L
    private var poseDetector: PoseDetector? = null`);
  replace('return Promise.async {', 'return Promise.async { synchronized(this@NitroPoseExercises) {');
  replace('println("[PoseExercise] Initialized with ML Kit Pose Detection (no model file needed)")\n    }', 'println("[PoseExercise] Initialized with ML Kit Pose Detection (no model file needed)")\n    } }');
  replace('    poseDetector?.close()', `    val oldDetector = poseDetector
      val pending = pendingPose
      if (pending != null && !pending.isComplete) {
        pending.addOnCompleteListener { oldDetector?.close() }
      } else {
        oldDetector?.close()
      }`);
  for (const method of ['release', 'isReady', 'loadExercise', 'startSession', 'pauseSession', 'resumeSession', 'stopSession']) {
    replace(`override fun ${method}(`, `@Synchronized\n  override fun ${method}(`);
  }
  replace('  private var _landmarks:', '  @Volatile private var _landmarks:');
  replace('  private fun resetSession() {', '  private fun resetSession() {\n    sessionGeneration += 1');
}
const pause = '    _status = SessionStatus.PAUSED';
if (!source.includes('sessionGeneration += 1 // invalidate pending frames on pause')) {
  replace(pause, `${pause}
    sessionGeneration += 1 // invalidate pending frames on pause
    _landmarks = emptyArray()
    synchronized(landmarkLock) { cachedLandmarks = emptyArray() }`);
}
const frameMarker = '// This method is inserted into NitroPoseExercises';
const start = source.includes(frameMarker) ? source.indexOf(frameMarker) : source.indexOf('override fun processFrameAndroid(');
const end = source.indexOf('override fun processFrameIOS(', start);
if (start < 0 || end < 0) throw new Error('Nitro Pose frame method not found');
source = source.slice(0, start) + fs.readFileSync(path.join(__dirname, 'pose-frame-android.kt'), 'utf8') + '\n' + source.slice(end);
if (source !== original) fs.writeFileSync(target, source);
console.log('Patched Nitro Pose frame ownership and session synchronization.');
const helperTarget = path.join(path.dirname(target), 'PoseImageBuffers.kt');
const helper = fs.readFileSync(path.join(__dirname, 'pose-image-buffers.kt'), 'utf8');
if (!fs.existsSync(helperTarget) || fs.readFileSync(helperTarget, 'utf8') !== helper) {
  fs.writeFileSync(helperTarget, helper);
}
