const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), require('path').resolve(__dirname, '../api/src')];

const rcComponentUtilEntry = require.resolve('@rc-component/util/es');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (context.originModulePath.includes('/api/src/') && moduleName.startsWith('./') && moduleName.endsWith('.js')) {
    return context.resolveRequest(context, moduleName.slice(0, -3), platform);
  }
  if (moduleName === '@rc-component/util') {
    return {
      filePath: rcComponentUtilEntry,
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
