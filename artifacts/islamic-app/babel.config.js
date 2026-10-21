const path = require("path");

module.exports = function (api) {
  api.cache(true);
  let expoPreset;
  try {
    const expoPkg = require.resolve("expo/package.json", { paths: [__dirname] });
    expoPreset = require.resolve("babel-preset-expo", {
      paths: [path.dirname(expoPkg), __dirname],
    });
  } catch (e) {
    expoPreset = "babel-preset-expo";
  }
  return {
    presets: [[expoPreset, { unstable_transformImportMeta: true }]],
  };
};
