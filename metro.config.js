const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = path.resolve(__dirname, "artifacts/islamic-app");
const monorepoRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Watch both project and monorepo roots
config.watchFolders = [monorepoRoot, projectRoot];

// Resolve node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Resolve workspace libraries
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@workspace/api-client-react": path.resolve(monorepoRoot, "lib/api-client-react"),
};

module.exports = config;
