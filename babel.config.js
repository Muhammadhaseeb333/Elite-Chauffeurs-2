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
      // ⚠️ This MUST be the last plugin for Reanimated to work properly
      'react-native-reanimated/plugin',
    ],
  };
};
