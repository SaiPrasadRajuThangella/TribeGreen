const { withAppBuildGradle, withGradleProperties } = require("expo/config-plugins");

/*
 * Release builds for the Play Store and direct installs, applied on every `expo prebuild`:
 *
 * - Signed with the release key in mobile/keystore (keystore.properties + the .jks, both kept out
 *   of git). A release build fails if the key is missing, so it never falls back to the debug key.
 * - As small as possible: R8 shrinks the Java/Kotlin code, unused resources are dropped, only
 *   English strings are kept, native libraries and the JS bundle are compressed, and only the two
 *   ABIs real phones use are built (emulator x86 is left out).
 *   For the smallest single APK build one ABI: ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
 */

const KEYSTORE = `
// Release key, kept outside the generated android/ folder (see plugins/withReleaseBuild.js)
def releaseKeystoreFile = rootProject.file('../keystore/keystore.properties')
def releaseKeystore = new Properties()
if (releaseKeystoreFile.exists()) {
    releaseKeystoreFile.withInputStream { releaseKeystore.load(it) }
}
`;

const RELEASE_SIGNING = `
        release {
            if (releaseKeystoreFile.exists()) {
                storeFile rootProject.file("../keystore/\${releaseKeystore['storeFile']}")
                storePassword releaseKeystore['storePassword']
                keyAlias releaseKeystore['keyAlias']
                keyPassword releaseKeystore['keyPassword']
            }
        }`;

function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;

    if (!gradle.includes("releaseKeystoreFile")) {
      gradle = gradle.replace(/\nandroid \{/, `${KEYSTORE}\nandroid {`);
      gradle = gradle.replace(/signingConfigs \{/, `signingConfigs {${RELEASE_SIGNING}`);
      // The release build type ships with the debug key; point it at the release key instead
      gradle = gradle.replace(
        /(release \{\s*(?:\/\/[^\n]*\n\s*)*)signingConfig signingConfigs\.debug/,
        "$1signingConfig signingConfigs.release",
      );
    }
    // Keep only English resources from the libraries (the app itself is English only)
    if (!gradle.includes("localeFilters")) {
      gradle = gradle.replace(/androidResources \{/, 'androidResources {\n        localeFilters += ["en"]');
    }

    if (!gradle.includes("signingConfig signingConfigs.release")) {
      throw new Error("withReleaseBuild: could not find the release build type in app/build.gradle");
    }
    mod.modResults.contents = gradle;
    return mod;
  });
}

const PROPERTIES = {
  "android.enableMinifyInReleaseBuilds": "true",
  "android.enableShrinkResourcesInReleaseBuilds": "true",
  "android.enableBundleCompression": "true",
  "expo.useLegacyPackaging": "true",
  reactNativeArchitectures: "armeabi-v7a,arm64-v8a",
};

function withSmallRelease(config) {
  return withGradleProperties(config, (mod) => {
    for (const [key, value] of Object.entries(PROPERTIES)) {
      const existing = mod.modResults.find((item) => item.type === "property" && item.key === key);
      if (existing) existing.value = value;
      else mod.modResults.push({ type: "property", key, value });
    }
    return mod;
  });
}

module.exports = (config) => withSmallRelease(withReleaseSigning(config));
