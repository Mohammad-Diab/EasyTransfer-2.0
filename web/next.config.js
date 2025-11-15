/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure for RTL support
  i18n: {
    locales: ['ar'],
    defaultLocale: 'ar',
  },
};

module.exports = nextConfig;
