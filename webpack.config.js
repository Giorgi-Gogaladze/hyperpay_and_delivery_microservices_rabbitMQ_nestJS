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

  options.plugins = options.plugins || [];

  // Replace generated Prisma imports that reference `.js` to `.ts` so webpack finds the sources
  const prismaGeneratedPath = path.resolve(__dirname, 'apps/identity-service/src/generated/prisma');
  options.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/\.js$/, (resource) => {
      // Only rewrite requests originating from the Prisma generated folder
      if (resource.context && resource.context.indexOf(prismaGeneratedPath) !== -1 && resource.request && resource.request.endsWith('.js')) {
        resource.request = resource.request.replace(/\.js$/, '.ts');
      }
    })
  );

  return options;
};
