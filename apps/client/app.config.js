const githubPagesBaseUrl = process.env.EXPO_GITHUB_PAGES_BASE_URL;

module.exports = ({ config }) => {
  const experiments = {
    ...config.experiments,
  };
  const plugins = [
    ...(config.plugins ?? []),
    [
      'expo-image-picker',
      {
        photosPermission: '允许懒得动访问相册，用于上传账号头像。',
        cameraPermission: '允许懒得动访问相机，用于拍摄账号头像。',
        microphonePermission: false,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission: '允许懒得动获取当前位置，用于按出发地推荐附近玩法。',
      },
    ],
  ];

  if (githubPagesBaseUrl) {
    experiments.baseUrl = githubPagesBaseUrl;
  }

  return {
    ...config,
    experiments,
    plugins,
  };
};
