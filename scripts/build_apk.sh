#!/usr/bin/env bash
# Build a signed release APK of the screener app on this laptop (no EAS, no account).
# Needs JDK 17 and the Android command-line tools (docs/APK.md). android/ is generated here and gitignored;
# the keystore and its password stay outside the repo.
set -euo pipefail
TOOLS=${TOOLS:-$HOME/android-toolchain}
export JAVA_HOME=${JAVA_HOME:-$TOOLS/jdk17} ANDROID_HOME=${ANDROID_HOME:-$TOOLS/sdk}
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
KEYSTORE=${KEYSTORE:-$TOOLS/shravan-setu-release.jks}
: "${SETU_KEY_PASSWORD:?set SETU_KEY_PASSWORD (the keystore password)}"

if [ ! -f "$KEYSTORE" ]; then
  keytool -genkeypair -v -keystore "$KEYSTORE" -alias shravan-setu -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$SETU_KEY_PASSWORD" -keypass "$SETU_KEY_PASSWORD" -dname "CN=Shravan Setu demo, O=Shravan Setu team"
fi

cd "$(dirname "$0")/../screener"
CI=1 npx expo prebuild --platform android --clean --no-install
# prebuild rewrites the npm scripts to expo run:*; put the Expo Go ones back
node -e 'const f=require("fs"),p=JSON.parse(f.readFileSync("package.json"));p.scripts.android="expo start --android";p.scripts.ios="expo start --ios";f.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")'

# Release signing from the keystore above instead of the template's debug key.
python3 - "$KEYSTORE" <<'PY'
import sys
p = "android/app/build.gradle"; s = open(p).read()
debug = "        debug {\n            storeFile file('debug.keystore')"
assert s.count(debug) == 1, "signingConfigs layout changed"
s = s.replace(debug, "        release {\n            storeFile file('%s')\n            storePassword System.getenv('SETU_KEY_PASSWORD')\n"
              "            keyAlias 'shravan-setu'\n            keyPassword System.getenv('SETU_KEY_PASSWORD')\n        }\n" % sys.argv[1] + debug)
rel = "            // see https://reactnative.dev/docs/signed-apk-android.\n            signingConfig signingConfigs.debug"
assert s.count(rel) == 1, "release buildType layout changed"
s = s.replace(rel, rel.replace("signingConfigs.debug", "signingConfigs.release"))
open(p, "w").write(s)
PY

# ABIS: CPU types to build. Default arm64-v8a only (the Redmi Note 11 is arm64); add more later, comma-separated,
# e.g. ABIS=arm64-v8a,armeabi-v7a. Extra arguments (e.g. --info) go to Gradle.
(cd android && ./gradlew --no-daemon assembleRelease -PreactNativeArchitectures="${ABIS:-arm64-v8a}" "$@")
cp android/app/build/outputs/apk/release/app-release.apk ../shravan-setu-v1.0.apk
sha256sum ../shravan-setu-v1.0.apk
