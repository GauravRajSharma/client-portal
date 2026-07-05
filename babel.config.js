module.exports = (api) => {
  api.cache(true);
  return {
    // NativeWind (jsxImportSource + preset) is the styling engine. Tamagui removed.
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // Reanimated v4 (SDK 54) moved its Babel plugin into react-native-worklets.
      "react-native-worklets/plugin",
      "@babel/plugin-transform-class-static-block",
    ],
  };
};
