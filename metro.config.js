const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block react-native-screens fabric files from codegen processing
// (causes "Unknown prop type for type: undefined" error with RN 0.83.2 codegen)
config.resolver.blockList = [
  /node_modules\/react-native-screens\/src\/fabric\/.*/,
];

module.exports = config;
