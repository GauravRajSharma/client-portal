module.exports = (api) => {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
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
