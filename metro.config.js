const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Return empty module for react-native-screens fabric files that break codegen
// with RN 0.83.2 ("Unknown prop type for type: undefined")
// Safe because newArchEnabled=false uses Old Architecture (Paper) instead of Fabric
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('react-native-screens') &&
    moduleName.includes('fabric')
  ) {
    return { type: 'empty' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
