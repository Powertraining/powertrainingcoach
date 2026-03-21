// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Preserve Expo defaults and only append any missing extensions we need.
config.resolver.sourceExts = Array.from(
  new Set([...config.resolver.sourceExts, 'mjs', 'cjs'])
);

// Configure asset extensions
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
];

// Ignore generated native build artifacts so Metro doesn't spend watchers on
// Gradle/Xcode output after `expo run:android` / `expo run:ios`.
config.resolver.blockList = exclusionList([
  /android\/app\/build\/.*/,
  /android\/build\/.*/,
  /ios\/build\/.*/,
  /node_modules\/.*\/android\/build\/.*/,
  /node_modules\/.*\/ios\/build\/.*/,
]);

module.exports = config;
