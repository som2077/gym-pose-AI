const { withAppBuildGradle } = require('@expo/config-plugins');

const MARKER = '// gym-pose-ai: retain React Native runtime libraries';
const RUNTIME_LIBRARY_REMOVALS = `
            ${MARKER}
            // react-native-nitro-pose-exercises must not remove these from the
            // final APK. Otherwise SoLoader crashes before JavaScript starts.
            excludes.remove('**/libreactnative.so')
            excludes.remove('**/libreactnativejni.so')
            excludes.remove('**/libfbjni.so')
            excludes.remove('**/libjsi.so')
            excludes.remove('**/libfolly_json.so')
            excludes.remove('**/libfolly_runtime.so')
            excludes.remove('**/libglog.so')
            excludes.remove('**/libhermes.so')
            excludes.remove('**/libhermes-executor-debug.so')
            excludes.remove('**/libhermes_executor.so')
            excludes.remove('**/libturbomodulejsijni.so')`;

module.exports = function withReactNativeRuntimePackaging(config) {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (!gradleConfig.modResults.contents.includes(MARKER)) {
      gradleConfig.modResults.contents = gradleConfig.modResults.contents.replace(
        /useLegacyPackaging enableLegacyPackaging\.toBoolean\(\)/,
        (match) => `${match}${RUNTIME_LIBRARY_REMOVALS}`,
      );
    }
    return gradleConfig;
  });
};
