const path = require("path");

module.exports = function (api) {
  api.cache(true);
  let expoPreset;
  try {
    const appDir = path.resolve(__dirname, "artifacts/islamic-app");
    const expoPkg = require.resolve("expo/package.json", { paths: [appDir] });
    expoPreset = require.resolve("babel-preset-expo", {
      paths: [path.dirname(expoPkg), appDir],
    });
  } catch (e) {
    expoPreset = "babel-preset-expo";
  }
  return {
    presets: [[expoPreset, { unstable_transformImportMeta: true }]],
  };
};
