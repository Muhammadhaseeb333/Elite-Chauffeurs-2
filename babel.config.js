module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
      // 👇 Required for Reanimated (must be last in the list)
      'react-native-reanimated/plugin',
    ],
  };
};
