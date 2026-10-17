// Default Expo Metro config, plus the repo's config/ folder so the app imports config/screening.json directly
// (single source of truth, no copy).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, '../config')];

module.exports = config;
