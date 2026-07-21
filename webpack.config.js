const path = require('path');
const { TsconfigPathsPlugin } = require('tsconfig-paths-webpack-plugin');

module.exports = (options, webpack) => {
  options.resolve = options.resolve || {};
  options.resolve.plugins = options.resolve.plugins || [];

  // Respect tsconfig path mappings (e.g. @app/* -> libs/*)
  options.resolve.plugins.push(
    new TsconfigPathsPlugin({ configFile: path.resolve(__dirname, 'tsconfig.json') })
  );

  // Prefer resolving TypeScript files before JS
  options.resolve.extensions = options.resolve.extensions || [];
  options.resolve.extensions = Array.from(new Set(['.ts', '.js', '.json', ...options.resolve.extensions]));

  // Resolve `.js` imports (from Prisma's generated ESM-style client) to `.ts` sources
  options.resolve.extensionAlias = {
    '.js': ['.js', '.ts'],
  };

  return options;
};