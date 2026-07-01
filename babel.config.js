module.exports = (api) => {
  api.cache(true);
  return {
    // NativeWind (jsxImportSource + preset) coexists with Tamagui's compiler
    // during the migration. Both are removed once the last Tamagui import is gone.
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "@tamagui/babel-plugin",
        {
          components: ["tamagui"],
          config: "./tamagui.config.ts",
          logTimings: true,
        },
      ],

      // Reanimated v4 (SDK 54) moved its Babel plugin into react-native-worklets.
      "react-native-worklets/plugin",
      "@babel/plugin-transform-class-static-block",
    ],
  };
};
