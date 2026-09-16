// Uses the real Kotlin helper compiled by Gradle, with no camera or ML Kit mocks.
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const classes = path.join(root, 'node_modules/react-native-nitro-pose-exercises/android/build/tmp/kotlin-classes/debug');
const cache = path.join(process.env.GRADLE_USER_HOME || path.join(os.homedir(), '.gradle'), 'caches/modules-2/files-2.1/org.jetbrains.kotlin/kotlin-stdlib');
function jars(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? jars(file) : entry.name.endsWith('.jar') ? [file] : [];
  });
}
const stdlib = jars(cache).sort().at(-1);
if (!stdlib) throw new Error('Build Android debug first to populate Kotlin dependencies.');
execFileSync('java', ['-cp', [classes, stdlib].join(path.delimiter), path.join(__dirname, 'PoseImageBuffersTest.java')], { stdio: 'inherit' });
