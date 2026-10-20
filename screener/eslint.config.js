// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    rules: {
      // ERR-054: <Link asChild> passes its props through a Slot, which throws on an array style (crashed the Teacher
      // tab). Navigate with router.push in onPress instead.
      'no-restricted-syntax': ['error', {
        selector: "JSXAttribute[name.name='asChild']",
        message: 'Use a Pressable with router.push instead of <Link asChild> (ERR-054).',
      }],
    },
  },
]);
