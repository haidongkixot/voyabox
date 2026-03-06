const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Redirect react-native-screens to use pre-compiled lib/commonjs instead of
// TypeScript src/ to avoid Babel codegen errors with optional props in fabric files.
// The TypeScript source files (src/fabric/*.ts) have optional props like
// "type?: CT.WithDefault<...>" that break @react-native/babel-plugin-codegen
// in RN 0.83.2 with "Unknown prop type: undefined". The pre-compiled JS files
// have no type annotations and work correctly.
const screensRoot = path.resolve(__dirname, 'node_modules/react-native-screens');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-screens') {
    return {
      type: 'sourceFile',
      filePath: path.join(screensRoot, 'lib/commonjs/index.js'),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
