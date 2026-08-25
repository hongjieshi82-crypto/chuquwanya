const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

const rcComponentUtilEntry = require.resolve('@rc-component/util/es');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@rc-component/util') {
    return {
      filePath: rcComponentUtilEntry,
      type: 'sourceFile',
    };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
