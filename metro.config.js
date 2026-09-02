const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// The native app no longer imports from the sibling web project: the presentation schema and the
// engine core are file-synced copies (see src/presentation/presentationTypes.ts and src/engine/),
// each self-contained with local relative imports. Deliberately NOT adding the web project to
// watchFolders / nodeModulesPaths — doing so makes Metro resolve a second copy of `react` from
// ../physiology-app/node_modules, which breaks every hook with "Invalid hook call".

module.exports = config;
