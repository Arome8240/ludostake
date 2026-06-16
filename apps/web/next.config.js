/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Alias away the React Native async-storage dep pulled in by MetaMask SDK
    // (browser build doesn't need it; aliasing to false tells webpack to skip it)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
    };

    // Suppress the "critical dependency: dynamic require" warning from ox/tempo
    // This is a transitive dep of viem used only in node environments
    config.module = config.module || {};
    config.module.exprContextCritical = false;

    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
