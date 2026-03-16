export default {
  expo: {
    name: "boogie",
    slug: "boogie",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    updates: {
      url: "https://u.expo.dev/48792d2d-6c62-412c-be96-5e61261e2809",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.boogie.app",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#ffffff",
      },
      package: "com.boogie.app",
    },
    extra: {
      openAiApiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
      eas: {
        projectId: "48792d2d-6c62-412c-be96-5e61261e2809",
      },
    },
  },
};