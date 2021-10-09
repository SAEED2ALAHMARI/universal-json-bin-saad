/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */

 const path = require('path');

 const extraNodeModules = {
   '../../../scripts/installer/frameworks/react-native/src': path.resolve(__dirname + '/../../../scripts/installer/frameworks/react-native/src'),
   '../../examples': path.resolve(__dirname + '/../../examples'),
   '../../../scripts/generator': path.resolve(__dirname + '/../../../scripts/generator')
 };

 const watchFolders = [
   path.resolve(__dirname + '/../../../scripts/installer/frameworks/react-native/src'),
   path.resolve(__dirname + '/../../examples'),
   path.resolve(__dirname + '/../../../scripts/generator'),
 ];
 
module.exports = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    extraNodeModules: new Proxy(extraNodeModules, {
      get: (target, name) =>
        //redirects dependencies referenced from common/ to local node_modules
        name in target ? target[name] : path.join(process.cwd(), `node_modules/${name}`),
    }),
  },
  watchFolders,
};
