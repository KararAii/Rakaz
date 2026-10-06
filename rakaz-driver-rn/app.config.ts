import type { ConfigContext, ExpoConfig } from 'expo/config';

/** Injects the Google Maps key used by react-native-maps on Android (set GOOGLE_MAPS_API_KEY). */
export default ({ config }: ConfigContext): ExpoConfig => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  return {
    ...config,
    name: config.name ?? 'ركاز السائق',
    slug: config.slug ?? 'rakaz-driver-rn',
    plugins: [
      ...(config.plugins ?? []),
      ['react-native-maps', apiKey ? { androidGoogleMapsApiKey: apiKey, iosGoogleMapsApiKey: apiKey } : {}],
    ],
  };
};
