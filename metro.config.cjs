// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

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

module.exports = config;
