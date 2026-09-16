/*
 * react-native-nitro-pose-exercises 1.1.19 excludes React Native runtime
 * shared libraries from its Android packaging block. With RN 0.86 this can
 * also remove libreactnative.so from the application APK, causing a startup
 * crash before JavaScript is loaded. Keep only harmless META-INF exclusions.
 */
const fs = require('fs');
const path = require('path');

const target = path.join(
  process.cwd(),
  'node_modules/react-native-nitro-pose-exercises/android/build.gradle',
);
const contents = fs.readFileSync(target, 'utf8');
const replacement = `packagingOptions {
    excludes = [
      "META-INF",
      "META-INF/**"
    ]
  }`;
const patched = contents.replace(
  /packagingOptions \{\s*excludes = \[[\s\S]*?\]\s*\}/,
  replacement,
);

if (patched === contents && !contents.includes('"META-INF/**"')) {
  throw new Error('Could not find react-native-nitro-pose-exercises packagingOptions block.');
}

if (patched !== contents) {
  fs.writeFileSync(target, patched);
  console.log('Patched Nitro Pose Android packaging options.');
}
